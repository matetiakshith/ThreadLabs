import { AccountStore } from '../services/accountStore.js';
import { hashPassword } from '../routes/accounts.js';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const [identityArg, artisanId] = process.argv.slice(2);
const identity = identityArg?.trim().toLowerCase();
const directory = JSON.parse(await fs.readFile(new URL('../../client/src/data/artisans.json', import.meta.url), 'utf8'));
if (!process.env.DATABASE_URL || !/^[a-z0-9@._+\-]{3,120}$/.test(identity || '') || !directory.some(artisan => artisan.id === artisanId)) {
  console.error('Usage: node scripts/create-artisan-account.js EMAIL_OR_USERNAME ARTISAN_ID. Configure DATABASE_URL in server/.env first.');
  process.exit(1);
}
if (!process.stdin.isTTY) { console.error('Run this command in an interactive terminal to enter the password privately.'); process.exit(1); }
const silentOutput = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
const input = createInterface({ input: process.stdin, output: silentOutput, terminal: true });
process.stdout.write('Artisan password (12–128 characters; hidden): ');
const password = await input.question('');
process.stdout.write('\n'); input.close();
if (password.length < 12 || password.length > 128) { console.error('Password must be 12–128 characters.'); process.exit(1); }
const store = new AccountStore(process.env.DATABASE_URL);
try {
  await store.initialize();
  await store.createAccount({ id: randomUUID(), identity, role: 'artisan', artisan_id: artisanId, password_hash: await hashPassword(password) });
  console.log('Artisan account created. No credentials were printed.');
} catch (error) {
  console.error(error.code === '23505' ? 'Identity or artisan profile is already assigned.' : 'Account creation failed. Check database access.');
  process.exitCode = 1;
} finally { await store.close(); }
