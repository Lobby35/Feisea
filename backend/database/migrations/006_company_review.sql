ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_by bigint;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS company_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'companies'::regclass AND conname = 'companies_reviewed_by_fkey') THEN
        ALTER TABLE companies ADD CONSTRAINT companies_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'notifications'::regclass AND conname = 'notifications_company_id_fkey') THEN
        ALTER TABLE notifications ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE;
        CREATE INDEX notifications_company_idx ON notifications (company_id);
    END IF;
END;
$$;
