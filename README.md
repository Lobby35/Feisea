# Feina

Student and company job board based on `Projecte_Borsa_de_Treball.pdf`. Laravel 12, React, PostgreSQL 16, and Docker Compose.

## Run

The server project is in `/home/srvub24/ProjecteLinkedIn`. For a fresh checkout:

```bash
cp example.env .env
```

Set the database and pgAdmin passwords, Gmail SMTP credentials, and network addresses in `.env`. Generate an `APP_KEY` and copy its output into `.env`:

```bash
python3 -c "import base64, secrets; print('base64:' + base64.b64encode(secrets.token_bytes(32)).decode())"
docker compose up -d --build
```

The server's existing `.env` already contains these values. It is ignored by Git. Keep the application key and named volumes across deployments.

## Pages

The public website is https://feina.lobby34.eu.

| Candidate | Company |
| --- | --- |
| `/candidate/register` | `/company/register` |
| `/candidate/login` | `/company/login` |
| `/candidate/dashboard` | `/company/dashboard` |

Registration creates a pending account and the corresponding profile. A single-use email link activates the account. Links expire after `AUTH_VERIFICATION_MINUTES`; a replacement can be requested on the login page. Logging in requires a verified, active account of the correct type. Company profile approval is separate from email verification.

Dashboards support profile editing, a candidate photo or company logo, and logout. Candidates can upload, download, replace, and remove a PDF CV. Photos accept JPEG, PNG, or WebP up to `PHOTO_MAX_KB`; CVs accept PDF up to `CV_MAX_KB`.

CV suggestions are extracted locally with Python and Poppler. The first ten pages are checked for a name, email, phone, LinkedIn, and GitHub. Suggestions must be reviewed and explicitly applied to empty form fields, then saved. The verified account email is never changed by extraction. Scanned PDFs require OCR, which is not included.

There is no CSS framework or custom styling. Forms, fieldsets, headings, and navigation use native HTML.

## Network access

| Service | LAN | Tailscale |
| --- | --- | --- |
| Frontend | http://192.168.0.229:3000 | http://100.88.146.37:3000 |
| API health | http://192.168.0.229:8001/api/health | http://100.88.146.37:8001/api/health |
| pgAdmin | http://192.168.0.229:5050 | http://100.88.146.37:5050 |
| PostgreSQL | `192.168.0.229:5433` | `100.88.146.37:5433` |

All four services also bind to `127.0.0.1`. Set `LAN_BIND_ADDRESS` and `TAILSCALE_BIND_ADDRESS` to addresses assigned to the Docker host. Keep the individual service bind addresses on localhost so the bindings remain distinct. Browser requests use relative `/api` URLs; `APP_URL` is used for verification emails. `APP_ALLOWED_ORIGINS` lists the permitted browser origins.

The frontend proxies requests to the API container. Database credentials and SMTP passwords are never included in the frontend build.

## Email

SMTP settings are in `.env`. The configured Gmail account requires an app password, with SMTP on port 587 and STARTTLS. Do not use a normal account password. The sender address must belong to the SMTP account.

Registration rolls back if email delivery fails. Verification tokens and session tokens are stored as SHA-256 hashes. Login sets an HttpOnly, SameSite=Lax cookie, with Secure enabled through HTTPS. State-changing requests require an allowed origin, `X-Requested-With: XMLHttpRequest`, and, when authenticated, the CSRF token returned at login or by the account endpoint. Nothing is stored in browser local storage.

## API

`{role}` is `candidate` or `company`.

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/{role}/register` | Public, rate limited |
| POST | `/api/{role}/login` | Public, rate limited |
| POST | `/api/{role}/verification/resend` | Public, rate limited |
| POST | `/api/verification/verify` | Public, single-use token |
| GET | `/api/{role}/me` | Matching verified account |
| PATCH | `/api/{role}/profile` | Own profile |
| GET / POST / DELETE | `/api/{role}/photo` | Own photo or logo |
| GET / POST / DELETE | `/api/candidate/cv` | Own CV |
| POST | `/api/candidate/cv/extract` | Own CV, rate limited |
| POST | `/api/logout` | Authenticated |

Uploads use multipart form data with a `file` field. Other writes use JSON with `Accept: application/json`. Profile updates cannot change account roles, verification status, ownership, or login email. Legacy `/api/users` CRUD routes require a verified administrator and are blocked by the public Nginx host; there is no public administrator registration.

## Data and storage

`database/schema.sql` creates the initial empty database tables in two phases: columns first, then constraints and defaults. Initialization runs only with an empty PostgreSQL volume. Database creation for manual pgAdmin execution is in `database/create_database.sql`.

The API applies the idempotent candidate photo-column migration at startup. It does not rebuild the schema or insert seed accounts.

- `postgres_data`: application data.
- `pgadmin_data`: pgAdmin accounts and preconfigured database connection.
- `api_storage`: private uploads and application cache.

Uploaded files are outside the public document root and served through authenticated owner-only endpoints. Replacing or removing a file also removes the previous stored file. `docker compose down` preserves volumes; `docker compose down -v` deletes them.

## Server Nginx

The active host configuration is `/home/srvub24/Nginx/feina.lobby34.eu.conf`, with its source in `deploy/nginx/feina.lobby34.eu.conf`. It proxies to the frontend's LAN port, redirects HTTP to HTTPS, and uses the existing Certbot certificate volume and ACME webroot. `deploy/nginx/feina.http.conf` is the initial HTTP-only configuration for issuing a certificate on a new server.

The server Compose file includes a read-only mount for this host. The running proxy was updated through a validated reload; the shared Nginx container and other site configurations were preserved.

Validate before reloading:

```bash
docker exec lobby34_nginx nginx -t
docker exec lobby34_nginx nginx -s reload
```

Renew this certificate with the existing Certbot service, then validate and reload:

```bash
docker compose -f /home/srvub24/Nginx/docker-compose.yml run --rm certbot renew --cert-name feina.lobby34.eu
docker exec lobby34_nginx nginx -t
docker exec lobby34_nginx nginx -s reload
```

## Tests

Authentication tests use a separate database, private storage volume, and Mailpit SMTP server. No Gmail messages are sent by this test stack.

```bash
docker compose build
docker compose -p feina-auth-tests -f compose.yaml -f tests/compose.auth.yaml up -d --no-build db mailpit api frontend
python3 tests/auth_smoke.py http://127.0.0.1:18081 http://127.0.0.1:18025
docker compose -p feina-auth-tests -f compose.yaml -f tests/compose.auth.yaml down -v
```

The final command removes only the named test project's data. The tests exercise both account types, email delivery and link consumption, login/logout, CSRF, role boundaries, file validation and access, profile ownership, and CV extraction previews.

Database constraint tests run in a transaction:

```bash
docker compose exec -T db sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < tests/schema.sql
```

Use a development database without the fixture accounts. Identity sequences may advance even when fixture data is rolled back.

## Git

Authentication work is on `develop/auth-profiles`, based on `develop/user-crud` and `develop/db`. `main` remains unmerged.
