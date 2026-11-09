CREATE TABLE IF NOT EXISTS jobs (
    id bigint,
    queue varchar(255),
    payload text,
    attempts smallint,
    reserved_at bigint,
    available_at bigint,
    created_at bigint
);

CREATE TABLE IF NOT EXISTS failed_jobs (
    id bigint,
    uuid varchar(255),
    connection text,
    queue text,
    payload text,
    exception text,
    failed_at timestamptz
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'jobs'::regclass AND conname = 'jobs_pkey') THEN
        ALTER TABLE jobs ALTER COLUMN id SET NOT NULL;
        ALTER TABLE jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
        ALTER TABLE jobs ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
        ALTER TABLE jobs ALTER COLUMN queue SET NOT NULL, ALTER COLUMN payload SET NOT NULL,
            ALTER COLUMN attempts SET NOT NULL, ALTER COLUMN available_at SET NOT NULL,
            ALTER COLUMN created_at SET NOT NULL;
        CREATE INDEX jobs_queue_idx ON jobs (queue);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'failed_jobs'::regclass AND conname = 'failed_jobs_pkey') THEN
        ALTER TABLE failed_jobs ALTER COLUMN id SET NOT NULL;
        ALTER TABLE failed_jobs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
        ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);
        ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_uuid_key UNIQUE (uuid);
        ALTER TABLE failed_jobs ALTER COLUMN uuid SET NOT NULL, ALTER COLUMN connection SET NOT NULL,
            ALTER COLUMN queue SET NOT NULL, ALTER COLUMN payload SET NOT NULL,
            ALTER COLUMN exception SET NOT NULL, ALTER COLUMN failed_at SET NOT NULL,
            ALTER COLUMN failed_at SET DEFAULT CURRENT_TIMESTAMP;
    END IF;
END;
$$;
