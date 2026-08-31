import { NextResponse } from "next/server";
import { getEvaluationsByPlan } from "@/lib/queries/evaluations";

const VALID_PLANS = new Set(["PEP", "PEI"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan");

    if (!plan || !VALID_PLANS.has(plan)) {
      return NextResponse.json(
        {
          success: false,
          error: "El parámetro 'plan' debe ser PEP o PEI.",
        },
        { status: 400 }
      );
    }

    const evaluations = await getEvaluationsByPlan(
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
        error: "No se pudieron obtener las evaluaciones",
      },
      { status: 500 }
    );
  }
}
