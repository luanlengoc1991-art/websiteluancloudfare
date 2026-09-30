-- Who signed in, and whether the administrator allowed them to edit site content.
-- can_edit never grants the administrator role.
ALTER TABLE members ADD COLUMN provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE members ADD COLUMN last_login_at INTEGER;
ALTER TABLE members ADD COLUMN can_edit INTEGER NOT NULL DEFAULT 0;

CREATE TABLE auth_events(
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL,
	full_name TEXT,
	kind TEXT NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE INDEX idx_auth_events_created ON auth_events(created_at DESC);
