-- Additive only. Review and back up the existing database before applying.
BEGIN;
CREATE TABLE IF NOT EXISTS threadlabs_profiles (
 account_id UUID PRIMARY KEY REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 payload JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS threadlabs_media (
 id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 object_key TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS threadlabs_portfolio (
 id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 media_id UUID NOT NULL REFERENCES threadlabs_media(id), payload JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS threadlabs_portfolio_owner ON threadlabs_portfolio(account_id);
CREATE TABLE IF NOT EXISTS threadlabs_designs (
 id UUID PRIMARY KEY, account_id UUID NOT NULL REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 prompt TEXT NOT NULL, specification JSONB NOT NULL, views JSONB NOT NULL,
 seed INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS threadlabs_designs_owner ON threadlabs_designs(account_id);
CREATE TABLE IF NOT EXISTS threadlabs_conversations (
 account_id UUID PRIMARY KEY REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 messages JSONB NOT NULL DEFAULT '[]', updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS threadlabs_password_resets (
 token_hash TEXT PRIMARY KEY, account_id UUID NOT NULL REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL
);
COMMIT;
