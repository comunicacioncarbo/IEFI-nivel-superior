import { eq, and, asc, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { evaluations, plans } from "@/db/schema";

export async function getPlans() {
  return db
    .select()
    .from(plans)
    .orderBy(asc(plans.code));
}

export async function getEvaluationsByPlan(
  planCode: "PEP" | "PEI"
) {
  return db
    .select({
      id: evaluations.id,
      plan: plans.code,
      year: evaluations.year,
      section: evaluations.section,
      time: evaluations.time,
      date: evaluations.date,
      subject: evaluations.subject,
      teacher: evaluations.teacher,
      notes: evaluations.notes,
    })
    .from(evaluations)
    .innerJoin(
      plans,
      eq(evaluations.planId, plans.id)
    )
    .where(eq(plans.code, planCode))
    .orderBy(
      asc(evaluations.date),
      asc(evaluations.time)
    );
}

export async function getEvaluationsBySection(
  planCode: "PEP" | "PEI",
  year: number,
  section: "A" | "B" | "C" | "D"
) {
  return db
    .select({
      id: evaluations.id,
      plan: plans.code,
      year: evaluations.year,
      section: evaluations.section,
      time: evaluations.time,
      date: evaluations.date,
      subject: evaluations.subject,
      teacher: evaluations.teacher,
      notes: evaluations.notes,
    })
    .from(evaluations)
    .innerJoin(
      plans,
      eq(evaluations.planId, plans.id)
    )
    .where(
      and(
        eq(plans.code, planCode),
        eq(evaluations.year, year),
        eq(evaluations.section, section)
      )
    )
    .orderBy(
      asc(evaluations.date),
      asc(evaluations.time)
    );
}

/**
 * Obtiene la lista de docentes únicos registrados
 * en las evaluaciones.
 *
 * Se excluyen valores nulos y docentes vacíos.
 */
export async function getTeachers() {
  const rows = await db
    .select({
      teacher: evaluations.teacher,
    })
    .from(evaluations)
    .where(
      isNotNull(evaluations.teacher)
    )
    .orderBy(
      asc(evaluations.teacher)
    );

  const teachers = rows
    .map((row) =>
      row.teacher?.trim()
    )
    .filter(
      (
        teacher
      ): teacher is string =>
        Boolean(teacher)
    );

  return Array.from(
    new Set(teachers)
  ).sort((a, b) =>
    a.localeCompare(
      b,
      "es",
      {
        sensitivity: "base",
      }
    )
  );
}

/**
 * Obtiene todas las evaluaciones de un docente,
 * independientemente del plan.
 *
 * Esto es importante para el recorrido docente:
 * un docente puede participar tanto en PEP como PEI.
 */
export async function getEvaluationsByTeacher(
  teacher: string
) {
  const normalizedTeacher =
    teacher.trim();

  if (!normalizedTeacher) {
    return [];
  }

  return db
    .select({
      id: evaluations.id,
      plan: plans.code,
      year: evaluations.year,
      section: evaluations.section,
      time: evaluations.time,
      date: evaluations.date,
      subject: evaluations.subject,
      teacher: evaluations.teacher,
      notes: evaluations.notes,
    })
    .from(evaluations)
    .innerJoin(
      plans,
      eq(evaluations.planId, plans.id)
    )
    .where(
      eq(
        evaluations.teacher,
        normalizedTeacher
      )
    )
    .orderBy(
      asc(evaluations.date),
      asc(evaluations.time),
      asc(evaluations.subject)
    );
}