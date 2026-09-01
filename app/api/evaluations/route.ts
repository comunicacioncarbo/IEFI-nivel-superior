import { NextResponse } from "next/server";

import {
  getEvaluationsByPlan,
  getEvaluationsByTeacher,
} from "@/lib/queries/evaluations";

const VALID_PLANS = new Set([
  "PEP",
  "PEI",
]);

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const plan =
      searchParams.get("plan");

    const teacher =
      searchParams.get("teacher");

    /*
     * ==========================================
     * CONSULTA POR DOCENTE
     * ==========================================
     *
     * Si viene ?teacher=...
     * ignoramos el plan y devolvemos
     * todas las evaluaciones del docente,
     * tanto PEP como PEI.
     */

    if (teacher !== null) {
      const normalizedTeacher =
        teacher.trim();

      if (!normalizedTeacher) {
        return NextResponse.json(
          {
            success: false,
            error:
              "El parámetro 'teacher' no puede estar vacío.",
          },
          {
            status: 400,
          }
        );
      }

      const evaluations =
        await getEvaluationsByTeacher(
          normalizedTeacher
        );

      return NextResponse.json({
        success: true,
        count: evaluations.length,
        data: evaluations,
      });
    }

    /*
     * ==========================================
     * CONSULTA POR PLAN
     * ==========================================
     *
     * Mantiene exactamente el comportamiento
     * anterior de la aplicación.
     */

    if (
      !plan ||
      !VALID_PLANS.has(plan)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Debe proporcionar 'plan' (PEP o PEI) o 'teacher'.",
        },
        {
          status: 400,
        }
      );
    }

    const evaluations =
      await getEvaluationsByPlan(
        plan as "PEP" | "PEI"
      );

    return NextResponse.json({
      success: true,
      count: evaluations.length,
      data: evaluations,
    });
  } catch (error) {
    console.error(
      "Error obteniendo evaluaciones:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "No se pudieron obtener las evaluaciones.",
      },
      {
        status: 500,
      }
    );
  }
}