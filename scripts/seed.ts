import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { parse } from "csv-parse/sync";
import pg from "pg";

config({
  path: ".env.local",
});

const { Client } = pg;

type CsvRecord = {
  PROF: string;
  AÑO: string;
  SECCIÓN: string;
  HORA: string;
  FECHA: string;
  MATERIA: string;
  "PROFESOR/A": string;
  NOTAS: string;
  ID: string;
};

const csvPath = path.join(
  process.cwd(),
  "data",
  "source",
  "iefe-2026.csv"
);

if (!fs.existsSync(csvPath)) {
  throw new Error(`No se encontró el archivo: ${csvPath}`);
}

const file = fs.readFileSync(csvPath, "utf-8");

const records = parse(file, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  trim: true,
}) as CsvRecord[];

if (records.length === 0) {
  throw new Error("El CSV no contiene registros.");
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  try {
    await client.query("BEGIN");

    /*
     * 1. Crear los planes
     */
    await client.query(
      `
      INSERT INTO plans (code, name)
      VALUES
        ('PEP', 'Plan PEP 2026'),
        ('PEI', 'Plan PEI 2026')
      ON CONFLICT (code) DO NOTHING;
      `
    );

    /*
     * 2. Obtener los IDs de los planes
     */
    const plansResult = await client.query<{
      id: number;
      code: string;
    }>(
      `
      SELECT id, code
      FROM plans
      WHERE code IN ('PEP', 'PEI');
      `
    );

    const planIds = new Map(
      plansResult.rows.map((plan) => [plan.code, plan.id])
    );

    /*
     * 3. Insertar evaluaciones
     */
    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      const planCode = record.PROF?.trim();
      const planId = planIds.get(planCode);

      if (!planId) {
        throw new Error(
          `No existe el plan "${planCode}" para el registro ${record.ID}`
        );
      }

      const time =
        record.HORA?.trim() !== ""
          ? record.HORA.trim()
          : null;

      const teacher =
        record["PROFESOR/A"]?.trim() !== ""
          ? record["PROFESOR/A"].trim()
          : null;

      const notes =
        record.NOTAS?.trim() !== ""
          ? record.NOTAS.trim()
          : null;

      const result = await client.query(
        `
        INSERT INTO evaluations (
          id,
          plan_id,
          year,
          section,
          time,
          date,
          subject,
          teacher,
          notes
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          TO_DATE($6, 'DD-MM-YY'),
          $7,
          $8,
          $9
        )
        ON CONFLICT (id) DO NOTHING;
        `,
        [
          record.ID.trim(),
          planId,
          Number(record.AÑO),
          record["SECCIÓN"].trim(),
          time,
          record.FECHA.trim(),
          record.MATERIA.trim(),
          teacher,
          notes,
        ]
      );

      if (result.rowCount === 1) {
        inserted++;
      } else {
        skipped++;
      }
    }

    await client.query("COMMIT");

    console.log("");
    console.log("========================================");
    console.log("       SEED · IEFI 2026");
    console.log("========================================");
    console.log("");
    console.log(`Registros CSV: ${records.length}`);
    console.log(`Insertados:    ${inserted}`);
    console.log(`Omitidos:      ${skipped}`);
    console.log("");
    console.log("Seed completado correctamente.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error("Error ejecutando seed:");
  console.error(error);
  process.exit(1);
});