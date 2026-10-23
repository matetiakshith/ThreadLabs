import fs from 'node:fs/promises';
export async function migratePhase2(store, { backup = false } = {}) {
  let sql=await fs.readFile(new URL('../migrations/002_phase2.sql', import.meta.url), 'utf8');
  if(backup) sql=sql.replace('BEGIN;', `BEGIN;
    -- Durable rollout recovery snapshot; private server-side DB, never exposed by an API.
    -- Same transaction as the additive migration. Existing account tables are untouched.
    CREATE TABLE IF NOT EXISTS threadlabs_rollout_backups (
      name TEXT PRIMARY KEY, payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    INSERT INTO threadlabs_rollout_backups(name,payload)
      SELECT 'phase2-baseline',jsonb_build_object(
        'accounts',(SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM threadlabs_accounts t),
        'sessions',(SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM threadlabs_sessions t),
        'commissions',(SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM threadlabs_commissions t),
        'legacyData',(SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM threadlabs_legacy_data t)
      ) ON CONFLICT(name) DO NOTHING;
  `);
  await store.pool.query(sql);
}

export async function phase2Ready(store) {
  if (!store) return false;
  return !!(await store.pool.query("SELECT to_regclass('threadlabs_profiles') AS table_name")).rows[0]?.table_name;
}
export async function recoverySnapshotReady(store) {
  if(!store||!(await store.pool.query("SELECT to_regclass('threadlabs_rollout_backups') AS table_name")).rows[0]?.table_name)return false;
  return !!(await store.pool.query("SELECT name FROM threadlabs_rollout_backups WHERE name='phase2-baseline'")).rows.length;
}
export class Phase2Store {
  constructor(store) { this.pool = store.pool; }
  async profile(user) { return (await this.pool.query('SELECT payload FROM threadlabs_profiles WHERE account_id=$1', [user.id])).rows[0]?.payload || {}; }
  async saveProfile(user, profile) {
    await this.pool.query('INSERT INTO threadlabs_profiles(account_id,payload) VALUES($1,$2) ON CONFLICT(account_id) DO UPDATE SET payload=EXCLUDED.payload,updated_at=NOW()', [user.id, profile]); return profile;
  }
  async media(user, id) { return (await this.pool.query('SELECT object_key FROM threadlabs_media WHERE id=$1 AND account_id=$2', [id,user.id])).rows[0]?.object_key; }
  async saveMedia(user, id, key) { await this.pool.query('INSERT INTO threadlabs_media(id,account_id,object_key) VALUES($1,$2,$3)', [id,user.id,key]); }
  async portfolio(user) { return (await this.pool.query('SELECT id,media_id AS "mediaId",payload FROM threadlabs_portfolio WHERE account_id=$1 ORDER BY created_at DESC', [user.id])).rows.map(r=>({id:r.id,mediaId:r.mediaId,...r.payload})); }
  async addPortfolio(user, id, mediaId, payload) { await this.pool.query('INSERT INTO threadlabs_portfolio(id,account_id,media_id,payload) VALUES($1,$2,$3,$4)', [id,user.id,mediaId,payload]); }
  async editPortfolio(user,id,payload,mediaId=null) { return (await this.pool.query('UPDATE threadlabs_portfolio SET payload=$3,media_id=COALESCE($4,media_id) WHERE id=$1 AND account_id=$2 RETURNING id', [id,user.id,payload,mediaId])).rowCount; }
  async deletePortfolio(user,id) { return (await this.pool.query('DELETE FROM threadlabs_portfolio WHERE id=$1 AND account_id=$2 RETURNING id', [id,user.id])).rowCount; }
  async designs(user) { return (await this.pool.query('SELECT id,prompt,created_at FROM threadlabs_designs WHERE account_id=$1 ORDER BY created_at DESC LIMIT 100', [user.id])).rows; }
  async design(user,id) {
    await this.pool.query(`UPDATE threadlabs_designs SET views=(SELECT jsonb_agg(CASE WHEN v->>'status'='processing' AND (v->>'startedAt')::timestamptz<NOW()-INTERVAL '5 minutes' THEN v || jsonb_build_object('status',CASE WHEN v ? 'mediaId' THEN 'ready' ELSE 'failed' END,'error','Generation was interrupted. You can retry this view.') ELSE v END) FROM jsonb_array_elements(views) v) WHERE id=$1 AND account_id=$2 AND EXISTS(SELECT 1 FROM jsonb_array_elements(views) v WHERE v->>'status'='processing' AND (v->>'startedAt')::timestamptz<NOW()-INTERVAL '5 minutes')`,[id,user.id]);
    return (await this.pool.query('SELECT id,prompt,specification,views,seed FROM threadlabs_designs WHERE id=$1 AND account_id=$2', [id,user.id])).rows[0]; }
  async createDesign(user, design) { await this.pool.query('INSERT INTO threadlabs_designs(id,account_id,prompt,specification,views,seed) VALUES($1,$2,$3,$4,$5,$6)', [design.id,user.id,design.prompt,design.specification,JSON.stringify(design.views),design.seed]); return design; }
  async claimView(user,id,viewId) {
    // Atomic claim; a second request cannot charge for the same view concurrently.
    const result = await this.pool.query(`UPDATE threadlabs_designs SET views=(SELECT jsonb_agg(CASE WHEN v->>'id'=$3 THEN v || jsonb_build_object('status','processing','startedAt',NOW()) ELSE v END) FROM jsonb_array_elements(views) v)
      WHERE id=$1 AND account_id=$2 AND EXISTS(SELECT 1 FROM jsonb_array_elements(views) v WHERE v->>'id'=$3 AND (v->>'status'<>'processing' OR (v->>'startedAt')::timestamptz < NOW()-INTERVAL '5 minutes')) RETURNING id`, [id,user.id,viewId]);
    return result.rowCount;
  }
  async finishView(user,id,view) { await this.pool.query(`UPDATE threadlabs_designs SET views=(SELECT jsonb_agg(CASE WHEN v->>'id'=$3 THEN $4::jsonb ELSE v END) FROM jsonb_array_elements(views) v) WHERE id=$1 AND account_id=$2`, [id,user.id,view.id,JSON.stringify(view)]); }
  async conversation(user) { return (await this.pool.query('SELECT messages FROM threadlabs_conversations WHERE account_id=$1', [user.id])).rows[0]?.messages || []; }
  async saveConversation(user,messages) { await this.pool.query('INSERT INTO threadlabs_conversations(account_id,messages) VALUES($1,$2) ON CONFLICT(account_id) DO UPDATE SET messages=EXCLUDED.messages,updated_at=NOW()', [user.id,JSON.stringify(messages.slice(-20))]); }
  async deleteConversation(user) { await this.pool.query('DELETE FROM threadlabs_conversations WHERE account_id=$1', [user.id]); }
}
