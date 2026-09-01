import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

const csvPath = path.join(
  process.cwd(),
  "data",
  "source",
  "iefe-2026.csv"
);

if (!fs.existsSync(csvPath)) {
  console.error(`No se encontró el archivo: ${csvPath}`);
  process.exit(1);
}

const file = fs.readFileSync(csvPath, "utf-8");

const records = parse(file, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  trim: true,
}) as Record<string, string>[];

const requiredColumns = [
  "PROF",
  "AÑO",
  "SECCIÓN",
  "HORA",
  "FECHA",
  "MATERIA",
  "PROFESOR/A",
  "NOTAS",
  "ID",
];

const validPlans = new Set(["PEP", "PEI"]);
const validSections = new Set(["A", "B", "C", "D"]);

const errors: string[] = [];
const warnings: string[] = [];

const ids = new Set<string>();

const planCounts: Record<string, number> = {};
const yearCounts: Record<string, number> = {};
const sectionCounts: Record<string, number> = {};
const dateCounts: Record<string, number> = {};

const columns = Object.keys(records[0] ?? {});

for (const column of requiredColumns) {
  if (!columns.includes(column)) {
    errors.push(`Falta la columna requerida: ${column}`);
  }
}

records.forEach((record, index) => {
  const row = index + 2;

  const plan = record["PROF"]?.trim();
  const year = record["AÑO"]?.trim();
  const section = record["SECCIÓN"]?.trim();
  const date = record["FECHA"]?.trim();
  const subject = record["MATERIA"]?.trim();
  const teacher = record["PROFESOR/A"]?.trim();
  const id = record["ID"]?.trim();

  if (!plan) {
    errors.push(`Fila ${row}: PROF vacío`);
  } else if (!validPlans.has(plan)) {
    errors.push(`Fila ${row}: plan inválido "${plan}"`);
  }

  if (!year) {
    errors.push(`Fila ${row}: AÑO vacío`);
  }

  if (!section) {
    errors.push(`Fila ${row}: SECCIÓN vacía`);
  } else if (!validSections.has(section)) {
    errors.push(`Fila ${row}: sección inválida "${section}"`);
  }

  if (!date) {
    errors.push(`Fila ${row}: FECHA vacía`);
  }

  if (!subject) {
    warnings.push(`Fila ${row}: MATERIA vacía`);
  }

  if (!teacher) {
    warnings.push(`Fila ${row}: PROFESOR/A vacío`);
  }

  if (!id) {
    errors.push(`Fila ${row}: ID vacío`);
  } else if (ids.has(id)) {
    errors.push(`Fila ${row}: ID duplicado "${id}"`);
  } else {
    ids.add(id);
  }

  if (plan) {
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  }

  if (year) {
    yearCounts[year] = (yearCounts[year] ?? 0) + 1;
  }

  if (section) {
    sectionCounts[section] = (sectionCounts[section] ?? 0) + 1;
  }

  if (date) {
    dateCounts[date] = (dateCounts[date] ?? 0) + 1;
  }
});

console.log("");
console.log("========================================");
console.log("     VALIDACIÓN CSV · IEFI 2026");
console.log("========================================");
console.log("");

console.log(`Registros: ${records.length}`);
console.log(`IDs únicos: ${ids.size}`);

console.log("");
console.log("POR PLAN");
console.table(planCounts);

console.log("POR AÑO");
console.table(yearCounts);

console.log("POR SECCIÓN");
console.table(sectionCounts);

console.log("POR FECHA");
console.table(dateCounts);

console.log("");
console.log(`Errores: ${errors.length}`);
console.log(`Advertencias: ${warnings.length}`);

if (errors.length > 0) {
  console.log("");
  console.log("ERRORES:");

  for (const error of errors) {
    console.log(`- ${error}`);
  }
}

if (warnings.length > 0) {
  console.log("");
  console.log("ADVERTENCIAS:");

  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

console.log("");

if (errors.length > 0) {
  console.error("La validación falló.");
  process.exit(1);
}

console.log("La validación terminó correctamente.");