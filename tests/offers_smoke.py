import json
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError
from urllib.request import Request
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen
from uuid import uuid4

from auth_smoke import Client, pdf, png, verification, approve_company


def create_account(base, mailbox, role, domain):
    client = Client(base)
    email = f'offers-{uuid4().hex}@{domain}'
    password = 'OffersAccount!239'
    body = {'email': email, 'password': password, 'password_confirmation': password}
    if role == 'company':
        body['company_name'] = 'Offers Test Company'
    else:
        body.update(name='Ada', surname='Example')
    client.request('POST', f'/{role}/register', body, 201)
    email = email.lower()
    client.request('POST', '/verification/verify', {'token': verification(mailbox, email)})
    if role == 'company':
        approve_company(base, email)
    client.request('POST', f'/{role}/login', {'email': email, 'password': password})
    client.upload(f'/{role}/photo', png(), 'photo.png', 'image/png')
    if role == 'candidate':
        client.upload('/candidate/cv', pdf(), 'cv.pdf', 'application/pdf')
    client.request('POST', f'/{role}/setup/complete')
    return client, email


def main(base, mailbox):
    anonymous = Client(base)
    options = anonymous.request('GET', '/options')
    assert len(options['municipalities']) == 947
    assert len({town['code'] for town in options['municipalities']}) == 947
    assert {'Grau Mig', 'Grau Superior', 'Batxillerat'} == set(options['studies'])
    assert len(options['skills']) >= 20
    password = 'OffersAccount!239'
    anonymous.request('POST', '/candidate/register', {
        'name': 'Ada', 'surname': 'Example', 'email': f'{uuid4().hex}@evilcirvianum.cat',
        'password': password, 'password_confirmation': password,
    }, 422)
    company, company_email = create_account(base, mailbox, 'company', 'example.com')
    other_company, _ = create_account(base, mailbox, 'company', 'example.com')
    candidate, _ = create_account(base, mailbox, 'candidate', 'CIRVIANUM.CAT')
    other_candidate, _ = create_account(base, mailbox, 'candidate', 'alumnes.test')
    skills = [int(item['id']) for item in options['skills'][:2]]
    profile = candidate.request('PATCH', '/candidate/profile', {
        'city': 'Barcelona', 'current_studies': 'Grau Superior',
        'study_family': 'Informàtica i comunicacions', 'skill_ids': skills,
    })['profile']
    assert profile['current_studies'] == 'Grau Superior' and profile['study_family'] == 'Informàtica i comunicacions'
    assert sorted(map(int, profile['skill_ids'])) == sorted(skills)
    candidate.request('PATCH', '/candidate/profile', {'current_studies': None}, 422)
    candidate.request('PATCH', '/candidate/profile', {'city': 'Not a Catalan town'}, 422)
    candidate.request('PATCH', '/candidate/profile', {'current_studies': 'Batxillerat', 'study_family': 'Informàtica i comunicacions'}, 422)
    candidate.request('PATCH', '/candidate/profile', {'skill_ids': [9999999]}, 422)
    candidate.request('PATCH', '/candidate/profile', {'skill_ids': [skills[0], skills[0]]}, 422)
    candidate.request('PATCH', '/candidate/profile', {'skill_ids': []})
    assert candidate.request('GET', '/candidate/me')['profile']['skill_ids'] == []
    candidate.request('PATCH', '/candidate/profile', {'skill_ids': skills})
    offer_data = {
        'title': 'Test developer vacancy ' + uuid4().hex,
        'description': 'Build and maintain web applications.',
        'category_id': options['categories'][0]['id'],
        'minimum_qualification_id': options['qualifications'][0]['id'],
        'responsibilities': 'Write code and test changes.',
        'mandatory_requirements': 'Teamwork', 'desirable_requirements': 'Git',
        'offer_type': 'job', 'location': 'Barcelona', 'modality': 'hybrid',
        'contract_type': 'permanent', 'schedule': 'full_time',
        'salary_min': 20000, 'salary_max': 30000, 'salary_period': 'year',
        'immediate_start': True, 'start_date': None,
        'expires_at': (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        'status': 'draft', 'skill_ids': skills,
        'languages': [{'id': options['languages'][0]['id'], 'level': 'B2'}],
    }
    offer = company.request('POST', '/company/offers', offer_data, 201)
    offer_id = offer['id']
    anonymous.request('GET', f'/offers/{offer_id}', expected=404)
    assert not anonymous.request('GET', '/offers')['data']
    anonymous.request('POST', '/company/offers', offer_data, 401)
    candidate.request('POST', '/company/offers', offer_data, 403)
    other_company.request('GET', f'/company/offers/{offer_id}', expected=404)
    other_company.request('PUT', f'/company/offers/{offer_id}', offer_data, 404)
    other_company.request('DELETE', f'/company/offers/{offer_id}', expected=404)
    company.request('PUT', f'/company/offers/{offer_id}', dict(offer_data, salary_max=10000), 422)
    candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 409)
    offer_data['status'] = 'published'
    published = company.request('PUT', f'/company/offers/{offer_id}', offer_data)
    assert published['published_at']
    public = anonymous.request('GET', f'/offers/{offer_id}')
    assert len(public['skills']) == 2 and public['languages'][0]['pivot']['required_level'] == 'B2'
    assert 'contact_email' not in public['company'] and 'user_id' not in public['company']
    assert anonymous.request('GET', '/offers?search=vacancy&modality=hybrid&location=Barcelona')['total'] == 1
    assert anonymous.request('GET', '/offers?modality=remote')['total'] == 0
    company.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 403)
    application = candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {'message': 'I would like to apply.'}, 201)
    application_id = application['id']
    assert application['status'] == 'pending' and 'cv_snapshot_path' not in application
    candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 409)
    assert company.request('GET', '/company/offers')['data'][0]['applications_count'] == 1
    assert len(company.request('GET', '/company/notifications')) == 1
    candidate.request('DELETE', '/candidate/cv')
    assert company.request('GET', f'/company/applications/{application_id}/cv') == pdf()
    other_company.request('GET', f'/company/applications/{application_id}/cv', expected=404)
    other_company.request('GET', f'/company/offers/{offer_id}/applications', expected=404)
    other_company.request('PATCH', f'/company/applications/{application_id}', {'status': 'accepted'}, 404)
    other_candidate.request('POST', f'/candidate/applications/{application_id}/withdraw', expected=404)
    candidate.request('GET', f'/company/applications/{application_id}/cv', expected=403)
    anonymous.request('GET', f'/company/applications/{application_id}/cv', expected=401)
    applicants = company.request('GET', f'/company/offers/{offer_id}/applications')['applications']['data']
    assert applicants[0]['candidate']['user']['name'] == 'Ada'
    assert len(applicants[0]['candidate']['skills']) == 2
    assert 'cv_path' not in json.dumps(applicants) and 'password_hash' not in json.dumps(applicants)
    assert company.request('GET', '/company/notifications') == []
    company.request('PATCH', f'/company/applications/{application_id}', {'status': 'interview'})
    own = candidate.request('GET', '/candidate/applications')['data'][0]
    assert own['status'] == 'interview' and [item['new_status'] for item in own['history']] == ['pending', 'interview']
    company.request('PATCH', f'/company/applications/{application_id}', {'status': 'invalid'}, 422)
    found_email = False
    for _ in range(50):
        with urlopen(mailbox + '/api/v1/messages') as response:
            emails = json.load(response)['messages']
        found_email = any(message['Subject'] == 'New application on Feisea' and any(to['Address'] == company_email for to in message['To']) for message in emails)
        if found_email:
            break
        time.sleep(0.2)
    assert found_email, 'Application email was not delivered by the queue worker'
    candidate.request('POST', f'/candidate/applications/{application_id}/withdraw')
    company.request('PATCH', f'/company/applications/{application_id}', {'status': 'accepted'}, 409)
    assert candidate.request('GET', '/candidate/applications')['data'][0]['status'] == 'withdrawn'
    headers = {'Accept': 'application/json', 'Content-Type': 'application/json', 'Origin': base, 'X-Requested-With': 'XMLHttpRequest',
               'Cookie': '; '.join(f'{cookie.name}={cookie.value}' for cookie in other_candidate.cookies),
               'X-CSRF-Token': other_candidate.csrf}
    def concurrent_application(_):
        request = Request(base + f'/api/candidate/offers/{offer_id}/applications', b'{}', headers, method='POST')
        try:
            with urlopen(request) as response:
                return response.status
        except HTTPError as error:
            return error.code
    with ThreadPoolExecutor(max_workers=2) as executor:
        codes = sorted(executor.map(concurrent_application, range(2)))
        assert codes == [201, 409], codes
    offer_data['status'] = 'closed'
    company.request('PUT', f'/company/offers/{offer_id}', offer_data)
    anonymous.request('GET', f'/offers/{offer_id}', expected=404)
    other_candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 409)
    company.request('DELETE', f'/company/offers/{offer_id}')
    assert candidate.request('GET', '/candidate/applications')['data'] == []
    company.request('GET', f'/company/applications/{application_id}/cv', expected=404)
    if len(sys.argv) > 3:
        from pathlib import Path
        Path(sys.argv[3]).write_text(json.dumps({'company': company_email, 'candidate': candidate.request('GET', '/candidate/me')['user']['email']}))
    print('Passed: municipality/study/competency choices, multiple exact email domains, unrestricted companies, offer lifecycle, search, application uniqueness, dashboard notifications, queued emails, status history, withdrawal and private CV snapshots with ownership checks.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
