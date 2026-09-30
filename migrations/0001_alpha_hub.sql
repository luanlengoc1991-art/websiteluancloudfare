-- Alpha HUB on Cloudflare D1. Records hold every admin entity as JSON so the
-- admin UI can add fields without a schema change; the other tables need real
-- columns because the server queries and constrains them.
CREATE TABLE records(
	owner TEXT NOT NULL,
	kind TEXT NOT NULL,
	id TEXT NOT NULL,
	payload TEXT NOT NULL,
	updated INTEGER NOT NULL,
	PRIMARY KEY(owner, kind, id)
);

CREATE TABLE reservations(
	id TEXT PRIMARY KEY,
	owner TEXT NOT NULL,
	unit_id TEXT NOT NULL,
	customer_id TEXT NOT NULL,
	note TEXT NOT NULL,
	status TEXT NOT NULL,
	expires_at INTEGER NOT NULL,
	created_at INTEGER NOT NULL
);

CREATE INDEX idx_reservations_owner_unit ON reservations(owner, unit_id, status);

CREATE TABLE files(
	id TEXT PRIMARY KEY,
	owner TEXT NOT NULL,
	project_id TEXT NOT NULL,
	kind TEXT NOT NULL,
	name TEXT NOT NULL,
	mime TEXT NOT NULL,
	object_key TEXT NOT NULL
);

CREATE INDEX idx_files_owner ON files(owner);

-- Sessions store only a SHA-256 hash of the opaque cookie token.
CREATE TABLE sessions(
	token_hash TEXT PRIMARY KEY,
	owner TEXT NOT NULL,
	email TEXT NOT NULL,
	full_name TEXT,
	expires INTEGER NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires);

CREATE TABLE login_limits(
	id TEXT PRIMARY KEY,
	attempts INTEGER NOT NULL,
	reset_at INTEGER NOT NULL
);

-- Members sign in with email and password or with Google. Google-only accounts
-- keep password_hash NULL so no password can be guessed for them.
CREATE TABLE members(
	id TEXT PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT,
	full_name TEXT,
	created_at INTEGER NOT NULL
);
