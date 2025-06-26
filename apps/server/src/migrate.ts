import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  console.log('Connecting to database...');
  
  // Criar conexão postgres
  const connection = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  console.log('Running migrations...');
  
  // Criar instância do drizzle
  const db = drizzle(connection);
  
  try {
    // Executar migrações
    await migrate(db, { migrationsFolder: join(__dirname, '..', 'migrations') });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
