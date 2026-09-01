import { NextResponse } from "next/server";

import { getTeachers } from "@/lib/queries/evaluations";

export async function GET() {
  try {
    const teachers = await getTeachers();

    return NextResponse.json({
      success: true,
      count: teachers.length,
      data: teachers,
    });
  } catch (error) {
    console.error(
      "Error obteniendo docentes:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "No se pudieron obtener los docentes.",
      },
      {
        status: 500,
      }
    );
  }
}