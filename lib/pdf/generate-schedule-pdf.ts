import jsPDF from "jspdf";

type Evaluation = {
  id: string;
  plan: "PEP" | "PEI";
  year: number;
  section: "A" | "B" | "C" | "D";
  time: string | null;
  date: string;
  subject: string;
  teacher: string | null;
  notes: string | null;
};

type GenerateSchedulePdfOptions = {
  evaluations: Evaluation[];
  plan: "PEP" | "PEI";
  year: number;
  section: "A" | "B" | "C" | "D";
};

/*
 * ==========================================
 * CONFIGURACIÓN DEL DOCUMENTO
 * ==========================================
 *
 * A4 vertical
 * 20 mm de margen
 * 5 días por semana
 * 4 semanas en una única página
 */

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;

const CONTENT_WIDTH =
  PAGE_WIDTH - MARGIN * 2;

const CONTENT_HEIGHT =
  PAGE_HEIGHT - MARGIN * 2;

const COLORS = {
  navy: [23, 43, 77] as [
    number,
    number,
    number
  ],

  blue: [74, 111, 148] as [
    number,
    number,
    number
  ],

  lightBlue: [239, 244, 248] as [
    number,
    number,
    number
  ],

  veryLightBlue: [247, 249, 251] as [
    number,
    number,
    number
  ],

  border: [210, 218, 226] as [
    number,
    number,
    number
  ],

  text: [55, 65, 75] as [
    number,
    number,
    number
  ],

  muted: [105, 115, 125] as [
    number,
    number,
    number
  ],

  white: [255, 255, 255] as [
    number,
    number,
    number
  ],
};

/*
 * ==========================================
 * UTILIDADES
 * ==========================================
 */

function parseDate(
  date: string
): Date {
  const [year, month, day] = date
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

function formatShortDay(
  date: string
): string {
  const formatted =
    new Intl.DateTimeFormat(
      "es-AR",
      {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }
    ).format(parseDate(date));

  return formatted
    .replace(/\./g, "")
    .toUpperCase();
}

function formatLongDate(
  date: string
): string {
  return new Intl.DateTimeFormat(
    "es-AR",
    {
      day: "numeric",
      month: "long",
    }
  ).format(parseDate(date));
}

function formatTime(
  time: string | null
): string {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
}

function capitalize(
  value: string
): string {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function getWeekNumber(
  date: string
): number {
  const current =
    parseDate(date);

  const start =
    parseDate("2026-11-02");

  const diff = Math.floor(
    (current.getTime() -
      start.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return Math.floor(diff / 7) + 1;
}

function getMondayForWeek(
  week: number
): Date {
  const start =
    parseDate("2026-11-02");

  const monday =
    new Date(start);

  monday.setDate(
    start.getDate() +
      (week - 1) * 7
  );

  return monday;
}

function dateToString(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * ==========================================
 * LOGO
 * ==========================================
 */

function getImageData(
  image: HTMLImageElement
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width =
        image.naturalWidth;

      canvas.height =
        image.naturalHeight;

      const context =
        canvas.getContext("2d");

      if (!context) {
        reject(
          new Error(
            "No se pudo crear el contexto del logo."
          )
        );

        return;
      }

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      resolve(
        canvas.toDataURL(
          "image/png"
        )
      );
    }
  );
}

async function loadLogo(): Promise<
  string | null
> {
  try {
    const image =
      new Image();

    image.crossOrigin =
      "anonymous";

    image.src =
      "/resources/Logo-A-Carbo-Blanco1-1711x1900.png";

    await new Promise<void>(
      (resolve, reject) => {
        image.onload = () =>
          resolve();

        image.onerror = () =>
          reject(
            new Error(
              "No se pudo cargar el logo."
            )
          );
      }
    );

    return await getImageData(
      image
    );
  } catch (error) {
    console.warn(
      "No se pudo incorporar el logo al PDF:",
      error
    );

    return null;
  }
}

/*
 * ==========================================
 * ENCABEZADO
 * ==========================================
 */

function drawHeader(
  pdf: jsPDF,
  logo: string | null,
  plan: "PEP" | "PEI",
  year: number,
  section: "A" | "B" | "C" | "D"
): number {
  let y = MARGIN;

  /*
   * Logo
   */

  if (logo) {
    try {
      pdf.addImage(
        logo,
        "PNG",
        MARGIN,
        y,
        12,
        14
      );
    } catch {
      // Continuamos sin logo.
    }
  }

  const textX = logo
    ? MARGIN + 17
    : MARGIN;

  /*
   * Institución
   */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(8.5);

  pdf.setTextColor(
    ...COLORS.navy
  );

  pdf.text(
    "ESCUELA NORMAL SUPERIOR",
    textX,
    y + 4.5
  );

  pdf.text(
    "DR. ALEJANDRO CARBÓ",
    textX,
    y + 9
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    ...COLORS.muted
  );

  pdf.text(
    "Nivel Superior · Córdoba",
    textX,
    y + 13.5
  );

  /*
   * Información del recorrido
   */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(8);

  pdf.setTextColor(
    ...COLORS.navy
  );

  pdf.text(
    `IEFI 2026 · ${plan} · ${year}° · Sección ${section}`,
    PAGE_WIDTH - MARGIN,
    y + 5,
    {
      align: "right",
    }
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    ...COLORS.muted
  );

  pdf.text(
    "Instancias Evaluativas Finales Integradoras · Noviembre 2026",
    PAGE_WIDTH - MARGIN,
    y + 10,
    {
      align: "right",
    }
  );

  /*
   * Línea
   */

  y += 19;

  pdf.setDrawColor(
    ...COLORS.blue
  );

  pdf.setLineWidth(0.4);

  pdf.line(
    MARGIN,
    y,
    PAGE_WIDTH - MARGIN,
    y
  );

  return y + 4;
}

/*
 * ==========================================
 * SEMANA
 * ==========================================
 */

function drawWeekHeader(
  pdf: jsPDF,
  week: number,
  startY: number,
  height: number
): number {
  pdf.setFillColor(
    ...COLORS.lightBlue
  );

  pdf.roundedRect(
    MARGIN,
    startY,
    CONTENT_WIDTH,
    height,
    1.5,
    1.5,
    "F"
  );

  const monday =
    getMondayForWeek(week);

  const friday =
    new Date(monday);

  friday.setDate(
    monday.getDate() + 4
  );

  const range =
    `${monday.getDate()}–${friday.getDate()} ` +
    `${new Intl.DateTimeFormat(
      "es-AR",
      {
        month: "long",
      }
    ).format(monday)}`;

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(7);

  pdf.setTextColor(
    ...COLORS.blue
  );

  pdf.text(
    `SEMANA ${week}`,
    MARGIN + 3,
    startY + height / 2 + 2
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(6.5);

  pdf.setTextColor(
    ...COLORS.muted
  );

  pdf.text(
    capitalize(range),
    PAGE_WIDTH - MARGIN - 3,
    startY + height / 2 + 2,
    {
      align: "right",
    }
  );

  return startY + height;
}

/*
 * ==========================================
 * ENCABEZADO DE DÍAS
 * ==========================================
 */

function drawDayHeaders(
  pdf: jsPDF,
  dates: string[],
  startY: number,
  columnWidth: number,
  gap: number,
  height: number
): number {
  for (
    let index = 0;
    index < 5;
    index++
  ) {
    const x =
      MARGIN +
      index *
        (columnWidth + gap);

    pdf.setFillColor(
      ...COLORS.navy
    );

    pdf.roundedRect(
      x,
      startY,
      columnWidth,
      height,
      1.2,
      1.2,
      "F"
    );

    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(6.2);

    pdf.setTextColor(
      ...COLORS.white
    );

    pdf.text(
      formatShortDay(
        dates[index]
      ),
      x + columnWidth / 2,
      startY + 5.2,
      {
        align: "center",
      }
    );
  }

  return startY + height;
}

/*
 * ==========================================
 * EVALUACIÓN COMPACTA
 * ==========================================
 */

function calculateEvaluationHeight(
  pdf: jsPDF,
  evaluation: Evaluation,
  width: number
): number {
  const padding = 2;

  const subject =
    evaluation.subject?.trim() ||
    "Espacio curricular";

  const teacher =
    evaluation.teacher?.trim() ||
    "";

  const notes =
    evaluation.notes?.trim() ||
    "";

  const availableWidth =
    width - padding * 2;

  /*
   * Materia
   */

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(6.3);

  const subjectLines =
    pdf.splitTextToSize(
      subject,
      availableWidth
    );

  /*
   * Docente
   */

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(5.4);

  const teacherLines =
    teacher
      ? pdf.splitTextToSize(
          teacher,
          availableWidth
        )
      : [];

  /*
   * Notas
   *
   * Las incluimos solamente cuando
   * existe suficiente espacio.
   */

  pdf.setFontSize(5);

  const notesLines =
    notes
      ? pdf.splitTextToSize(
          notes,
          availableWidth
        )
      : [];

  let height = 2.5;

  /*
   * Hora
   */

  height += 3;

  /*
   * Materia
   */

  height +=
    subjectLines.length * 3.1;

  /*
   * Docente
   */

  if (teacherLines.length) {
    height +=
      1 +
      teacherLines.length * 2.7;
  }

  /*
   * Notas
   */

  if (notesLines.length) {
    height +=
      1 +
      notesLines.length * 2.4;
  }

  height += 2.5;

  /*
   * Altura mínima.
   */

  return Math.max(
    height,
    13
  );
}

function drawEvaluation(
  pdf: jsPDF,
  evaluation: Evaluation,
  x: number,
  y: number,
  width: number
): number {
  const padding = 2;

  const height =
    calculateEvaluationHeight(
      pdf,
      evaluation,
      width
    );

  /*
   * Fondo
   */

  pdf.setFillColor(
    ...COLORS.veryLightBlue
  );

  pdf.setDrawColor(
    ...COLORS.border
  );

  pdf.setLineWidth(0.2);

  pdf.roundedRect(
    x,
    y,
    width,
    height,
    1,
    1,
    "FD"
  );

  let textY =
    y + padding + 2.8;

  /*
   * Hora
   */

  const time =
    formatTime(
      evaluation.time
    );

  if (time) {
    pdf.setFont(
      "helvetica",
      "bold"
    );

    pdf.setFontSize(5.5);

    pdf.setTextColor(
      ...COLORS.blue
    );

    pdf.text(
      `${time} hs`,
      x + padding,
      textY
    );

    textY += 3.8;
  } else {
    textY += 1;
  }

  /*
   * Materia
   */

  const subject =
    evaluation.subject?.trim() ||
    "Espacio curricular";

  pdf.setFont(
    "helvetica",
    "bold"
  );

  pdf.setFontSize(6.3);

  pdf.setTextColor(
    ...COLORS.navy
  );

  const subjectLines =
    pdf.splitTextToSize(
      subject,
      width - padding * 2
    );

  pdf.text(
    subjectLines,
    x + padding,
    textY
  );

  textY +=
    subjectLines.length * 3.1;

  /*
   * Docente
   */

  const teacher =
    evaluation.teacher?.trim();

  if (teacher) {
    textY += 1;

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(5.4);

    pdf.setTextColor(
      ...COLORS.blue
    );

    const teacherLines =
      pdf.splitTextToSize(
        teacher,
        width - padding * 2
      );

    pdf.text(
      teacherLines,
      x + padding,
      textY
    );

    textY +=
      teacherLines.length * 2.7;
  }

  /*
   * Notas
   */

  const notes =
    evaluation.notes?.trim();

  if (notes) {
    textY += 1;

    pdf.setDrawColor(
      ...COLORS.border
    );

    pdf.setLineWidth(0.15);

    pdf.line(
      x + padding,
      textY - 1,
      x + width - padding,
      textY - 1
    );

    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(5);

    pdf.setTextColor(
      ...COLORS.muted
    );

    const notesLines =
      pdf.splitTextToSize(
        notes,
        width - padding * 2
      );

    pdf.text(
      notesLines,
      x + padding,
      textY + 1.5
    );
  }

  return (
    y + height + 1.5
  );
}

/*
 * ==========================================
 * COLUMNA DE DÍA
 * ==========================================
 */

function drawDayColumn(
  pdf: jsPDF,
  date: string,
  evaluations: Evaluation[],
  x: number,
  y: number,
  width: number,
  height: number
) {
  /*
   * Fondo de columna
   */

  pdf.setFillColor(
    252,
    252,
    252
  );

  pdf.setDrawColor(
    ...COLORS.border
  );

  pdf.setLineWidth(0.2);

  pdf.roundedRect(
    x,
    y,
    width,
    height,
    1,
    1,
    "FD"
  );

  /*
   * Fecha pequeña
   */

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(5);

  pdf.setTextColor(
    ...COLORS.muted
  );

  pdf.text(
    capitalize(
      formatLongDate(date)
    ),
    x + width / 2,
    y + 4.5,
    {
      align: "center",
    }
  );

  /*
   * Evaluaciones
   */

  let cardY =
    y + 7;

  if (
    evaluations.length === 0
  ) {
    pdf.setFont(
      "helvetica",
      "normal"
    );

    pdf.setFontSize(5.2);

    pdf.setTextColor(
      ...COLORS.muted
    );

    pdf.text(
      "Sin evaluaciones",
      x + width / 2,
      y + 13,
      {
        align: "center",
      }
    );

    return;
  }

  for (
    const evaluation of evaluations
  ) {
    cardY =
      drawEvaluation(
        pdf,
        evaluation,
        x + 1.2,
        cardY,
        width - 2.4
      );
  }
}

/*
 * ==========================================
 * FOOTER
 * ==========================================
 */

function drawFooter(
  pdf: jsPDF
) {
  const y =
    PAGE_HEIGHT - 11;

  pdf.setDrawColor(
    ...COLORS.border
  );

  pdf.setLineWidth(0.25);

  pdf.line(
    MARGIN,
    y - 3,
    PAGE_WIDTH - MARGIN,
    y - 3
  );

  pdf.setFont(
    "helvetica",
    "normal"
  );

  pdf.setFontSize(5.8);

  pdf.setTextColor(
    ...COLORS.muted
  );

  pdf.text(
    "ENSA Carbó · IEFI 2026",
    MARGIN,
    y
  );

  pdf.text(
    "Cronograma institucional",
    PAGE_WIDTH / 2,
    y,
    {
      align: "center",
    }
  );

  pdf.text(
    "Página 1 de 1",
    PAGE_WIDTH - MARGIN,
    y,
    {
      align: "right",
    }
  );
}

/*
 * ==========================================
 * GENERADOR PRINCIPAL
 * ==========================================
 */

export async function generateSchedulePdf({
  evaluations,
  plan,
  year,
  section,
}: GenerateSchedulePdfOptions) {
  if (
    !evaluations ||
    evaluations.length === 0
  ) {
    throw new Error(
      "No hay evaluaciones para generar el PDF."
    );
  }

  /*
   * A4 VERTICAL
   */

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  /*
   * Logo
   */

  const logo =
    await loadLogo();

  /*
   * Encabezado
   */

  let y = drawHeader(
    pdf,
    logo,
    plan,
    year,
    section
  );

  /*
   * Configuración del calendario
   */

  const weekHeaderHeight = 6;

  const dayHeaderHeight = 9;

  const weekGap = 2.5;

  const columnGap = 1;

  const calendarBottom =
    PAGE_HEIGHT - MARGIN - 8;

  /*
   * Espacio disponible para
   * las cuatro semanas.
   */

  const availableCalendarHeight =
    calendarBottom - y;

  const totalWeekGaps =
    weekGap * 3;

  const totalWeekHeaders =
    weekHeaderHeight * 4;

  const totalDayHeaders =
    dayHeaderHeight * 4;

  const availableForDayColumns =
    availableCalendarHeight -
    totalWeekGaps -
    totalWeekHeaders -
    totalDayHeaders;

  /*
   * Altura base de cada semana.
   *
   * Se distribuye el espacio de forma
   * uniforme para garantizar una sola
   * página.
   */

  const weekContentHeight =
    Math.max(
      availableForDayColumns / 4,
      20
    );

  /*
   * Columnas.
   */

  const columnWidth =
    (CONTENT_WIDTH -
      columnGap * 4) /
    5;

  /*
   * Las cuatro semanas.
   */

  const weeks = [1, 2, 3, 4];

  for (
    let weekIndex = 0;
    weekIndex < weeks.length;
    weekIndex++
  ) {
    const week =
      weeks[weekIndex];

    /*
     * Separación entre semanas.
     */

    if (weekIndex > 0) {
      y += weekGap;
    }

    /*
     * Encabezado semana.
     */

    y =
      drawWeekHeader(
        pdf,
        week,
        y,
        weekHeaderHeight
      );

    y += 1;

    /*
     * Construir lunes-viernes.
     */

    const monday =
      getMondayForWeek(week);

    const dates: string[] = [];

    for (
      let day = 0;
      day < 5;
      day++
    ) {
      const date =
        new Date(monday);

      date.setDate(
        monday.getDate() + day
      );

      dates.push(
        dateToString(date)
      );
    }

    /*
     * Encabezados.
     */

    y =
      drawDayHeaders(
        pdf,
        dates,
        y,
        columnWidth,
        columnGap,
        dayHeaderHeight
      );

    /*
     * Separación mínima.
     */

    y += 1;

    /*
     * Evaluaciones por día.
     */

    const dayEvaluations =
      dates.map(
        (date) =>
          evaluations
            .filter(
              (evaluation) =>
                evaluation.date ===
                date
            )
            .sort(
              (a, b) =>
                (
                  a.time ?? ""
                ).localeCompare(
                  b.time ?? ""
                )
            )
      );

    /*
     * Columnas.
     */

    for (
      let day = 0;
      day < 5;
      day++
    ) {
      const x =
        MARGIN +
        day *
          (columnWidth +
            columnGap);

      drawDayColumn(
        pdf,
        dates[day],
        dayEvaluations[day],
        x,
        y,
        columnWidth,
        weekContentHeight
      );
    }

    y += weekContentHeight;
  }

  /*
   * Footer
   */

  drawFooter(pdf);

  /*
   * Nombre del archivo
   */

  const filename =
    `IEFI-2026-${plan}-${year}-${section}.pdf`;

  /*
   * Descargar.
   */

  pdf.save(filename);
}