import json
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from uuid import uuid4

from auth_smoke import Client, pdf, verification, admin_client

PASSWORD = 'AdminFlowTest!239'


def register(base, role, name):
    client = Client(base)
    domain = 'cirvianum.cat' if role == 'candidate' else 'example.com'
    email = f'admin-flow-{uuid4().hex}@{domain}'
    data = {'email': email, 'password': PASSWORD, 'password_confirmation': PASSWORD}
    if role == 'company':
        data['company_name'] = name
    else:
        data.update(name=name, surname='Example')
    client.request('POST', f'/{role}/register', data, 201)
    return client, email


def verify(client, mailbox, email):
    token = verification(mailbox, email)
    return client.request('POST', '/verification/verify', {'token': token})


def login(client, role, email, expected=200):
    return client.request('POST', f'/{role}/login', {'email': email, 'password': PASSWORD}, expected)


def wait_for_admin_email(mailbox, company_name, company_id):
    for _ in range(60):
        with urlopen(mailbox + '/api/v1/messages') as response:
            messages = json.load(response)['messages']
        for message in messages:
            if message['Subject'] != 'Company registration on Feisea':
                continue
            if not any(recipient['Address'] == 'admin@example.com' for recipient in message['To']):
                continue
            with urlopen(mailbox + '/api/v1/message/' + message['ID']) as response:
                text = json.load(response)['Text']
            if company_name in text:
                assert f'/admin/companies/{company_id}' in text
                return
        time.sleep(.2)
    raise AssertionError('No administrator registration email')


def main(base, mailbox):
    anonymous = Client(base)
    anonymous.request('GET', '/admin/summary', expected=401)
    anonymous.request('POST', '/admin/register', {}, 404)
    admin = admin_client(base)
    me = admin.request('GET', '/me')
    assert me['user']['role'] == 'admin' and me['profile'] == []
    admin_id = me['user']['id']
    admin.request('PATCH', f'/admin/users/{admin_id}', {'status': 'blocked'}, 403)
    admin.request('DELETE', f'/admin/users/{admin_id}', expected=403)

    name = 'Approval first ' + uuid4().hex
    company, email = register(base, 'company', name)
    company_record = admin.request('GET', '/admin/companies?search=' + email)['data'][0]
    company_id = company_record['id']
    assert company_record['status'] == 'pending'
    assert company_record['user']['email_verified_at'] is None
    notifications = admin.request('GET', '/admin/summary')['notifications']
    assert any(item['company_id'] == company_id for item in notifications)
    wait_for_admin_email(mailbox, name, company_id)
    reviewed = admin.request('PATCH', f'/admin/companies/{company_id}', {'status': 'approved'})
    assert reviewed['reviewed_by'] == int(admin_id) and reviewed['reviewed_at']
    assert reviewed['verified_at'] and 'logo_path' not in reviewed
    login(company, 'company', email, 403)
    assert 'now log in' in verify(company, mailbox, email)['message']
    login(company, 'company', email)
    finished = company.request('POST', '/company/setup/complete')
    assert finished['user']['onboarding_completed_at'] and finished['photo_url'] is None

    pending, pending_email = register(base, 'company', 'Email first ' + uuid4().hex)
    pending_record = admin.request('GET', '/admin/companies?search=' + pending_email)['data'][0]
    pending_id = pending_record['id']
    assert 'administrator approval' in verify(pending, mailbox, pending_email)['message']
    login(pending, 'company', pending_email, 403)
    admin.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'unknown'}, 422)
    admin.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'approved'}, 419, {'X-CSRF-Token': 'invalid'})
    approved = admin.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'approved'})
    assert approved['status'] == 'approved'
    login(pending, 'company', pending_email)
    pending.request('GET', '/admin/summary', expected=403)
    pending.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'approved'}, 403)
    admin.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'blocked'})
    pending.request('GET', '/company/me', expected=401)
    login(pending, 'company', pending_email, 403)
    admin.request('PATCH', f'/admin/companies/{pending_id}', {'status': 'pending'})

    candidate, candidate_email = register(base, 'candidate', 'Candidate')
    verify(candidate, mailbox, candidate_email)
    login(candidate, 'candidate', candidate_email)
    profile = candidate.request('GET', '/candidate/me')
    candidate_id = profile['user']['id']
    assert profile['photo_url'] is None and 'availability' not in profile['profile']
    candidate.request('PATCH', '/candidate/profile', {'availability': 'Weekends'})
    assert 'availability' not in candidate.request('GET', '/candidate/me')['profile']
    candidate.request('POST', '/candidate/setup/complete', expected=422)
    candidate.upload('/candidate/cv', pdf(), 'cv.pdf', 'application/pdf')
    setup = candidate.request('POST', '/candidate/setup/complete')
    assert setup['user']['onboarding_completed_at'] and setup['photo_url'] is None
    candidate.request('GET', '/admin/users', expected=403)
    candidate.request('PATCH', f'/admin/companies/{company_id}', {'status': 'approved'}, 403)
    candidate.request('DELETE', f'/admin/users/{admin_id}', expected=403)

    options = anonymous.request('GET', '/options')
    offer = company.request('POST', '/company/offers', {
        'title': 'Admin offer ' + uuid4().hex, 'description': 'Review offer moderation.',
        'category_id': options['categories'][0]['id'], 'location': 'Barcelona',
        'offer_type': 'job', 'modality': 'onsite', 'contract_type': 'permanent',
        'schedule': 'full_time', 'salary_period': 'year', 'immediate_start': True,
        'status': 'published', 'skill_ids': [], 'languages': [],
    }, 201)
    offer_id = offer['id']
    anonymous.request('GET', f'/offers/{offer_id}')
    admin.request('PATCH', f'/admin/companies/{company_id}', {'status': 'blocked'})
    company.request('GET', '/company/me', expected=401)
    anonymous.request('GET', f'/offers/{offer_id}', expected=404)
    candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 409)
    admin.request('PATCH', f'/admin/companies/{company_id}', {'status': 'approved'})
    login(company, 'company', email)
    candidate.request('POST', f'/candidate/offers/{offer_id}/applications', {}, 201)
    assert any(item['id'] == offer_id for item in admin.request('GET', '/admin/offers')['data'])
    candidate.request('POST', f'/admin/offers/{offer_id}/close', expected=403)
    admin.request('POST', f'/admin/offers/{offer_id}/close')
    anonymous.request('GET', f'/offers/{offer_id}', expected=404)
    admin.request('DELETE', f'/admin/offers/{offer_id}')
    assert candidate.request('GET', '/candidate/applications')['data'] == []

    admin.request('PATCH', f'/admin/users/{candidate_id}', {'status': 'blocked', 'role': 'admin'})
    candidate.request('GET', '/candidate/me', expected=401)
    user = admin.request('PATCH', f'/admin/users/{candidate_id}', {'status': 'active'})
    assert user['role'] == 'candidate'
    login(candidate, 'candidate', candidate_email)
    unverified, unverified_email = register(base, 'company', 'Delete test')
    record = admin.request('GET', '/admin/companies?search=' + unverified_email)['data'][0]
    unverified_id = record['user']['id']
    admin.request('PATCH', f'/admin/users/{unverified_id}', {'status': 'active'}, 422)
    admin.request('DELETE', f'/admin/users/{unverified_id}')
    admin.request('GET', f"/admin/companies/{record['id']}", expected=404)
    assert not admin.request('GET', '/admin/users?search=' + unverified_email)['data']
    assert admin.request('GET', '/admin/companies?status=pending&search=' + pending_email)['total'] == 1
    if len(sys.argv) > 3:
        Path(sys.argv[3]).write_text(json.dumps({'company_email': pending_email, 'company_id': pending_id, 'candidate_email': candidate_email, 'candidate_id': candidate_id, 'password': PASSWORD}))
    print('Passed: admin login and permissions, registration emails to admins, approval before/after email verification, pending/blocked access, optional photos with required CV, removed availability, review audit, account moderation, self-protection, offer moderation and deletion.')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
