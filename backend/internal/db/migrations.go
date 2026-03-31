package db

import (
	"database/sql"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func Migrate(db *sql.DB) error {
	stmts := []string{
		createUsersTable,
		createProjectsTable,
		createReleasesTable,
		createShareCodesTable,
		createShareLinksTable,
		createAuditLogsTable,
		// Idempotent column additions for existing deployments
		`ALTER TABLE releases ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'feature'`,
		`ALTER TABLE releases ADD COLUMN IF NOT EXISTS min_sdk INTEGER DEFAULT 21`,
		`ALTER TABLE releases ADD COLUMN IF NOT EXISTS target_sdk INTEGER DEFAULT 34`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return err
		}
	}
	log.Println("Migrations applied")
	return seedDefaultUser(db)
}

func seedDefaultUser(db *sql.DB) error {
	seeds := []struct {
		email, password, name, role string
	}{
		{"admin@example.com", "admin123", "Admin", "admin"},
		{"dev@example.com", "dev123", "Developer", "developer"},
		{"user@example.com", "user123", "Viewer", "user"},
	}
	for _, s := range seeds {
		var count int
		if err := db.QueryRow(`SELECT COUNT(*) FROM users WHERE email = $1`, s.email).Scan(&count); err != nil {
			return err
		}
		if count > 0 {
			continue
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(s.password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		if _, err = db.Exec(
			`INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)`,
			s.email, string(hash), s.name, s.role,
		); err != nil {
			return err
		}
		log.Printf("Seeded user — email: %s  password: %s  role: %s", s.email, s.password, s.role)
	}
	return nil
}

const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    name       VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'developer',
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    updated_at TIMESTAMPTZ  DEFAULT NOW()
);`

const createProjectsTable = `
CREATE TABLE IF NOT EXISTS projects (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    description  TEXT,
    owner_id     INTEGER NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);`

const createReleasesTable = `
CREATE TABLE IF NOT EXISTS releases (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_name VARCHAR(100) NOT NULL,
    version_code INTEGER      NOT NULL,
    release_type VARCHAR(50)  NOT NULL DEFAULT 'feature',
    channel      VARCHAR(50)  NOT NULL DEFAULT 'stable',
    changelog    TEXT,
    s3_key       VARCHAR(500),
    file_size    BIGINT       DEFAULT 0,
    min_sdk      INTEGER      DEFAULT 21,
    target_sdk   INTEGER      DEFAULT 34,
    uploaded_by  INTEGER NOT NULL REFERENCES users(id),
    created_at   TIMESTAMPTZ  DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(project_id, version_code)
);`

const createShareCodesTable = `
CREATE TABLE IF NOT EXISTS share_codes (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(20) UNIQUE NOT NULL,
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    created_by  INTEGER NOT NULL REFERENCES users(id),
    expiry_time TIMESTAMPTZ NOT NULL,
    used        BOOLEAN     DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);`

const createShareLinksTable = `
CREATE TABLE IF NOT EXISTS share_links (
    id          SERIAL PRIMARY KEY,
    token       VARCHAR(64) UNIQUE NOT NULL,
    release_id  INTEGER NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    created_by  INTEGER NOT NULL REFERENCES users(id),
    expiry_time TIMESTAMPTZ NOT NULL,
    single_use  BOOLEAN     DEFAULT FALSE,
    used        BOOLEAN     DEFAULT FALSE,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);`

const createAuditLogsTable = `
CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    resource    VARCHAR(100) NOT NULL,
    resource_id INTEGER,
    details     TEXT,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);`
