/* =========================================================
   IEFI 2026 · IMPRESIÓN
   Horario por plan/año/división
   Resumen por docente
   ========================================================= */


/* =========================================================
   01. VENTANA DE IMPRESIÓN
   ========================================================= */

function printDocument(title, content, orientation = 'portrait') {

  const printWindow = window.open(
    '',
    '_blank',
    'width=1000,height=800'
  );

  if (!printWindow) {
    alert(
      'No se pudo abrir la ventana de impresión. ' +
      'Verificá que el navegador permita ventanas emergentes.'
    );
    return;
  }

  printWindow.document.write(`
    <!doctype html>

    <html lang="es">

    <head>

      <meta charset="utf-8">

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
      >

      <title>${escapeHtml(title)}</title>

      <style>

        @page {
          size: A4 ${orientation};
          margin: 12mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          color: #252162;
          background: white;
          font-size: 11px;
        }

        .print-header {
          border-bottom: 3px solid #252162;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }

        .institution {
          font-size: 18px;
          font-weight: 700;
          color: #252162;
        }

        .department {
          margin-top: 3px;
          font-size: 11px;
          color: #5c81a5;
        }

        .document-title {
          margin-top: 14px;
          font-size: 22px;
          font-weight: 700;
          color: #252162;
        }

        .document-subtitle {
          margin-top: 5px;
          font-size: 12px;
          color: #555;
        }

        .selection {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 18px;
          margin-bottom: 18px;
          padding: 10px;
          background: #f0f0f0;
          border-left: 4px solid #b91f22;
        }

        .selection-item strong {
          color: #252162;
        }

        .week {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .week-title {
          padding: 7px 10px;
          background: #252162;
          color: white;
          font-size: 13px;
          font-weight: 700;
        }

        .week-date {
          padding: 5px 10px;
          background: #f0f0f0;
          color: #555;
          font-size: 10px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        th {
          background: #5c81a5;
          color: white;
          padding: 7px 5px;
          text-align: left;
          font-size: 9px;
        }

        td {
          border: 1px solid #d5d5d5;
          padding: 7px 5px;
          vertical-align: top;
          min-height: 45px;
        }

        .day {
          width: 20%;
        }

        .day-name {
          font-weight: 700;
          color: #252162;
        }

        .day-date {
          margin-top: 2px;
          font-size: 9px;
          color: #777;
        }

        .subject {
          font-weight: 700;
          color: #252162;
          line-height: 1.25;
        }

        .teacher {
          margin-top: 5px;
          color: #b91f22;
          font-size: 10px;
        }

        .empty {
          color: #aaa;
          font-style: italic;
        }

        .holiday {
          color: #b91f22;
          font-weight: 700;
        }

        .teacher-block {
          margin-bottom: 16px;
          page-break-inside: avoid;
        }

        .teacher-block-title {
          padding: 8px 10px;
          background: #252162;
          color: white;
          font-size: 12px;
          font-weight: 700;
        }

        .teacher-meta {
          padding: 6px 10px;
          background: #f0f0f0;
          color: #555;
          font-size: 10px;
        }

        .teacher-subject {
          font-weight: 700;
          color: #252162;
        }

        .summary {
          margin-top: 18px;
          padding: 10px;
          background: #f0f0f0;
          border-left: 4px solid #b91f22;
          font-weight: 700;
        }

        .footer {
          margin-top: 25px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
          color: #777;
          font-size: 9px;
          text-align: center;
        }

        @media print {

          .no-print {
            display: none !important;
          }

        }

      </style>

    </head>

    <body>

      ${content}

      <div class="footer">
        Página construida por Dpto. de Comunicación ENSA Carbó
        · IEFI 2026
      </div>

    </body>

    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 250);

  };
}


/* =========================================================
   02. ENCABEZADO COMÚN
   ========================================================= */

function printHeader(title, subtitle = '') {

  return `

    <header class="print-header">

      <div class="institution">
        Escuela Normal Superior Dr. Alejandro Carbó
      </div>

      <div class="department">
        Instancias Evaluativas Finales Integradoras · IEFI 2026
      </div>

      <div class="document-title">
        ${escapeHtml(title)}
      </div>

      ${
        subtitle
          ? `
            <div class="document-subtitle">
              ${escapeHtml(subtitle)}
            </div>
          `
          : ''
      }

    </header>

  `;
}


/* =========================================================
   03. IMPRIMIR HORARIO SELECCIONADO
   ========================================================= */

function printSelectedSchedule() {

  const record = selected();

  if (!record) {

    alert(
      'Primero seleccioná un plan, año y división.'
    );

    return;
  }

  let weeksHtml = '';

  (record.weeks || []).forEach(
    (week, weekIndex) => {

      const firstDate =
        week.dates?.[0] || '';

      const lastDate =
        week.dates?.[4] || '';

      let rows = '';

      dayNames.forEach(
        (day, dayIndex) => {

          const item =
            parseCell(
              week.cells?.[dayIndex]
            );

          const date =
            normalizePrintDate(
              week.dates?.[dayIndex],
              day
            );

          if (!item) {

            rows += `

              <tr>

                <td class="day">

                  <div class="day-name">
                    ${day}
                  </div>

                  <div class="day-date">
                    ${escapeHtml(date)}
                  </div>

                </td>

                <td colspan="2">
                  <span class="empty">
                    Sin espacio asignado
                  </span>
                </td>

              </tr>

            `;

            return;
          }

          rows += `

            <tr>

              <td class="day">

                <div class="day-name">
                  ${day}
                </div>

                <div class="day-date">
                  ${escapeHtml(date)}
                </div>

              </td>

              <td>

                <div class="
                  ${item.holiday
                    ? 'holiday'
                    : 'subject'}
                ">

                  ${escapeHtml(
                    item.subject
                  )}

                </div>

              </td>

              <td>

                ${
                  item.teacher
                    ? `
                      <div class="teacher">
                        ${escapeHtml(
                          item.teacher
                        )}
                      </div>
                    `
                    : `
                      <span class="empty">
                        No consignado
                      </span>
                    `
                }

              </td>

            </tr>

          `;

        }
      );

      weeksHtml += `

        <section class="week">

          <div class="week-title">
            Semana ${weekIndex + 1}
          </div>

          <div class="week-date">
            ${escapeHtml(firstDate)}
            —
            ${escapeHtml(lastDate)}
          </div>

          <table>

            <thead>

              <tr>
                <th class="day">
                  Día
                </th>

                <th>
                  Espacio curricular
                </th>

                <th>
                  Docente
                </th>
              </tr>

            </thead>

            <tbody>
              ${rows}
            </tbody>

          </table>

        </section>

      `;

    }
  );

  const content = `

    ${printHeader(
      'Horario IEFI 2026',
      'Cronograma completo de la división seleccionada'
    )}

    <div class="selection">

      <div class="selection-item">
        <strong>Plan:</strong>
        ${escapeHtml(plan)}
      </div>

      <div class="selection-item">
        <strong>Año:</strong>
        ${escapeHtml(record.year)}
      </div>

      <div class="selection-item">
        <strong>División:</strong>
        ${escapeHtml(record.section)}
      </div>

      ${
        record.time
          ? `
            <div class="selection-item">
              <strong>Horario:</strong>
              ${escapeHtml(record.time)}
            </div>
          `
          : ''
      }

    </div>

    ${weeksHtml}

  `;

  printDocument(
    `IEFI 2026 · ${plan} · ${record.year} · ${record.section}`,
    content,
    'landscape'
  );
}


/* =========================================================
   04. BUSCAR INFORMACIÓN DE DOCENTES
   ========================================================= */

function getTeacherResults(searchTerm) {

  const term =
    normalize(searchTerm)
      .toLowerCase();

  if (!term || !plan) {
    return [];
  }

  const results =
    allSearchResults(term);

  /*
   * Agrupamos por docente.
   *
   * Esto evita que "Navarro" genere
   * un resumen separado por cada aparición.
   */

  const teachers = {};

  results.forEach(result => {

    const teacher =
      normalize(result.teacher);

    if (!teacher) {
      return;
    }

    const key =
      teacher.toLowerCase();

    if (!teachers[key]) {

      teachers[key] = {
        name: teacher,
        assignments: []
      };

    }

    teachers[key].assignments.push(
      result
    );

  });

  return Object.values(teachers);
}


/* =========================================================
   05. IMPRIMIR RESUMEN DE DOCENTE
   ========================================================= */

function printTeacherSummary(searchTerm) {

  const teachers =
    getTeacherResults(searchTerm);

  if (!teachers.length) {

    alert(
      'No encontramos un docente con ese nombre.'
    );

    return;
  }

  /*
   * Si hay varios docentes que coinciden,
   * usamos el primero.
   *
   * Ejemplo:
   * "García" puede encontrar varios docentes.
   */

  const teacher =
    teachers[0];

  const assignments =
    teacher.assignments;

  let rows = '';

  assignments.forEach(
    assignment => {

      rows += `

        <tr>

          <td>

            <strong>
              ${escapeHtml(
                assignment.year
              )} año
            </strong>

          </td>

          <td>
            ${escapeHtml(
              assignment.section
            )}
          </td>

          <td>
            ${escapeHtml(
              assignment.time || ''
            )}
          </td>

          <td>
            Semana
            ${assignment.week + 1}
          </td>

          <td>

            ${escapeHtml(
              assignment.dayName
            )}

            <br>

            <span class="day-date">
              ${escapeHtml(
                assignment.date
              )}
            </span>

          </td>

          <td>

            <div class="teacher-subject">
              ${escapeHtml(
                assignment.subject
              )}
            </div>

          </td>

        </tr>

      `;

    }
  );

  const content = `

    ${printHeader(
      'Resumen de docente',
      'Participación en el cronograma IEFI 2026'
    )}

    <div class="selection">

      <div class="selection-item">

        <strong>
          Docente:
        </strong>

        ${escapeHtml(
          teacher.name
        )}

      </div>

      <div class="selection-item">

        <strong>
          Plan:
        </strong>

        ${escapeHtml(plan)}

      </div>

    </div>

    <table>

      <thead>

        <tr>

          <th>
            Año
          </th>

          <th>
            División
          </th>

          <th>
            Horario
          </th>

          <th>
            Semana
          </th>

          <th>
            Día
          </th>

          <th>
            Espacio curricular
          </th>

        </tr>

      </thead>

      <tbody>
        ${rows}
      </tbody>

    </table>

    <div class="summary">

      Total de participaciones:
      ${assignments.length}

    </div>

  `;

  printDocument(
    `IEFI 2026 · ${teacher.name}`,
    content,
    'portrait'
  );
}


/* =========================================================
   06. FECHAS
   ========================================================= */

function normalizePrintDate(
  value,
  day
) {

  const text =
    normalize(value);

  if (!text) {
    return '';
  }

  return text
    .replace(
      new RegExp(
        '^' + day + '\\s*',
        'i'
      ),
      ''
    );
}


/* =========================================================
   07. CREAR BOTONES
   ========================================================= */

function createPrintButtons() {

  /*
   * Botón de horario
   */

  const cronTop =
    document.querySelector(
      '.cron-top'
    );

  if (
    cronTop &&
    !document.getElementById(
      'printSchedule'
    )
  ) {

    const button =
      document.createElement(
        'button'
      );

    button.id =
      'printSchedule';

    button.type =
      'button';

    button.className =
      'print-button';

    button.textContent =
      'Imprimir horario';

    button.addEventListener(
      'click',
      printSelectedSchedule
    );

    const searchWrap =
      cronTop.querySelector(
        '.search-wrap'
      );

    if (searchWrap) {

      searchWrap.appendChild(
        button
      );

    } else {

      cronTop.appendChild(
        button
      );

    }

  }


  /*
   * Botón de resumen docente
   */

  const searchWrap =
    document.querySelector(
      '.search-wrap'
    );

  if (
    searchWrap &&
    !document.getElementById(
      'printTeacher'
    )
  ) {

    const button =
      document.createElement(
        'button'
      );

    button.id =
      'printTeacher';

    button.type =
      'button';

    button.className =
      'print-button';

    button.textContent =
      'Imprimir docente';

    button.addEventListener(
      'click',
      () => {

        const value =
          searchInput
            ? searchInput.value.trim()
            : '';

        if (!value) {

          alert(
            'Primero buscá un docente.'
          );

          return;
        }

        printTeacherSummary(
          value
        );

      }
    );

    searchWrap.appendChild(
      button
    );

  }

}


/* =========================================================
   08. ESTILOS DE LOS BOTONES
   ========================================================= */

function addPrintButtonStyles() {

  if (
    document.getElementById(
      'print-button-styles'
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      'style'
    );

  style.id =
    'print-button-styles';

  style.textContent = `

    .print-button {
      margin-top: 12px;
      width: 100%;
      padding: 11px 16px;
      border: 0;
      border-radius: 6px;
      background: #252162;
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition:
        background .2s ease,
        transform .2s ease;
    }

    .print-button:hover {
      background: #5c81a5;
    }

    .print-button:active {
      transform: translateY(1px);
    }

    @media print {
      .print-button {
        display: none !important;
      }
    }

  `;

  document.head.appendChild(
    style
  );

}


/* =========================================================
   09. INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    addPrintButtonStyles();

    createPrintButtons();

  }
);