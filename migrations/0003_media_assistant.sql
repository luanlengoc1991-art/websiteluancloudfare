-- Originals remain in R2. This journal records media changes and connector consent.
CREATE TABLE media_changes(id TEXT PRIMARY KEY,target_id TEXT NOT NULL,file_id TEXT NOT NULL,previous_url TEXT NOT NULL,new_url TEXT NOT NULL,actor TEXT NOT NULL,source TEXT NOT NULL,command TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE INDEX idx_media_changes_created ON media_changes(created_at);
CREATE TABLE ai_oauth_clients(id TEXT PRIMARY KEY,name TEXT NOT NULL,redirect_uris TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE ai_oauth_codes(hash TEXT PRIMARY KEY,client_id TEXT NOT NULL,redirect_uri TEXT NOT NULL,challenge TEXT NOT NULL,email TEXT NOT NULL,resource TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE ai_oauth_connections(id TEXT PRIMARY KEY,client_id TEXT NOT NULL,email TEXT NOT NULL,created_at INTEGER NOT NULL,expires INTEGER NOT NULL,revoked INTEGER NOT NULL DEFAULT 0);
CREATE TABLE ai_oauth_tokens(connection_id TEXT NOT NULL REFERENCES ai_oauth_connections(id),hash TEXT PRIMARY KEY,refresh_hash TEXT NOT NULL UNIQUE,client_id TEXT NOT NULL,email TEXT NOT NULL,resource TEXT NOT NULL,expires INTEGER NOT NULL,refresh_expires INTEGER NOT NULL,created_at INTEGER NOT NULL);
