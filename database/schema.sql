BEGIN;

-- 1. Tables

CREATE TABLE users (
    id bigint,
    name varchar(200),
    surname varchar(150),
    second_surname varchar(150),
    onboarding_completed_at timestamptz,
    email varchar(254),
    password_hash varchar(255),
    role varchar(20),
    status varchar(20),
    preferred_locale varchar(10),
    email_verified_at timestamptz,
    last_login_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE sectors (
    id bigint,
    name varchar(120),
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE categories (
    id bigint,
    sector_id bigint,
    name varchar(120),
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE qualifications (
    id bigint,
    code varchar(40),
    name varchar(200),
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE languages (
    id bigint,
    code varchar(10),
    name varchar(100),
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE skills (
    id bigint,
    name varchar(120),
    category varchar(100),
    active boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_profiles (
    id bigint,
    user_id bigint,
    user_role varchar(20),
    photo_path varchar(500),
    phone varchar(30),
    city varchar(120),
    mobility boolean,
    summary text,
    current_studies varchar(200),
    availability text,
    preferred_modality varchar(20),
    preferred_schedule varchar(20),
    preferred_location varchar(200),
    available_from date,
    linkedin varchar(500),
    github varchar(500),
    portfolio varchar(500),
    cv_path varchar(500),
    cv_original_name varchar(255),
    cv_mime_type varchar(100),
    cv_size_bytes bigint,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE companies (
    id bigint,
    user_id bigint,
    user_role varchar(20),
    sector_id bigint,
    name varchar(200),
    cif varchar(30),
    description text,
    website varchar(500),
    contact_email varchar(254),
    phone varchar(30),
    address varchar(255),
    city varchar(120),
    logo_path varchar(500),
    status varchar(20),
    verified_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_education (
    id bigint,
    candidate_id bigint,
    qualification_id bigint,
    specialization varchar(200),
    institution varchar(200),
    start_year smallint,
    end_year smallint,
    status varchar(20),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_courses (
    id bigint,
    candidate_id bigint,
    course_name varchar(200),
    provider varchar(200),
    duration_hours numeric(8,2),
    year smallint,
    certificate varchar(500),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_experience (
    id bigint,
    candidate_id bigint,
    company_name varchar(200),
    position varchar(200),
    functions text,
    start_date date,
    end_date date,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_languages (
    id bigint,
    candidate_id bigint,
    language_id bigint,
    level varchar(10),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE candidate_skills (
    candidate_id bigint,
    skill_id bigint,
    level smallint,
    experience_years numeric(4,1),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE job_offers (
    id bigint,
    company_id bigint,
    category_id bigint,
    minimum_qualification_id bigint,
    title varchar(200),
    description text,
    responsibilities text,
    requirements text,
    mandatory_requirements text,
    desirable_requirements text,
    minimum_experience_years numeric(4,1),
    offer_type varchar(20),
    location varchar(200),
    address varchar(255),
    modality varchar(20),
    contract_type varchar(30),
    schedule varchar(20),
    working_hours text,
    hours_per_week numeric(5,2),
    duration_months integer,
    salary_min numeric(12,2),
    salary_max numeric(12,2),
    salary_currency char(3),
    salary_period varchar(10),
    immediate_start boolean,
    start_date date,
    published_at timestamptz,
    expires_at timestamptz,
    closed_at timestamptz,
    status varchar(20),
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE job_offer_skills (
    job_offer_id bigint,
    skill_id bigint,
    required_level smallint,
    minimum_experience_years numeric(4,1),
    mandatory boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE job_offer_languages (
    job_offer_id bigint,
    language_id bigint,
    required_level varchar(10),
    mandatory boolean,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE applications (
    id bigint,
    job_offer_id bigint,
    candidate_id bigint,
    cv_snapshot_path varchar(500),
    message text,
    status varchar(20),
    status_changed_by bigint,
    withdrawn_at timestamptz,
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE application_status_history (
    id bigint,
    application_id bigint,
    previous_status varchar(20),
    new_status varchar(20),
    changed_by bigint,
    changed_at timestamptz
);

CREATE TABLE favorite_offers (
    candidate_id bigint,
    job_offer_id bigint,
    created_at timestamptz
);

CREATE TABLE notifications (
    id bigint,
    user_id bigint,
    application_id bigint,
    job_offer_id bigint,
    type varchar(80),
    data jsonb,
    read_at timestamptz,
    created_at timestamptz
);

CREATE TABLE sessions (
    id bigint,
    user_id bigint,
    token_hash char(64),
    ip_address inet,
    user_agent text,
    last_seen_at timestamptz,
    expires_at timestamptz,
    created_at timestamptz
);

CREATE TABLE auth_tokens (
    id bigint,
    user_id bigint,
    purpose varchar(30),
    token_hash char(64),
    expires_at timestamptz,
    used_at timestamptz,
    created_at timestamptz
);

-- 2. Constraints and defaults

ALTER TABLE users
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN password_hash SET NOT NULL,
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN preferred_locale SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'candidate',
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN preferred_locale SET DEFAULT 'ca',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id),
    ADD CONSTRAINT users_email_key UNIQUE (email),
    ADD CONSTRAINT users_id_role_key UNIQUE (id, role),
    ADD CONSTRAINT users_role_check CHECK (role IN ('candidate', 'company', 'admin')),
    ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'active', 'blocked')),
    ADD CONSTRAINT users_preferred_locale_check CHECK (preferred_locale IN ('ca', 'es', 'en')),
    ADD CONSTRAINT users_email_check CHECK (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
    ADD CONSTRAINT users_name_not_blank CHECK (btrim(name) <> ''),
    ADD CONSTRAINT users_email_not_blank CHECK (btrim(email) <> ''),
    ADD CONSTRAINT users_password_hash_not_blank CHECK (btrim(password_hash) <> ''),
    ADD CONSTRAINT users_role_not_blank CHECK (btrim(role) <> ''),
    ADD CONSTRAINT users_status_not_blank CHECK (btrim(status) <> ''),
    ADD CONSTRAINT users_preferred_locale_not_blank CHECK (btrim(preferred_locale) <> '');

ALTER TABLE sectors
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE sectors ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE sectors
    ALTER COLUMN active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id),
    ADD CONSTRAINT sectors_name_key UNIQUE (name),
    ADD CONSTRAINT sectors_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE categories
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE categories ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE categories
    ALTER COLUMN active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id),
    ADD CONSTRAINT categories_name_key UNIQUE (name),
    ADD CONSTRAINT categories_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE SET NULL,
    ADD CONSTRAINT categories_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE qualifications
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN code SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE qualifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE qualifications
    ALTER COLUMN active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE qualifications
    ADD CONSTRAINT qualifications_pkey PRIMARY KEY (id),
    ADD CONSTRAINT qualifications_code_key UNIQUE (code),
    ADD CONSTRAINT qualifications_code_not_blank CHECK (btrim(code) <> ''),
    ADD CONSTRAINT qualifications_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE languages
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN code SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE languages ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE languages
    ALTER COLUMN active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id),
    ADD CONSTRAINT languages_code_key UNIQUE (code),
    ADD CONSTRAINT languages_code_not_blank CHECK (btrim(code) <> ''),
    ADD CONSTRAINT languages_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE skills
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN active SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE skills ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE skills
    ALTER COLUMN active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id),
    ADD CONSTRAINT skills_name_key UNIQUE (name),
    ADD CONSTRAINT skills_name_not_blank CHECK (btrim(name) <> '');

ALTER TABLE candidate_profiles
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN user_role SET NOT NULL,
    ALTER COLUMN mobility SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_profiles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE candidate_profiles
    ALTER COLUMN user_role SET DEFAULT 'candidate',
    ALTER COLUMN mobility SET DEFAULT false,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_profiles
    ADD CONSTRAINT candidate_profiles_pkey PRIMARY KEY (id),
    ADD CONSTRAINT candidate_profiles_user_id_key UNIQUE (user_id),
    ADD CONSTRAINT candidate_profiles_user_role_check CHECK (user_role IN ('candidate')),
    ADD CONSTRAINT candidate_profiles_user_id_user_role_fkey FOREIGN KEY (user_id, user_role) REFERENCES users (id, role) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_profiles_preferred_modality_check CHECK (preferred_modality IN ('onsite', 'hybrid', 'remote')),
    ADD CONSTRAINT candidate_profiles_preferred_schedule_check CHECK (preferred_schedule IN ('full_time', 'part_time', 'flexible')),
    ADD CONSTRAINT candidate_profiles_cv_size_bytes_check CHECK (cv_size_bytes > 0),
    ADD CONSTRAINT candidate_profiles_cv_path_check CHECK (cv_path IS NULL OR btrim(cv_path) <> ''),
    ADD CONSTRAINT candidate_profiles_user_role_not_blank CHECK (btrim(user_role) <> '');

ALTER TABLE companies
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN user_role SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE companies ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE companies
    ALTER COLUMN user_role SET DEFAULT 'company',
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id),
    ADD CONSTRAINT companies_user_id_key UNIQUE (user_id),
    ADD CONSTRAINT companies_cif_key UNIQUE (cif),
    ADD CONSTRAINT companies_user_role_check CHECK (user_role IN ('company')),
    ADD CONSTRAINT companies_user_id_user_role_fkey FOREIGN KEY (user_id, user_role) REFERENCES users (id, role) ON DELETE CASCADE,
    ADD CONSTRAINT companies_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES sectors (id) ON DELETE SET NULL,
    ADD CONSTRAINT companies_status_check CHECK (status IN ('pending', 'approved', 'blocked')),
    ADD CONSTRAINT companies_cif_check CHECK (cif IS NULL OR (cif = upper(btrim(cif)) AND cif <> '')),
    ADD CONSTRAINT companies_user_role_not_blank CHECK (btrim(user_role) <> ''),
    ADD CONSTRAINT companies_name_not_blank CHECK (btrim(name) <> ''),
    ADD CONSTRAINT companies_status_not_blank CHECK (btrim(status) <> '');

ALTER TABLE candidate_education
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN qualification_id SET NOT NULL,
    ALTER COLUMN institution SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_education ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE candidate_education
    ALTER COLUMN status SET DEFAULT 'in_progress',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_education
    ADD CONSTRAINT candidate_education_pkey PRIMARY KEY (id),
    ADD CONSTRAINT candidate_education_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_education_qualification_id_fkey FOREIGN KEY (qualification_id) REFERENCES qualifications (id) ON DELETE RESTRICT,
    ADD CONSTRAINT candidate_education_status_check CHECK (status IN ('in_progress', 'completed', 'paused')),
    ADD CONSTRAINT candidate_education_start_year_check CHECK (start_year BETWEEN 1900 AND 2200),
    ADD CONSTRAINT candidate_education_end_year_check CHECK (end_year BETWEEN 1900 AND 2200),
    ADD CONSTRAINT candidate_education_end_year_check_2 CHECK (end_year >= start_year),
    ADD CONSTRAINT candidate_education_institution_not_blank CHECK (btrim(institution) <> ''),
    ADD CONSTRAINT candidate_education_status_not_blank CHECK (btrim(status) <> '');

ALTER TABLE candidate_courses
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN course_name SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_courses ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE candidate_courses
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_courses
    ADD CONSTRAINT candidate_courses_pkey PRIMARY KEY (id),
    ADD CONSTRAINT candidate_courses_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_courses_duration_hours_check CHECK (duration_hours > 0),
    ADD CONSTRAINT candidate_courses_year_check CHECK (year BETWEEN 1900 AND 2200),
    ADD CONSTRAINT candidate_courses_course_name_not_blank CHECK (btrim(course_name) <> '');

ALTER TABLE candidate_experience
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN company_name SET NOT NULL,
    ALTER COLUMN position SET NOT NULL,
    ALTER COLUMN start_date SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_experience ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE candidate_experience
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_experience
    ADD CONSTRAINT candidate_experience_pkey PRIMARY KEY (id),
    ADD CONSTRAINT candidate_experience_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_experience_end_date_check CHECK (end_date >= start_date),
    ADD CONSTRAINT candidate_experience_company_name_not_blank CHECK (btrim(company_name) <> ''),
    ADD CONSTRAINT candidate_experience_position_not_blank CHECK (btrim(position) <> '');

ALTER TABLE candidate_languages
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN language_id SET NOT NULL,
    ALTER COLUMN level SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_languages ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE candidate_languages
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_languages
    ADD CONSTRAINT candidate_languages_pkey PRIMARY KEY (id),
    ADD CONSTRAINT candidate_languages_candidate_id_language_id_key UNIQUE (candidate_id, language_id),
    ADD CONSTRAINT candidate_languages_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_languages_language_id_fkey FOREIGN KEY (language_id) REFERENCES languages (id) ON DELETE RESTRICT,
    ADD CONSTRAINT candidate_languages_level_check CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native')),
    ADD CONSTRAINT candidate_languages_level_not_blank CHECK (btrim(level) <> '');

ALTER TABLE candidate_skills
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN skill_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE candidate_skills
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE candidate_skills
    ADD CONSTRAINT candidate_skills_pkey PRIMARY KEY (candidate_id, skill_id),
    ADD CONSTRAINT candidate_skills_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT candidate_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT,
    ADD CONSTRAINT candidate_skills_level_check CHECK (level BETWEEN 1 AND 5),
    ADD CONSTRAINT candidate_skills_experience_years_check CHECK (experience_years >= 0);

ALTER TABLE job_offers
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN company_id SET NOT NULL,
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN offer_type SET NOT NULL,
    ALTER COLUMN modality SET NOT NULL,
    ALTER COLUMN contract_type SET NOT NULL,
    ALTER COLUMN schedule SET NOT NULL,
    ALTER COLUMN salary_currency SET NOT NULL,
    ALTER COLUMN salary_period SET NOT NULL,
    ALTER COLUMN immediate_start SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE job_offers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE job_offers
    ALTER COLUMN offer_type SET DEFAULT 'job',
    ALTER COLUMN modality SET DEFAULT 'onsite',
    ALTER COLUMN schedule SET DEFAULT 'full_time',
    ALTER COLUMN salary_currency SET DEFAULT 'EUR',
    ALTER COLUMN salary_period SET DEFAULT 'year',
    ALTER COLUMN immediate_start SET DEFAULT false,
    ALTER COLUMN status SET DEFAULT 'draft',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id),
    ADD CONSTRAINT job_offers_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    ADD CONSTRAINT job_offers_category_id_fkey FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    ADD CONSTRAINT job_offers_minimum_qualification_id_fkey FOREIGN KEY (minimum_qualification_id) REFERENCES qualifications (id) ON DELETE RESTRICT,
    ADD CONSTRAINT job_offers_offer_type_check CHECK (offer_type IN ('job', 'internship', 'collaboration')),
    ADD CONSTRAINT job_offers_modality_check CHECK (modality IN ('onsite', 'hybrid', 'remote')),
    ADD CONSTRAINT job_offers_contract_type_check CHECK (contract_type IN ('permanent', 'temporary', 'internship', 'freelance', 'training', 'other')),
    ADD CONSTRAINT job_offers_schedule_check CHECK (schedule IN ('full_time', 'part_time', 'flexible')),
    ADD CONSTRAINT job_offers_salary_period_check CHECK (salary_period IN ('hour', 'month', 'year')),
    ADD CONSTRAINT job_offers_status_check CHECK (status IN ('draft', 'pending', 'published', 'closed', 'rejected')),
    ADD CONSTRAINT job_offers_minimum_experience_years_check CHECK (minimum_experience_years >= 0),
    ADD CONSTRAINT job_offers_hours_per_week_check CHECK (hours_per_week > 0 AND hours_per_week <= 168),
    ADD CONSTRAINT job_offers_duration_months_check CHECK (duration_months > 0),
    ADD CONSTRAINT job_offers_salary_min_check CHECK (salary_min >= 0),
    ADD CONSTRAINT job_offers_salary_max_check CHECK (salary_max >= 0),
    ADD CONSTRAINT job_offers_salary_max_check_2 CHECK (salary_max >= salary_min),
    ADD CONSTRAINT job_offers_salary_currency_check CHECK (salary_currency ~ '^[A-Z]{3}$'),
    ADD CONSTRAINT job_offers_expires_at_check CHECK (expires_at > published_at),
    ADD CONSTRAINT job_offers_status_check_2 CHECK (status <> 'published' OR published_at IS NOT NULL),
    ADD CONSTRAINT job_offers_immediate_start_check CHECK (NOT immediate_start OR start_date IS NULL),
    ADD CONSTRAINT job_offers_title_not_blank CHECK (btrim(title) <> ''),
    ADD CONSTRAINT job_offers_description_not_blank CHECK (btrim(description) <> ''),
    ADD CONSTRAINT job_offers_offer_type_not_blank CHECK (btrim(offer_type) <> ''),
    ADD CONSTRAINT job_offers_modality_not_blank CHECK (btrim(modality) <> ''),
    ADD CONSTRAINT job_offers_contract_type_not_blank CHECK (btrim(contract_type) <> ''),
    ADD CONSTRAINT job_offers_schedule_not_blank CHECK (btrim(schedule) <> ''),
    ADD CONSTRAINT job_offers_salary_period_not_blank CHECK (btrim(salary_period) <> ''),
    ADD CONSTRAINT job_offers_status_not_blank CHECK (btrim(status) <> '');

ALTER TABLE job_offer_skills
    ALTER COLUMN job_offer_id SET NOT NULL,
    ALTER COLUMN skill_id SET NOT NULL,
    ALTER COLUMN mandatory SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE job_offer_skills
    ALTER COLUMN mandatory SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE job_offer_skills
    ADD CONSTRAINT job_offer_skills_pkey PRIMARY KEY (job_offer_id, skill_id),
    ADD CONSTRAINT job_offer_skills_job_offer_id_fkey FOREIGN KEY (job_offer_id) REFERENCES job_offers (id) ON DELETE CASCADE,
    ADD CONSTRAINT job_offer_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills (id) ON DELETE RESTRICT,
    ADD CONSTRAINT job_offer_skills_required_level_check CHECK (required_level BETWEEN 1 AND 5),
    ADD CONSTRAINT job_offer_skills_minimum_experience_years_check CHECK (minimum_experience_years >= 0);

ALTER TABLE job_offer_languages
    ALTER COLUMN job_offer_id SET NOT NULL,
    ALTER COLUMN language_id SET NOT NULL,
    ALTER COLUMN required_level SET NOT NULL,
    ALTER COLUMN mandatory SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE job_offer_languages
    ALTER COLUMN mandatory SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE job_offer_languages
    ADD CONSTRAINT job_offer_languages_pkey PRIMARY KEY (job_offer_id, language_id),
    ADD CONSTRAINT job_offer_languages_job_offer_id_fkey FOREIGN KEY (job_offer_id) REFERENCES job_offers (id) ON DELETE CASCADE,
    ADD CONSTRAINT job_offer_languages_language_id_fkey FOREIGN KEY (language_id) REFERENCES languages (id) ON DELETE RESTRICT,
    ADD CONSTRAINT job_offer_languages_required_level_check CHECK (required_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native')),
    ADD CONSTRAINT job_offer_languages_required_level_not_blank CHECK (btrim(required_level) <> '');

ALTER TABLE applications
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN job_offer_id SET NOT NULL,
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN cv_snapshot_path SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE applications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE applications
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id),
    ADD CONSTRAINT applications_job_offer_id_candidate_id_key UNIQUE (job_offer_id, candidate_id),
    ADD CONSTRAINT applications_job_offer_id_fkey FOREIGN KEY (job_offer_id) REFERENCES job_offers (id) ON DELETE CASCADE,
    ADD CONSTRAINT applications_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT applications_status_changed_by_fkey FOREIGN KEY (status_changed_by) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT applications_status_check CHECK (status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn')),
    ADD CONSTRAINT applications_status_check_2 CHECK ((status = 'withdrawn') = (withdrawn_at IS NOT NULL)),
    ADD CONSTRAINT applications_cv_snapshot_path_not_blank CHECK (btrim(cv_snapshot_path) <> ''),
    ADD CONSTRAINT applications_status_not_blank CHECK (btrim(status) <> '');

-- Deferred FK permits account deletion through overlapping cascade paths.

ALTER TABLE application_status_history
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN application_id SET NOT NULL,
    ALTER COLUMN new_status SET NOT NULL,
    ALTER COLUMN changed_at SET NOT NULL;

ALTER TABLE application_status_history ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE application_status_history
    ALTER COLUMN changed_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE application_status_history
    ADD CONSTRAINT application_status_history_pkey PRIMARY KEY (id),
    ADD CONSTRAINT application_status_history_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    ADD CONSTRAINT application_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT application_status_history_previous_status_check CHECK (previous_status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn')),
    ADD CONSTRAINT application_status_history_new_status_check CHECK (new_status IN ('pending', 'reviewed', 'interview', 'accepted', 'rejected', 'withdrawn')),
    ADD CONSTRAINT application_status_history_previous_status_check_2 CHECK (previous_status IS NULL OR previous_status <> new_status),
    ADD CONSTRAINT application_status_history_new_status_not_blank CHECK (btrim(new_status) <> '');

ALTER TABLE favorite_offers
    ALTER COLUMN candidate_id SET NOT NULL,
    ALTER COLUMN job_offer_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE favorite_offers
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE favorite_offers
    ADD CONSTRAINT favorite_offers_pkey PRIMARY KEY (candidate_id, job_offer_id),
    ADD CONSTRAINT favorite_offers_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE,
    ADD CONSTRAINT favorite_offers_job_offer_id_fkey FOREIGN KEY (job_offer_id) REFERENCES job_offers (id) ON DELETE CASCADE;

ALTER TABLE notifications
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN data SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE notifications ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE notifications
    ALTER COLUMN data SET DEFAULT '{}'::jsonb,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id),
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT notifications_application_id_fkey FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE SET NULL,
    ADD CONSTRAINT notifications_job_offer_id_fkey FOREIGN KEY (job_offer_id) REFERENCES job_offers (id) ON DELETE SET NULL,
    ADD CONSTRAINT notifications_jsonb_typeof_check CHECK (jsonb_typeof(data) = 'object'),
    ADD CONSTRAINT notifications_type_not_blank CHECK (btrim(type) <> '');

ALTER TABLE sessions
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN token_hash SET NOT NULL,
    ALTER COLUMN last_seen_at SET NOT NULL,
    ALTER COLUMN expires_at SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE sessions ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE sessions
    ALTER COLUMN last_seen_at SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id),
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT sessions_token_hash_key UNIQUE (token_hash),
    ADD CONSTRAINT sessions_token_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT sessions_expires_at_check CHECK (expires_at > created_at);

ALTER TABLE auth_tokens
    ALTER COLUMN id SET NOT NULL,
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN purpose SET NOT NULL,
    ALTER COLUMN token_hash SET NOT NULL,
    ALTER COLUMN expires_at SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE auth_tokens ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;

ALTER TABLE auth_tokens
    ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id),
    ADD CONSTRAINT auth_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT auth_tokens_token_hash_key UNIQUE (token_hash),
    ADD CONSTRAINT auth_tokens_user_id_purpose_key UNIQUE (user_id, purpose),
    ADD CONSTRAINT auth_tokens_purpose_check CHECK (purpose IN ('password_reset', 'email_verification')),
    ADD CONSTRAINT auth_tokens_token_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
    ADD CONSTRAINT auth_tokens_expires_at_check CHECK (expires_at > created_at),
    ADD CONSTRAINT auth_tokens_purpose_not_blank CHECK (btrim(purpose) <> '');

CREATE INDEX categories_sector_idx ON categories (sector_id);
CREATE INDEX companies_sector_idx ON companies (sector_id);
CREATE INDEX candidate_profiles_city_idx ON candidate_profiles (lower(city));
CREATE INDEX candidate_education_qualification_idx ON candidate_education (qualification_id, candidate_id);
CREATE INDEX candidate_education_candidate_idx ON candidate_education (candidate_id);
CREATE INDEX candidate_courses_candidate_idx ON candidate_courses (candidate_id);
CREATE INDEX candidate_experience_candidate_idx ON candidate_experience (candidate_id);
CREATE INDEX candidate_languages_language_idx ON candidate_languages (language_id, level, candidate_id);
CREATE INDEX candidate_skills_skill_idx ON candidate_skills (skill_id, candidate_id);
CREATE INDEX job_offers_company_status_idx ON job_offers (company_id, status);
CREATE INDEX job_offers_category_idx ON job_offers (category_id);
CREATE INDEX job_offers_qualification_idx ON job_offers (minimum_qualification_id);
CREATE INDEX job_offers_filters_idx ON job_offers (status, modality, contract_type, offer_type);
CREATE INDEX job_offers_location_idx ON job_offers (lower(location));
CREATE INDEX job_offers_published_idx ON job_offers (published_at DESC) WHERE status = 'published';
CREATE INDEX job_offers_expiration_idx ON job_offers (expires_at) WHERE status = 'published';
CREATE INDEX job_offer_skills_skill_idx ON job_offer_skills (skill_id, job_offer_id);
CREATE INDEX job_offer_languages_language_idx ON job_offer_languages (language_id, required_level, job_offer_id);
CREATE INDEX applications_candidate_status_idx ON applications (candidate_id, status);
CREATE INDEX applications_actor_idx ON applications (status_changed_by);
CREATE INDEX application_status_history_timeline_idx ON application_status_history (application_id, changed_at DESC, id DESC);
CREATE INDEX application_status_history_actor_idx ON application_status_history (changed_by);
CREATE INDEX favorite_offers_offer_idx ON favorite_offers (job_offer_id);
CREATE INDEX notifications_unread_idx ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notifications_user_idx ON notifications (user_id);
CREATE INDEX notifications_application_idx ON notifications (application_id);
CREATE INDEX notifications_offer_idx ON notifications (job_offer_id);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expiration_idx ON sessions (expires_at);
CREATE INDEX auth_tokens_expiration_idx ON auth_tokens (expires_at);

CREATE INDEX job_offers_search_idx ON job_offers USING gin (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(responsibilities, ''))
);

CREATE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER sectors_updated_at BEFORE UPDATE ON sectors
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER qualifications_updated_at BEFORE UPDATE ON qualifications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER languages_updated_at BEFORE UPDATE ON languages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER skills_updated_at BEFORE UPDATE ON skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_profiles_updated_at BEFORE UPDATE ON candidate_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_education_updated_at BEFORE UPDATE ON candidate_education
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_courses_updated_at BEFORE UPDATE ON candidate_courses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_experience_updated_at BEFORE UPDATE ON candidate_experience
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_languages_updated_at BEFORE UPDATE ON candidate_languages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER candidate_skills_updated_at BEFORE UPDATE ON candidate_skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER job_offers_updated_at BEFORE UPDATE ON job_offers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER job_offer_skills_updated_at BEFORE UPDATE ON job_offer_skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER job_offer_languages_updated_at BEFORE UPDATE ON job_offer_languages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER applications_updated_at BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE FUNCTION record_application_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO application_status_history (application_id, new_status, changed_by)
        VALUES (NEW.id, NEW.status, NEW.status_changed_by);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
        INSERT INTO application_status_history (application_id, previous_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.status_changed_by);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER applications_status_history
AFTER INSERT OR UPDATE OF status ON applications
FOR EACH ROW EXECUTE FUNCTION record_application_status();

COMMIT;
