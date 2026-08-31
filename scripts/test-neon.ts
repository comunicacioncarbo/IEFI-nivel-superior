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

    const result = await client.query(
      "SELECT current_database(), current_user, NOW()"
    );

    console.log("Conexión a Neon exitosa:");
    console.table(result.rows);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Error conectando a Neon:");
  console.error(error.message);
  process.exit(1);
});