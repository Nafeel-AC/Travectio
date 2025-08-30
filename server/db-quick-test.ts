import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in environment. Aborting test.');
  process.exit(1);
}

(async () => {
  const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });
  try {
    const result = await sql`select 1 as ok`;
    console.log('DB connectivity test result:', result);
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('DB connectivity test failed:', err);
    try { await sql.end(); } catch (_) {}
    process.exit(1);
  }
})();
