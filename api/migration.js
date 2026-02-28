const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_9He1SiaWLNbd@ep-curly-lab-ais8qzcv-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(255)');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(255)');
        await pool.query('ALTER TABLE workers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)');
        console.log('Migration successful');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        pool.end();
    }
}

migrate();
