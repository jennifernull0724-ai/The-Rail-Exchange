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

async function main() {
  loadDotEnvIfPresent();

  const oldEmail = normalizeEmail(requireEnv('OWNER_EMAIL_OLD'));
  const newEmail = normalizeEmail(requireEnv('OWNER_EMAIL_NEW'));
  const newPassword = requireEnv('OWNER_PASSWORD_NEW');

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

  try {
    // Locate owner by email in authoritative DB table.
    const ownerRow = await db.query(
      'SELECT id::text AS id, email, role, is_owner FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [oldEmail],
    );
    const owner = ownerRow.rows[0];
    if (!owner) {
      throw new Error(`Owner user not found in users table for email: ${oldEmail}`);
    }
    if (owner.role !== 'admin' || owner.is_owner !== true) {
      throw new Error('Refusing: matched user is not the system owner admin.');
    }

    const ownerId = owner.id;

    // Update Supabase auth user first (service role admin API).
    const updatedAuth = await supabaseAdmin.auth.admin.updateUserById(ownerId, {
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });
    if (updatedAuth.error) {
      throw new Error(updatedAuth.error.message);
    }

    // Update authoritative DB + audit inside a transaction.
    await db.query('BEGIN');

    // Ensure we don't violate unique email.
    const emailTaken = await db.query('SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND id::text <> $2 LIMIT 1', [newEmail, ownerId]);
    if (emailTaken.rowCount > 0) {
      throw new Error('Target email already exists in users table.');
    }

    await db.query('UPDATE users SET email = $1 WHERE id::text = $2', [newEmail, ownerId]);

    await db.query(
      `INSERT INTO audit_events (actor_admin_id, action, target_type, target_id, metadata)
       VALUES ($1, 'system_owner_credentials_updated', 'user', $1, $2::jsonb)`,
      [ownerId, JSON.stringify({ oldEmail, newEmail })],
    );

    await db.query('COMMIT');

    console.log('OK: Owner credentials updated.');
    console.log(`User ID: ${ownerId}`);
    console.log(`Email: ${newEmail}`);
    console.log('Next: sign in at /login with OWNER_EMAIL_NEW / OWNER_PASSWORD_NEW');
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
