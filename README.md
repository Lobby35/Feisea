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

## pgAdmin

Register a server using:

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `5432` |
| Maintenance database | `borsa_de_treball` |
| Username | `Lobby34` |
| Password | `POSTGRES_PASSWORD` from `.env`, without the surrounding quotes |

The host and port come from `.env`; use your configured values if changed. This connection is for pgAdmin running on the same computer. Future containers connect to `db:5432`.

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
