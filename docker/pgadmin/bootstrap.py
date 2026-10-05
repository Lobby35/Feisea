from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import subprocess


def registered(database, email, name):
    with closing(sqlite3.connect(f"file:{database}?mode=ro", uri=True)) as connection:
        return connection.execute(
            "SELECT 1 FROM server s JOIN user u ON u.id = s.user_id "
            "WHERE u.email = ? AND s.name = ?",
            (email, name),
        ).fetchone() is not None


def escape(value):
    return value.replace("\\", "\\\\").replace(":", "\\:")


def main():
    os.umask(0o077)
    data = Path("/var/lib/pgadmin")
    email = os.environ["PGADMIN_DEFAULT_EMAIL"]
    username = email if not email[0].isdigit() else f"pga_user_{email}"
    username = username.replace("@", "_").replace("/", "slash").replace("\\", "slash")
    storage = data / "storage" / username
    storage.mkdir(parents=True, exist_ok=True)

    passfile = storage / ".project.pgpass"
    password = os.environ["POSTGRES_PASSWORD"]
    if "\n" in password or "\r" in password:
        raise ValueError("POSTGRES_PASSWORD must fit on one pgpass line")
    passfile.write_text(
        f"db:5432:*:{escape(os.environ['POSTGRES_USER'])}:{escape(password)}\n"
    )
    passfile.chmod(0o600)

    name = "Borsa de Treball"
    server = {
        "Name": name,
        "Group": "Servers",
        "Host": "db",
        "Port": 5432,
        "MaintenanceDB": os.environ["POSTGRES_DB"],
        "Username": os.environ["POSTGRES_USER"],
        "SSLMode": "prefer",
        "ConnectionParameters": {
            "sslmode": "prefer",
            "connect_timeout": 10,
            "passfile": ".project.pgpass",
        },
    }
    servers = data / "project-servers.json"
    servers.write_text(json.dumps({"Servers": {"1": server}}))
    os.environ["PGADMIN_SERVER_JSON_FILE"] = str(servers)

    database = data / "pgadmin4.db"
    if database.exists() and not registered(database, email, name):
        subprocess.run(
            ["/venv/bin/python3", "/pgadmin4/setup.py", "load-servers",
             str(servers), "--user", email],
            cwd="/pgadmin4",
            check=True,
        )
        if not registered(database, email, name):
            raise RuntimeError("Could not register the project database in pgAdmin")

    os.execv("/entrypoint.sh", ["/entrypoint.sh"])


if __name__ == "__main__":
    main()
