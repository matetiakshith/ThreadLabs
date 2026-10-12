import pg from 'pg';

export class AccountStore {
  constructor(connectionString, { pool } = {}) {
    this.pool = pool || new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
    // Do not log connection strings or database error details.
    this.pool.on?.('error', () => console.error('Account database connection interrupted.'));
  }
  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS threadlabs_accounts (
        id UUID PRIMARY KEY, identity TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('customer', 'artisan')), artisan_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS threadlabs_sessions (
        token_hash TEXT PRIMARY KEY, account_id UUID NOT NULL REFERENCES threadlabs_accounts(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE TABLE IF NOT EXISTS threadlabs_commissions (
        id UUID PRIMARY KEY, customer_id UUID NOT NULL REFERENCES threadlabs_accounts(id),
        artisan_id TEXT NOT NULL, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS threadlabs_legacy_data (
        name TEXT PRIMARY KEY, payload JSONB NOT NULL
      );
      CREATE INDEX IF NOT EXISTS threadlabs_commissions_customer ON threadlabs_commissions(customer_id);
      CREATE INDEX IF NOT EXISTS threadlabs_commissions_artisan ON threadlabs_commissions(artisan_id);
    `);
  }
  async findAccount(identity) {
    return (await this.pool.query('SELECT id, identity, password_hash, role, artisan_id FROM threadlabs_accounts WHERE identity=$1', [identity])).rows[0];
  }
  async createAccount(account) {
    await this.pool.query('INSERT INTO threadlabs_accounts(id,identity,password_hash,role,artisan_id) VALUES($1,$2,$3,$4,$5)', [account.id, account.identity, account.password_hash, account.role, account.artisan_id || null]);
  }
  async createSession(hash, accountId, expires) {
    await this.pool.query('DELETE FROM threadlabs_sessions WHERE expires_at < NOW()');
    await this.pool.query('INSERT INTO threadlabs_sessions(token_hash,account_id,expires_at) VALUES($1,$2,$3)', [hash, accountId, expires]);
  }
  async sessionAccount(hash) {
    return (await this.pool.query('SELECT a.id,a.identity,a.role,a.artisan_id FROM threadlabs_sessions s JOIN threadlabs_accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>NOW()', [hash])).rows[0];
  }
  async deleteSession(hash) { await this.pool.query('DELETE FROM threadlabs_sessions WHERE token_hash=$1', [hash]); }
  async seedLegacy(name, payload) {
    await this.pool.query('INSERT INTO threadlabs_legacy_data(name,payload) VALUES($1,$2) ON CONFLICT(name) DO NOTHING', [name, JSON.stringify(payload)]);
  }
  async readLegacy(name) { return (await this.pool.query('SELECT payload FROM threadlabs_legacy_data WHERE name=$1', [name])).rows[0]?.payload || []; }
  async writeLegacy(name, payload) {
    await this.pool.query('INSERT INTO threadlabs_legacy_data(name,payload) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET payload=EXCLUDED.payload', [name, JSON.stringify(payload)]);
  }
  async listCommissions(user) {
    const field = user.role === 'artisan' ? 'artisan_id' : 'customer_id';
    const value = user.role === 'artisan' ? user.artisan_id : user.id;
    return (await this.pool.query(`SELECT payload FROM threadlabs_commissions WHERE ${field}=$1 ORDER BY created_at DESC LIMIT 200`, [value])).rows.map(row => row.payload);
  }
  async createCommission(user, payload) {
    await this.pool.query('INSERT INTO threadlabs_commissions(id,customer_id,artisan_id,payload) VALUES($1,$2,$3,$4)', [payload.orderId, user.id, payload.artisanId, payload]);
    return payload;
  }
  async updateCommission(user, id, stage, status, stages) {
    // Ownership and valid transitions are checked atomically in the database.
    const result = await this.pool.query(`UPDATE threadlabs_commissions
      SET payload = payload || jsonb_build_object('status', $4::text, 'currentStageIndex', $3::int)
      WHERE id=$1 AND artisan_id=$2 AND payload->>'status' <> 'Declined'
      AND (($3::int=0 AND $4::text='Declined' AND (payload->>'currentStageIndex')::int=0)
        OR ($3::int=(payload->>'currentStageIndex')::int+1
          AND $4::text=(CASE WHEN payload->>'deliveryMode'='delivery' THEN $5::jsonb ELSE $6::jsonb END)->>$3::int))
      RETURNING payload`, [id, user.artisan_id, stage, status, JSON.stringify([...stages, 'Out for Delivery', 'Delivered']), JSON.stringify([...stages, 'Ready for Pickup'])]);
    return result.rows[0]?.payload;
  }
  async close() { await this.pool.end(); }
}
