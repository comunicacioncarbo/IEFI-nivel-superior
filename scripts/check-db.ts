import { config } from "dotenv";
import pg from "pg";

config({
  path: ".env.local",
});

const { Client } = pg;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida");
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('plans', 'evaluations')
      ORDER BY table_name, ordinal_position;
    `);

    console.table(result.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Error consultando Neon:");
  console.error(error.message);
  process.exit(1);
});