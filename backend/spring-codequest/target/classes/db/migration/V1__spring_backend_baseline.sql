CREATE TABLE IF NOT EXISTS apis_user (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    password VARCHAR(255) DEFAULT '',
    role VARCHAR(50) NOT NULL DEFAULT 'USER',
    employee_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_apis_user_email_lower ON apis_user (LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS ux_apis_user_employee_id_lower ON apis_user (LOWER(employee_id)) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_apis_user_role ON apis_user (role);
CREATE INDEX IF NOT EXISTS ix_apis_user_full_name_lower ON apis_user (LOWER(full_name));

CREATE TABLE IF NOT EXISTS apis_module (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    "order" INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS apis_challenge (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    difficulty VARCHAR(50),
    module_id BIGINT REFERENCES apis_module(id),
    challenge_type VARCHAR(50),
    type VARCHAR(50) DEFAULT 'challenge',
    technology VARCHAR(50) DEFAULT 'html',
    starter_code JSONB,
    xp_points INTEGER DEFAULT 10,
    chatbot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_chatbot_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_id BIGINT REFERENCES apis_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_apis_challenge_module ON apis_challenge (module_id);
CREATE INDEX IF NOT EXISTS ix_apis_challenge_created_by ON apis_challenge (created_by_id);
CREATE INDEX IF NOT EXISTS ix_apis_challenge_type ON apis_challenge (challenge_type);

CREATE TABLE IF NOT EXISTS apis_testcase (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT REFERENCES apis_challenge(id) ON DELETE CASCADE,
    name VARCHAR(255),
    input_data TEXT,
    expected_output TEXT,
    is_case_sensitive BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS ix_apis_testcase_challenge ON apis_testcase (challenge_id);

CREATE TABLE IF NOT EXISTS apis_challengeassignment (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT REFERENCES apis_challenge(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES apis_user(id),
    assigned_by_id BIGINT REFERENCES apis_user(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_challenge_assignment_user UNIQUE (challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS ix_apis_challengeassignment_challenge ON apis_challengeassignment (challenge_id);
CREATE INDEX IF NOT EXISTS ix_apis_challengeassignment_user ON apis_challengeassignment (user_id);

CREATE TABLE IF NOT EXISTS apis_submission (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    challenge_id BIGINT REFERENCES apis_challenge(id),
    submitted_code TEXT,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    passed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    earned_xp INTEGER NOT NULL DEFAULT 0,
    feedback JSONB,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_apis_submission_user ON apis_submission (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_submission_challenge ON apis_submission (challenge_id);

CREATE TABLE IF NOT EXISTS apis_submissionattempt (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    challenge_id BIGINT REFERENCES apis_challenge(id),
    submitted_code TEXT,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    passed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    awarded_xp INTEGER NOT NULL DEFAULT 0,
    feedback JSONB,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_apis_submissionattempt_user ON apis_submissionattempt (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_submissionattempt_challenge ON apis_submissionattempt (challenge_id);

CREATE TABLE IF NOT EXISTS apis_challengeattempt (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    challenge_id BIGINT REFERENCES apis_challenge(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_opened_at TIMESTAMPTZ,
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_challenge_attempt_user UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS ix_apis_challengeattempt_user ON apis_challengeattempt (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_challengeattempt_challenge ON apis_challengeattempt (challenge_id);

CREATE TABLE IF NOT EXISTS apis_challengedraft (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    challenge_id BIGINT REFERENCES apis_challenge(id),
    code TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_challenge_draft_user UNIQUE (user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS ix_apis_challengedraft_user ON apis_challengedraft (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_challengedraft_challenge ON apis_challengedraft (challenge_id);

CREATE TABLE IF NOT EXISTS apis_usermoduleprogress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    module_id BIGINT REFERENCES apis_module(id),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_user_module_progress UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS ix_apis_usermoduleprogress_user ON apis_usermoduleprogress (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_usermoduleprogress_module ON apis_usermoduleprogress (module_id);

CREATE TABLE IF NOT EXISTS apis_userxp (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES apis_user(id),
    total_xp INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apis_aiinteraction (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES apis_user(id),
    challenge_id BIGINT REFERENCES apis_challenge(id),
    question TEXT,
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_apis_aiinteraction_user ON apis_aiinteraction (user_id);
CREATE INDEX IF NOT EXISTS ix_apis_aiinteraction_challenge ON apis_aiinteraction (challenge_id);

INSERT INTO apis_module (name, "order", is_active)
VALUES
    ('HTML', 1, TRUE),
    ('CSS', 2, TRUE),
    ('JS', 3, TRUE),
    ('REACT', 4, TRUE)
ON CONFLICT (name) DO NOTHING;
