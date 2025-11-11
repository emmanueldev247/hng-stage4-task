import { Client } from 'pg';

/**
 * Ensures that the target database exists.
 */
export async function ensureDatabase() {
  const host = process.env.TEMPLATE_DB_HOST || 'localhost';
  const port = parseInt(process.env.TEMPLATE_DB_PORT || '5432', 10);
  const database = process.env.TEMPLATE_DB_NAME || 'templates_db';
  const user = process.env.TEMPLATE_DB_USER || 'templates_dev';
  const password = process.env.TEMPLATE_DB_PASSWORD || 'templates_dev_pass';

  // Try connecting to target DB using service creds
  const tryClient = new Client({ host, port, database, user, password });
  try {
    await tryClient.connect();
    await tryClient.end();
    return; // DB exists and is reachable
  } catch (err: any) {
    if (err?.code !== '3D000') {
      throw err;
    }
  } finally {
    try {
      await tryClient.end();
    } catch {}
  }

  // Create DB with admin creds
  const adminUser = process.env.TEMPLATE_DB_ADMIN_USER || 'postgres';
  const adminPassword = process.env.TEMPLATE_DB_ADMIN_PASSWORD || '';
  const adminDatabase = process.env.TEMPLATE_DB_ADMIN_DB || 'postgres';

  const admin = new Client({
    host,
    port,
    database: adminDatabase,
    user: adminUser,
    password: adminPassword,
  });

  await admin.connect();

  // CREATE DATABASE and make the service user the owner

  await admin.query(`CREATE DATABASE "${database}";`).catch((e) => {
    if (e?.code !== '42P04') throw e;
  });

  await admin
    .query(`ALTER DATABASE "${database}" OWNER TO "${user}";`)
    .catch(() => {});

  const newDb = new Client({
    host,
    port,
    database,
    user: adminUser,
    password: adminPassword,
  });
  await newDb.connect();
  await newDb
    .query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
    .catch(() => {});
  await newDb
    .query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`)
    .catch(() => {});
  await newDb.end();

  await admin.end();
}
