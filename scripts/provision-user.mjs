import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

function loadDotEnvIfPresent() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const text = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var ${key}`);
  }
  return value;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function parseRole(roleRaw) {
  const role = String(roleRaw ?? '').trim().toLowerCase();
  if (role === 'contractor' || role === 'logistics' || role === 'admin') return role;
  throw new Error("PROVISION_ROLE must be one of: contractor, logistics, admin");
}

async function findAuthUserIdByEmail(supabaseAdmin, email) {
  // Best-effort: list users and find by email.
  // This is fine for dev/bootstrap and avoids adding new infra.
  let page = 1;
  const perPage = 100;

  for (;;) {
    const res = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (res.error) throw new Error(res.error.message);

    const users = res.data?.users ?? [];
    const match = users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());
    if (match?.id) return match.id;

    if (users.length < perPage) return null;
    page += 1;
  }
}

async function main() {
  loadDotEnvIfPresent();

  const email = normalizeEmail(requireEnv('PROVISION_EMAIL'));
  const password = requireEnv('PROVISION_PASSWORD');
  const role = parseRole(requireEnv('PROVISION_ROLE'));

  const databaseUrl = requireEnv('DATABASE_URL');
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const db = new Client({ connectionString: databaseUrl });
  await db.connect();

  let authUserId = null;

  try {
    // 1) Create auth user (or resolve existing)
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (created.error || !created.data.user) {
      // If user already exists, we can still provision the DB row.
      authUserId = await findAuthUserIdByEmail(supabaseAdmin, email);
      if (!authUserId) {
        throw new Error(created.error?.message ?? 'Failed to create or locate Supabase auth user.');
      }
    } else {
      authUserId = created.data.user.id;
    }

    // 2) Upsert into authoritative users table.
    // Keep schema-agnostic (uuid/text) by using id::text comparisons elsewhere.
    await db.query('BEGIN');

    const existing = await db.query(
      'SELECT id::text AS id, role, disabled, is_owner FROM users WHERE id::text = $1 LIMIT 1',
      [authUserId],
    );

    if (existing.rowCount === 0) {
      await db.query(
        'INSERT INTO users (id, email, role, is_owner, disabled) VALUES ($1, $2, $3, false, false)',
        [authUserId, email, role],
      );
    } else {
      await db.query(
        'UPDATE users SET email = $1, role = $2 WHERE id::text = $3',
        [email, role, authUserId],
      );
    }

    await db.query('COMMIT');

    console.log('OK: User provisioned.');
    console.log(`User ID: ${authUserId}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);

    if (role === 'contractor') {
      console.log('Next: sign in at /login → you should land on /jobs');
    } else if (role === 'logistics') {
      console.log('Next: sign in at /login → you should land on /company');
    } else {
      console.log('Next: sign in at /login → you should land on /admin (out of scope)');
    }
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    console.error(`BLOCKED: ${message}`);
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`BLOCKED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
