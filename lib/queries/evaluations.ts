import { eq, and, asc } from "drizzle-orm";
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