# Borsa de Treball

PostgreSQL starter for the student/company job board described in `Projecte_Borsa_de_Treball.pdf`. All 13 pages were reviewed. PostgreSQL follows the requested stack; the PDF recommends MySQL/MariaDB.

## Start

Run from this directory:

```bash
docker compose up -d --build
docker compose ps
```

The first startup creates `borsa_de_treball`, the `Lobby34` database user, and 22 empty application tables. The supplied `.env` contains the requested password. `.env` is ignored by Git and excluded from Docker builds; `example.env` contains a placeholder.

For another developer or a fresh clone:

```bash
cp example.env .env
```

Set the password in `.env` before starting Docker. Keep its single quotes so special characters remain literal.

PostgreSQL 16 is used, with persistent storage in the `postgres_data` volume. Initialization SQL and `POSTGRES_*` credentials apply only on first startup with an empty volume. SQL changes require a migration on an existing database; rebuilding the image does not rerun the schema.

## pgAdmin web client

The same `docker compose up -d --build` command starts PostgreSQL and pgAdmin. Open `http://<server-ip>:<PGADMIN_PORT>` using the address and port configured in `.env` (`http://localhost:5050` with the example configuration). Log in using `PGADMIN_DEFAULT_EMAIL` and `PGADMIN_DEFAULT_PASSWORD` from `.env`. The default login email is `admin@example.com`; its separately generated password is stored only in `.env`.

After login, expand **Servers > Borsa de Treball**. The connection is registered automatically for `PGADMIN_DEFAULT_EMAIL`, with these settings from `.env`:

| Setting | Value |
| --- | --- |
| Host | `db` |
| Port | `5432` |
| Maintenance database | `POSTGRES_DB` from `.env` (`borsa_de_treball` by default) |
| Username | `POSTGRES_USER` from `.env` (`Lobby34` by default) |
| Password | `POSTGRES_PASSWORD` from `.env`, without the surrounding quotes |

`docker/pgadmin/bootstrap.py` creates the connection on both new and existing pgAdmin volumes, without duplicating it on restart or removing other servers. It writes a private password file inside `pgadmin_data`, so opening the connection does not require typing the database password. Credentials come from `.env`; no passwords are stored in the bootstrap script or committed to Git.

Use the same pgAdmin account from each computer. Clearing cookies only requires logging in again; the connection stays in `pgadmin_data`. Registration settings are kept after creation, so edit the server in pgAdmin if you later change its database or username. The password file is refreshed from `.env` whenever the container starts.

The pgAdmin web login and PostgreSQL login are separate accounts. Use `db` as the connection host because pgAdmin runs inside the Compose network. A desktop installation of pgAdmin on the same computer uses `127.0.0.1` and `POSTGRES_PORT` instead.

Database data persists in `postgres_data`; pgAdmin accounts, server registrations and settings persist in `pgadmin_data`. `docker compose down` preserves both volumes. Avoid `docker compose down -v` unless you intend to delete both sets of data. pgAdmin's default login variables initialize its first account only when its configuration database is new; change an existing account's password through the web UI.

The web client binds to localhost by default. To access it from another computer, set `PGADMIN_BIND_ADDRESS=0.0.0.0` in `.env`, recreate the pgAdmin service, and open `http://<server-ip>:5050`. Change `PGADMIN_PORT` if port 5050 is already in use.

Docker initializes the schema automatically. For manual initialization of an empty database in pgAdmin:

1. On a PostgreSQL server where `Lobby34` already exists, open the Query Tool on `postgres` with **Auto-commit enabled**. Execute `database/create_database.sql` once. Skip this step if Docker has already created the database.
2. Open a **new Query Tool connection** on `borsa_de_treball` and execute `database/schema.sql` once.

PostgreSQL cannot switch databases inside an ordinary SQL script, so database creation and schema creation are separate files. Both work in pgAdmin without psql commands. If you rename `POSTGRES_DB` or `POSTGRES_USER` in `.env`, adjust `create_database.sql` to match; pgAdmin cannot read `.env` itself. A separate existing PostgreSQL server needs the `Lobby34` login created in pgAdmin with the password from `.env`; Docker creates it automatically.

`schema.sql` first creates every table with only column names and types. The second section uses `ALTER TABLE` for primary/foreign keys, identity columns, unique constraints, required fields, checks, and defaults. Indexes and triggers follow. No accounts, catalogs, sample data, or seed rows are inserted.

## Schema

See [the database design](docs/schema.md) for tables, relationships, states, and implementation decisions.

## Tests

```bash
docker compose exec -T db sh -c 'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < tests/schema.sql
```

Run this against a development database without the test fixture accounts. Tests exercise relational constraints, role consistency, duplicate applications, date/salary/skill validation, CV snapshots, status history, search, and account deletion. Test data rolls back; generated identity sequences can still advance.

## Stop

```bash
docker compose down
```

This preserves database data. Removing the named volume permanently removes its data.

## Expand

Add frontend/backend services under `services` in `compose.yaml`. They share the default Compose network and should use `db` as the database host. For a backend that needs PostgreSQL immediately, use `depends_on` with `condition: service_healthy`. Add its configuration to `.env` and placeholders to `example.env`.

The supplied database account is a development database administrator, separate from application users stored in `users`.

## Git

The local repository has a baseline commit on `main` and the database setup on `develop/db`. The development branch is left unmerged. No remote repository has been created or configured.
