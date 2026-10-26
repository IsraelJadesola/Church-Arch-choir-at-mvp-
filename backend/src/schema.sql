CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','leader','director')),
  voice_part    TEXT CHECK (voice_part IN ('Soprano','Alto','Tenor','Bass')),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id         SERIAL PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('Rehearsal','Service')),
  title      TEXT NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  venue      TEXT,
  notes      TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id       SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status   TEXT NOT NULL CHECK (status IN ('yes','no','maybe')),
  reason   TEXT,
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id        SERIAL PRIMARY KEY,
  event_id  INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  present   BOOLEAN NOT NULL,
  marked_by INTEGER REFERENCES users(id),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS songs (
  id       SERIAL PRIMARY KEY,
  title    TEXT NOT NULL,
  composer TEXT,
  key      TEXT,
  status   TEXT NOT NULL DEFAULT 'Learning' CHECK (status IN ('Learning','Ready','Retired')),
  notes    TEXT
);

CREATE TABLE IF NOT EXISTS song_materials (
  id         SERIAL PRIMARY KEY,
  song_id    INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  voice_part TEXT NOT NULL CHECK (voice_part IN ('Soprano','Alto','Tenor','Bass','All')),
  type       TEXT NOT NULL CHECK (type IN ('audio','pdf','link')),
  url        TEXT NOT NULL,
  label      TEXT
);

CREATE TABLE IF NOT EXISTS announcements (
  id         SERIAL PRIMARY KEY,
  author_id  INTEGER REFERENCES users(id),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);