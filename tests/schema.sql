BEGIN;

CREATE FUNCTION pg_temp.expect_failure(statement text, expected_state text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE statement;
    EXCEPTION WHEN OTHERS THEN
        IF SQLSTATE = expected_state THEN
            RETURN;
        END IF;
        RAISE;
    END;
    RAISE EXCEPTION 'Expected SQLSTATE %, but statement succeeded: %', expected_state, statement;
END;
$$;

DO $$
DECLARE
    candidate_user bigint;
    company_user bigint;
    candidate bigint;
    company bigint;
    offer bigint;
    application bigint;
    qualification bigint;
    language bigint;
    skill bigint;
BEGIN
    INSERT INTO users (name, email, password_hash)
    VALUES ('Test Candidate', 'candidate@example.test', 'test-hash') RETURNING id INTO candidate_user;
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Test Company', 'company@example.test', 'test-hash', 'company') RETURNING id INTO company_user;
    INSERT INTO candidate_profiles (user_id) VALUES (candidate_user) RETURNING id INTO candidate;
    INSERT INTO companies (user_id, name) VALUES (company_user, 'Test Company') RETURNING id INTO company;
    INSERT INTO qualifications (code, name) VALUES ('DAW', 'Web development') RETURNING id INTO qualification;
    INSERT INTO languages (code, name) VALUES ('en', 'English') RETURNING id INTO language;
    INSERT INTO skills (name) VALUES ('JavaScript') RETURNING id INTO skill;
    INSERT INTO candidate_education (candidate_id, qualification_id, institution)
    VALUES (candidate, qualification, 'Test School');
    INSERT INTO candidate_languages (candidate_id, language_id, level) VALUES (candidate, language, 'B2');
    INSERT INTO candidate_skills (candidate_id, skill_id, level) VALUES (candidate, skill, 3);
    INSERT INTO job_offers (company_id, title, description, contract_type, minimum_qualification_id)
    VALUES (company, 'Web developer', 'Build web applications', 'permanent', qualification) RETURNING id INTO offer;
    INSERT INTO job_offer_languages (job_offer_id, language_id, required_level) VALUES (offer, language, 'B2');
    INSERT INTO job_offer_skills (job_offer_id, skill_id, required_level) VALUES (offer, skill, 3);
    INSERT INTO applications (job_offer_id, candidate_id, cv_snapshot_path, status_changed_by)
    VALUES (offer, candidate, 'private/applications/test-cv.pdf', candidate_user) RETURNING id INTO application;
    INSERT INTO favorite_offers (candidate_id, job_offer_id) VALUES (candidate, offer);

    IF (SELECT status FROM job_offers WHERE id = offer) <> 'draft'
       OR (SELECT status FROM applications WHERE id = application) <> 'pending'
       OR (SELECT status FROM companies WHERE id = company) <> 'pending' THEN
        RAISE EXCEPTION 'Incorrect initial statuses';
    END IF;
    IF (SELECT count(*) FROM application_status_history WHERE application_id = application) <> 1 THEN
        RAISE EXCEPTION 'Missing initial status history';
    END IF;

    PERFORM pg_temp.expect_failure(format('INSERT INTO users (name, email, password_hash) VALUES (%L, %L, %L)',
        'Duplicate', 'candidate@example.test', 'test-hash'), '23505');
    PERFORM pg_temp.expect_failure(format('INSERT INTO users (name, email, password_hash) VALUES (%L, %L, %L)',
        'Mixed Case', 'Candidate@Example.test', 'test-hash'), '23514');
    PERFORM pg_temp.expect_failure(format('INSERT INTO candidate_profiles (user_id) VALUES (%s)', company_user), '23503');
    PERFORM pg_temp.expect_failure(format('INSERT INTO companies (user_id, name) VALUES (%s, %L)', candidate_user, 'Wrong role'), '23503');
    PERFORM pg_temp.expect_failure(format('UPDATE users SET role = %L WHERE id = %s', 'admin', candidate_user), '23503');
    PERFORM pg_temp.expect_failure(format('INSERT INTO applications (job_offer_id, candidate_id, cv_snapshot_path) VALUES (%s, %s, %L)',
        offer, candidate, 'private/duplicate.pdf'), '23505');
    PERFORM pg_temp.expect_failure(format('UPDATE applications SET cv_snapshot_path = NULL WHERE id = %s', application), '23502');
    PERFORM pg_temp.expect_failure(format('UPDATE applications SET status = %L WHERE id = %s', 'invalid', application), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE applications SET status = %L WHERE id = %s', 'withdrawn', application), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE job_offers SET salary_min = 100, salary_max = 50 WHERE id = %s', offer), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE job_offers SET status = %L WHERE id = %s', 'published', offer), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE job_offers SET immediate_start = true, start_date = CURRENT_DATE WHERE id = %s', offer), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE candidate_languages SET level = %L WHERE candidate_id = %s', 'B7', candidate), '23514');
    PERFORM pg_temp.expect_failure(format('UPDATE candidate_skills SET level = 6 WHERE candidate_id = %s', candidate), '23514');
    PERFORM pg_temp.expect_failure(format('INSERT INTO candidate_education (candidate_id, qualification_id, institution, start_year, end_year) VALUES (%s, %s, %L, 2026, 2025)',
        candidate, qualification, 'Wrong Dates'), '23514');
    PERFORM pg_temp.expect_failure(format('DELETE FROM qualifications WHERE id = %s', qualification), '23503');

    UPDATE applications SET status = 'reviewed', status_changed_by = company_user WHERE id = application;
    UPDATE applications SET message = 'Updated message' WHERE id = application;
    IF (SELECT count(*) FROM application_status_history WHERE application_id = application) <> 2
       OR NOT EXISTS (SELECT 1 FROM application_status_history WHERE application_id = application
           AND previous_status = 'pending' AND new_status = 'reviewed' AND changed_by = company_user) THEN
        RAISE EXCEPTION 'Incorrect status history';
    END IF;
    UPDATE applications SET status = 'withdrawn', withdrawn_at = CURRENT_TIMESTAMP, status_changed_by = candidate_user
    WHERE id = application;

    UPDATE candidate_profiles SET updated_at = '2000-01-01', cv_path = 'private/candidates/new-cv.pdf' WHERE id = candidate;
    IF (SELECT updated_at FROM candidate_profiles WHERE id = candidate) <> CURRENT_TIMESTAMP
       OR (SELECT cv_snapshot_path FROM applications WHERE id = application) <> 'private/applications/test-cv.pdf' THEN
        RAISE EXCEPTION 'Timestamp or CV snapshot changed incorrectly';
    END IF;
    UPDATE job_offers SET status = 'published', published_at = CURRENT_TIMESTAMP,
        expires_at = CURRENT_TIMESTAMP + interval '1 month' WHERE id = offer;
    IF NOT EXISTS (SELECT 1 FROM job_offers WHERE id = offer
        AND to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(responsibilities, ''))
            @@ plainto_tsquery('simple', 'web developer')) THEN
        RAISE EXCEPTION 'Search did not find the offer';
    END IF;

    INSERT INTO notifications (user_id, application_id, job_offer_id, type)
    VALUES (company_user, application, offer, 'application.submitted');
    DELETE FROM users WHERE id = candidate_user;
    IF EXISTS (SELECT 1 FROM candidate_profiles WHERE id = candidate)
       OR EXISTS (SELECT 1 FROM applications WHERE id = application)
       OR EXISTS (SELECT 1 FROM application_status_history WHERE application_id = application)
       OR EXISTS (SELECT 1 FROM favorite_offers WHERE candidate_id = candidate)
       OR NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = company_user AND application_id IS NULL) THEN
        RAISE EXCEPTION 'Incorrect deletion behavior';
    END IF;
END;
$$;

SET CONSTRAINTS ALL IMMEDIATE;

ROLLBACK;
