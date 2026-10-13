import json
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4


def main():
    base = sys.argv[1].rstrip("/")
    created = []

    def request(method, path, body=None, expected=200):
        payload = None if body is None else json.dumps(body).encode()
        req = Request(
            base + "/api" + path, payload,
            {"Accept": "application/json", "Content-Type": "application/json"},
            method=method,
        )
        try:
            response = urlopen(req, timeout=20)
        except HTTPError as error:
            response = error
        with response:
            raw = response.read()
            data = json.loads(raw) if raw else None
            if method == "POST" and path == "/users" and response.status == 201:
                created.append(data["id"])
            assert response.status == expected, (method, path, response.status, data)
            if response.status < 300:
                assert b'"password_hash"' not in raw and b'"password"' not in raw, raw
            return data

    email = f"crud-{uuid4().hex}@example.com"
    original = {"name": "CRUD test", "email": email, "password": "TestPass!239"}
    try:
        assert request("GET", "/health") == {"status": "ok"}
        user = request("POST", "/users", {**original, "email": "  " + email.upper() + "  "}, 201)
        user_id = user["id"]
        path = f"/users/{user_id}"
        assert user["email"] == email
        assert (user["role"], user["status"], user["preferred_locale"]) == ("candidate", "active", "ca")
        assert user["created_at"] and user["updated_at"]
        assert request("GET", path)["id"] == user_id
        page = request("GET", "/users?per_page=1&page=1")
        assert len(page["data"]) <= 1 and page["total"] >= 1
        assert request("GET", f'/users?per_page=1&page={page["last_page"]}')["data"][0]["id"] == user_id
        request("POST", "/users", original, 409)
        for changed in [
            {"name": " "}, {"email": "invalid"}, {"email": '"test user"@example.com'}, {"password": "short"},
            {"password": "é" * 37}, {"role": "other"}, {"status": "other"},
            {"preferred_locale": "other"},
        ]:
            request("POST", "/users", {**original, "email": f"invalid-{uuid4().hex}@example.com", **changed}, 422)
        request("PATCH", path, {}, 422)
        request("PATCH", path, {"email": None}, 422)
        changed = request("PATCH", path, {"name": "Edited test", "status": "blocked", "password_hash": "ignored"})
        assert changed["name"] == "Edited test" and changed["status"] == "blocked"
        replacement = {"name": "Replaced test", "email": email, "role": "company", "status": "pending", "preferred_locale": "es", "password": "ChangedPass!239"}
        replaced = request("PUT", path, replacement)
        assert all(replaced[key] == replacement[key] for key in replacement if key != "password")
        request("PUT", path, {"name": "Incomplete"}, 422)
        for identifier in ["0", "-1", "text", "9999999999999999999"]:
            request("GET", f"/users/{identifier}", expected=404)
        request("GET", "/users?per_page=101", expected=422)
        request("GET", "/users?page=0", expected=422)
        request("DELETE", path, expected=204)
        request("GET", path, expected=404)
        request("PATCH", path, {"name": "Missing"}, 404)
        request("DELETE", path, expected=404)
        created.remove(user_id)
        print("Passed: health, CRUD, pagination, defaults, normalization, validation, duplicate email, missing users, and hidden passwords.")
    finally:
        for user_id in created:
            request("DELETE", f"/users/{user_id}", expected=204)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 tests/api_smoke.py http://127.0.0.1:3000")
    main()
