import http.cookiejar
import json
import re
import sys
import struct
import zlib
import time
from urllib.error import HTTPError
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen
from uuid import uuid4


class Client:
    def __init__(self, base):
        self.base = base.rstrip('/')
        self.cookies = http.cookiejar.CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.cookies))
        self.csrf = None

    def request(self, method, path, body=None, expected=200, headers=None):
        values = {'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Origin': self.base}
        if self.csrf:
            values['X-CSRF-Token'] = self.csrf
        if isinstance(body, dict):
            values['Content-Type'] = 'application/json'
            body = json.dumps(body).encode()
        values.update(headers or {})
        req = Request(self.base + '/api' + path, body, values, method=method)
        try:
            response = self.opener.open(req, timeout=25)
        except HTTPError as error:
            response = error
        with response:
            raw = response.read()
            data = json.loads(raw) if 'application/json' in response.headers.get('Content-Type', '') else raw
            assert response.status == expected, (method, path, response.status, data)
            if isinstance(data, dict) and data.get('csrf_token'):
                self.csrf = data['csrf_token']
            if response.status < 300 and isinstance(data, dict):
                assert 'password_hash' not in json.dumps(data)
            return data

    def upload(self, path, content, filename, mime, expected=200):
        boundary = uuid4().hex
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + content + f'\r\n--{boundary}--\r\n'.encode())
        return self.request('POST', path, body, expected, {'Content-Type': 'multipart/form-data; boundary=' + boundary})


def verification(mailbox, email):
    for _ in range(30):
        with urlopen(mailbox + '/api/v1/messages', timeout=5) as response:
            messages = json.load(response)
        for message in messages['messages']:
            if any(recipient['Address'] == email for recipient in message['To']):
                with urlopen(mailbox + '/api/v1/message/' + message['ID'], timeout=5) as response:
                    text = json.load(response)['Text']
                return re.search(r'#token=([a-f0-9]{64})', text)[1]
        time.sleep(0.2)
    raise AssertionError('Verification email did not arrive')


def png():
    def chunk(kind, value):
        return struct.pack('>I', len(value)) + kind + value + struct.pack('>I', zlib.crc32(kind + value) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00\xff')) + chunk(b'IEND', b'')


def pdf():
    text = b'BT /F1 12 Tf 40 760 Td (Ada Example) Tj 0 -20 Td (ada@example.com) Tj 0 -20 Td (+34 612 345 678) Tj 0 -20 Td (https://github.com/ada-example) Tj ET'
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>', b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>', b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', b'<< /Length ' + str(len(text)).encode() + b' >>\nstream\n' + text + b'\nendstream']
    result = b'%PDF-1.4\n'
    offsets = []
    for index, obj in enumerate(objects, 1):
        offsets.append(len(result))
        result += f'{index} 0 obj\n'.encode() + obj + b'\nendobj\n'
    xref = len(result)
    result += b'xref\n0 6\n0000000000 65535 f \n' + b''.join(f'{offset:010d} 00000 n \n'.encode() for offset in offsets)
    return result + f'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode()


def main(base, mailbox):
    password = 'AccountTest!239'
    clients = {}
    invalid = Client(base)
    registration = {'name': 'Ada', 'surname': 'Example', 'email': f'invalid-{uuid4().hex}@example.com', 'password': 'weakpassword', 'password_confirmation': 'weakpassword'}
    errors = invalid.request('POST', '/candidate/register', registration, 422)['errors']
    assert 'password' in errors
    registration.update(password=password, password_confirmation=password)
    del registration['surname']
    assert 'surname' in invalid.request('POST', '/candidate/register', registration, 422)['errors']
    for role in ['candidate', 'company']:
        client = Client(base)
        email = f'{role}-{uuid4().hex}@example.com'
        body = {'name': role.title(), 'surname': 'Test', 'email': email, 'password': password, 'password_confirmation': password}
        if role == 'company':
            del body['name'], body['surname']
            body['company_name'] = 'Test Company ' + 'x' * 187
        client.request('POST', f'/{role}/register', body, 201)
        client.request('POST', f'/{role}/login', {'email': email, 'password': password}, 403)
        token = verification(mailbox, email)
        if role == 'candidate':
            previous = token
            client.request('POST', f'/{role}/verification/resend', {'email': email}, 202)
            token = verification(mailbox, email)
            assert token != previous
            client.request('POST', '/verification/verify', {'token': previous}, 422)
        assert client.request('POST', '/verification/verify', {'token': token})['role'] == role
        client.request('POST', '/verification/verify', {'token': token}, 422)
        client.request('POST', f'/{role}/login', {'email': email, 'password': password})
        data = client.request('GET', f'/{role}/me')
        assert not {'photo_path', 'logo_path', 'cv_path'} & data['profile'].keys()
        assert data['user']['status'] == 'active' and data['user']['email_verified_at']
        assert data['user']['surname'] == ('Test' if role == 'candidate' else None)
        assert data['user']['second_surname'] is None
        if role == 'company':
            assert data['user']['name'] == body['company_name'] == data['profile']['name']
        assert data['user']['onboarding_completed_at'] is None
        assert client.request('GET', '/me')['user']['id'] == data['user']['id']
        client.request('POST', f'/{role}/setup/complete', expected=422)
        assert any(cookie.name == 'feisea_test_session' and (cookie.has_nonstandard_attr('HttpOnly') or cookie.has_nonstandard_attr('httponly')) for cookie in client.cookies)
        other = 'company' if role == 'candidate' else 'candidate'
        client.request('GET', f'/{other}/me', expected=403)
        client.request('GET', '/users', expected=403)
        client.request('PATCH', f'/{role}/profile', {'name': 'Should fail'}, 419, {'X-CSRF-Token': 'invalid'})
        client.request('PATCH', f'/{role}/profile', {'name': 'Should fail'}, 403, {'Origin': 'https://untrusted.example'})
        changes = {'city': 'Barcelona', 'status': 'blocked', 'user_id': '1', 'onboarding_completed_at': '2020-01-01'}
        changes['name' if role == 'candidate' else 'company_name'] = 'Edited ' + role
        if role == 'company':
            changes.update(name='Ignore personal name', surname='Ignore surname', second_surname='Ignore second surname')
        data = client.request('PATCH', f'/{role}/profile', changes)
        assert data['user']['status'] == 'active' and data['profile']['city'] == 'Barcelona'
        assert data['user']['name'] == 'Edited ' + role
        if role == 'company':
            assert data['profile']['name'] == data['user']['name']
            assert data['user']['surname'] is None and data['user']['second_surname'] is None
        assert data['user']['onboarding_completed_at'] is None
        client.upload(f'/{role}/photo', b'not an image', 'photo.jpg', 'image/jpeg', 422)
        uploaded = client.upload(f'/{role}/photo', png(), 'photo.png', 'image/png')
        assert not {'photo_path', 'logo_path', 'cv_path'} & uploaded['profile'].keys()
        assert client.request('GET', f'/{role}/photo').startswith(b'\x89PNG')
        client.request('DELETE', f'/{role}/photo')
        client.request('GET', f'/{role}/photo', expected=404)
        clients[role] = (client, email)
    candidate, _ = clients['candidate']
    candidate.upload('/candidate/cv', b'not a pdf', 'cv.pdf', 'application/pdf', 422)
    uploaded = candidate.upload('/candidate/cv', pdf(), 'cv.pdf', 'application/pdf')
    assert 'cv_path' not in uploaded['profile']
    assert candidate.request('GET', '/candidate/cv').startswith(b'%PDF-')
    suggestions = candidate.request('POST', '/candidate/cv/extract')['suggestions']
    assert suggestions['email'] == 'ada@example.com' and 'github.com/ada-example' in suggestions['github']
    before = candidate.request('GET', '/candidate/me')['profile']
    assert before['phone'] is None
    candidate.request('DELETE', '/candidate/cv')
    candidate.request('GET', '/candidate/cv', expected=404)
    company, email = clients['company']
    company.request('GET', '/candidate/cv', expected=403)
    anonymous = Client(base)
    anonymous.request('GET', '/candidate/me', expected=401)
    anonymous.request('GET', '/users', expected=401)
    anonymous.request('POST', '/company/login', {'email': email, 'password': 'WrongPass!239'}, 401)
    anonymous.request('POST', '/candidate/login', {'email': email, 'password': password}, 401)
    anonymous.request('POST', '/admin/register', {}, 404)
    for role, (client, account_email) in clients.items():
        client.upload(f'/{role}/photo', png(), 'photo.png', 'image/png')
        if role == 'candidate':
            client.request('POST', '/candidate/setup/complete', expected=422)
            client.upload('/candidate/cv', pdf(), 'cv.pdf', 'application/pdf')
        finished = client.request('POST', f'/{role}/setup/complete')['user']['onboarding_completed_at']
        assert finished
        assert client.request('POST', f'/{role}/setup/complete')['user']['onboarding_completed_at'] == finished
        client.request('POST', '/logout')
        logged_in = client.request('POST', f'/{role}/login', {'email': account_email, 'password': password})
        assert logged_in['user']['onboarding_completed_at'] == finished
        client.request('DELETE', f'/{role}/photo')
        assert client.request('GET', f'/{role}/me')['user']['onboarding_completed_at'] == finished
        if role == 'candidate':
            client.request('DELETE', '/candidate/cv')
        client.request('POST', '/logout')
        client.request('GET', f'/{role}/me', expected=401)
    print('Passed: candidate/company registration, actual verification emails, single-use tokens, login/logout, CSRF, roles, profile ownership, private CVs, extraction previews, split names, password rules and persistent first-login setup.')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit('Usage: python3 tests/auth_smoke.py http://127.0.0.1:18081 http://127.0.0.1:18025')
    main(sys.argv[1], sys.argv[2].rstrip('/'))
