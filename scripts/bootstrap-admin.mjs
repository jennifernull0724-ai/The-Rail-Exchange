import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

function loadDotEnvIfPresent() {
  // Minimal .env loader (avoids adding a dependency)
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

  const emailRaw = requireEnv('BOOTSTRAP_EMAIL');
  const password = requireEnv('BOOTSTRAP_PASSWORD');
  const email = normalizeEmail(emailRaw);

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

  let createdAuthUserId = null;

  try {
    await db.query('BEGIN');

    const state = await db.query(
      "SELECT value FROM system_state WHERE key = 'admin_created' FOR UPDATE"
    );
    const adminCreated = state.rows[0]?.value === true;
    if (adminCreated) {
      await db.query('ROLLBACK');
      console.log('BLOCKED: System already initialized.');
      process.exit(0);
    }

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? 'Failed to create Supabase auth user.');
    }

    createdAuthUserId = created.data.user.id;

    await db.query(
      "INSERT INTO users (id, email, role, is_owner, disabled) VALUES ($1, $2, 'admin', true, false)",
      [createdAuthUserId, email]
    );

    await db.query(
      "UPDATE system_state SET value = true, updated_at = now() WHERE key = 'admin_created'"
    );

    await db.query(
      `INSERT INTO audit_events (actor_admin_id, action, target_type, target_id, metadata)
       VALUES ($1, 'system_owner_created', 'user', $1, $2::jsonb)`,
      [createdAuthUserId, JSON.stringify({ email })]
    );

    await db.query('COMMIT');

    console.log('OK: System owner created.');
    console.log(`User ID: ${createdAuthUserId}`);
    console.log(`Email: ${email}`);
    console.log('Next: sign in at /login with that email/password.');
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});

    const message = err instanceof Error ? err.message : String(err);

    if (createdAuthUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      } catch {
        // ignore
      }
    }

    console.error(`BLOCKED: ${message}`);
    process.exit(1);
  } finally {
    await db.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(`BLOCKED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
