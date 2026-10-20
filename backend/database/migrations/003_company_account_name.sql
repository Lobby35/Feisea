ALTER TABLE users ALTER COLUMN name TYPE varchar(200);

UPDATE users AS u
SET name = c.name, surname = NULL, second_surname = NULL, updated_at = CURRENT_TIMESTAMP
FROM companies AS c
WHERE u.id = c.user_id AND u.role = 'company'
    AND (u.name IS DISTINCT FROM c.name OR u.surname IS NOT NULL OR u.second_surname IS NOT NULL);
