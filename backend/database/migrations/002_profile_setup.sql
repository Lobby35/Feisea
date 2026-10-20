ALTER TABLE users ADD COLUMN IF NOT EXISTS surname varchar(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS second_surname varchar(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
