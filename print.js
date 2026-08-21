/* =========================================================
   IEFI 2026 · IMPRESIÓN
   - Horario por plan / año / división
   - Horario completo por docente
   ========================================================= */

function printEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function printNormalize(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function printDate(value, day) {
  const text = printNormalize(value);

  if (!text) return '';

  return text.replace(
    new RegExp('^' + day + '\\s*', 'i'),
    ''
  );
}


/* ---------------------------------------------------------
   Ventana de impresión
   --------------------------------------------------------- */

function printDocument(
  title,
  content,
  orientation = 'portrait'
) {

  const win = window.open(
    '',
    '_blank',
    'width=1100,height=800'
  );

  if (!win) {

    alert(
      'No se pudo abrir la ventana de impresión. ' +
      'Permití ventanas emergentes para este sitio.'
    );

    return;
  }

  win.document.open();

  win.document.write(`
<!doctype html>

<html lang="es">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

<title>
  ${printEscape(title)}
</title>

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
  background: #fff;
  color: #252162;
  font-family:
    Arial,
    Helvetica,
    sans-serif;
  font-size: 10px;
}

.header {
  border-bottom: 3px solid #252162;
  padding-bottom: 10px;
  margin-bottom: 14px;
}

.institution {
  font-size: 17px;
  font-weight: 700;
}

.subtitle {
  margin-top: 3px;
  color: #5c81a5;
  font-size: 10px;
}

.title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 700;
}

.description {
  margin-top: 3px;
  color: #555;
  font-size: 10px;
}

.info {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 18px;
  margin-bottom: 15px;
  padding: 9px 10px;
  background: #f0f0f0;
  border-left: 4px solid #b91f22;
}

.info-item strong {
  color: #252162;
}

.week {
  margin-bottom: 17px;
  page-break-inside: avoid;
}

.week-title {
  padding: 7px 9px;
  background: #252162;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.week-dates {
  padding: 5px 9px;
  background: #f0f0f0;
  color: #555;
  font-size: 9px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  padding: 6px 5px;
  background: #5c81a5;
  color: #fff;
  border: 1px solid #5c81a5;
  text-align: left;
  font-size: 9px;
}

td {
  padding: 6px 5px;
  border: 1px solid #d2d2d2;
  vertical-align: top;
}

.day-name {
  font-weight: 700;
  color: #252162;
}

.date {
  margin-top: 2px;
  color: #777;
  font-size: 8px;
}

.subject {
  font-weight: 700;
  line-height: 1.25;
}

.teacher {
  margin-top: 3px;
  color: #b91f22;
  font-size: 9px;
}

.empty {
  color: #999;
  font-style: italic;
}

.holiday {
  color: #b91f22;
  font-weight: 700;
}

.summary {
  margin-top: 15px;
  padding: 9px 10px;
  background: #f0f0f0;
  border-left: 4px solid #b91f22;
  font-weight: 700;
}

.footer {
  margin-top: 18px;
  padding-top: 7px;
  border-top: 1px solid #ddd;
  color: #777;
  text-align: center;
  font-size: 8px;
}

.print-button {
  width: 100%;
  margin-top: 10px;
  padding: 10px 14px;
  border: 0;
  border-radius: 6px;
  background: #252162;
  color: #fff;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.teacher-print-label {
  margin-bottom: 7px;
  font-size: 11px;
  font-weight: 700;
  color: #252162;
}

.teacher-selector {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #252162;
  font: inherit;
}

#teacherPrintControls {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #ddd;
}

@media print {

  .print-button,
  #teacherPrintControls {
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

  win.document.close();

  setTimeout(() => {

    win.focus();

    win.print();

  }, 400);

}


/* ---------------------------------------------------------
   Encabezado
   --------------------------------------------------------- */

function printHeader(
  title,
  description = ''
) {

  return `

    <div class="header">

      <div class="institution">
        Escuela Normal Superior Dr. Alejandro Carbó
      </div>

      <div class="subtitle">
        Instancias Evaluativas Finales Integradoras · IEFI 2026
      </div>

      <div class="title">
        ${printEscape(title)}
      </div>

      ${
        description
          ? `
            <div class="description">
              ${printEscape(description)}
            </div>
          `
          : ''
      }

    </div>

  `;
}


/* =========================================================
   HORARIO DE PLAN / AÑO / DIVISIÓN
   ========================================================= */

function printSelectedSchedule() {

  if (typeof selected !== 'function') {

    alert(
      'No se pudo acceder a la selección actual.'
    );

    return;
  }

  const record = selected();

  if (!record) {

    alert(
      'Primero seleccioná un plan, año y división.'
    );

    return;
  }

  let weeks = '';

  (record.weeks || []).forEach(
    (week, weekIndex) => {

      let rows = '';

      dayNames.forEach(
        (day, dayIndex) => {

          const item =
            parseCell(
              week.cells?.[dayIndex]
            );

          const date =
            printDate(
              week.dates?.[dayIndex],
              day
            );

          if (!item) {

            rows += `

              <tr>

                <td>

                  <div class="day-name">
                    ${printEscape(day)}
                  </div>

                  <div class="date">
                    ${printEscape(date)}
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

              <td>

                <div class="day-name">
                  ${printEscape(day)}
                </div>

                <div class="date">
                  ${printEscape(date)}
                </div>

              </td>

              <td>

                <div class="${
                  item.holiday
                    ? 'holiday'
                    : 'subject'
                }">

                  ${printEscape(
                    item.subject
                  )}

                </div>

              </td>

              <td>

                ${
                  item.teacher
                    ? `
                      <div class="teacher">
                        ${printEscape(
                          item.teacher
                        )}
                      </div>
                    `
                    : `
                      <span class="empty">
                        Docente no consignado
                      </span>
                    `
                }

              </td>

            </tr>

          `;

        }
      );

      const firstDate =
        printNormalize(
          week.dates?.[0]
        );

      const lastDate =
        printNormalize(
          week.dates?.[4]
        );

      weeks += `

        <section class="week">

          <div class="week-title">
            Semana ${weekIndex + 1}
          </div>

          <div class="week-dates">

            ${printEscape(firstDate)}

            ${
              firstDate && lastDate
                ? ' — '
                : ''
            }

            ${printEscape(lastDate)}

          </div>

          <table>

            <thead>

              <tr>

                <th style="width:18%">
                  Día
                </th>

                <th style="width:42%">
                  Espacio curricular
                </th>

                <th style="width:40%">
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

    <div class="info">

      <div class="info-item">

        <strong>
          Programa:
        </strong>

        ${printEscape(plan)}

      </div>

      <div class="info-item">

        <strong>
          Año:
        </strong>

        ${printEscape(record.year)}

      </div>

      <div class="info-item">

        <strong>
          División:
        </strong>

        ${printEscape(record.section)}

      </div>

      ${
        record.time
          ? `
            <div class="info-item">

              <strong>
                Horario:
              </strong>

              ${printEscape(record.time)}

            </div>
          `
          : ''
      }

    </div>

    ${weeks}

  `;

  printDocument(
    'IEFI 2026 - Horario',
    content,
    'landscape'
  );

}
/* =========================================================
   DOCENTES
   ========================================================= */

/*
 * Devuelve los registros del programa actualmente seleccionado.
 */
function printRecords() {

  if (!plan) {
    return [];
  }

  if (
    typeof DATA !== 'undefined' &&
    Array.isArray(DATA[plan])
  ) {
    return DATA[plan];
  }

  if (typeof currentRecords === 'function') {
    return currentRecords();
  }

  return [];
}


/*
 * Obtiene todos los docentes del programa seleccionado.
 *
 * El Map evita duplicados.
 */
function getAllTeachers() {

  const teachers = new Map();

  printRecords().forEach(
    record => {

      (record.weeks || []).forEach(
        week => {

          (week.cells || []).forEach(
            raw => {

              const item =
                parseCell(raw);

              if (
                !item ||
                item.holiday ||
                !item.teacher
              ) {
                return;
              }

              const name =
                printNormalize(
                  item.teacher
                );

              if (!name) {
                return;
              }

              const key =
                name.toLocaleLowerCase(
                  'es'
                );

              if (
                !teachers.has(key)
              ) {

                teachers.set(
                  key,
                  name
                );

              }

            }
          );

        }
      );

    }
  );

  return Array
    .from(teachers.values())
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          'es',
          {
            sensitivity: 'base'
          }
        )
    );

}


/*
 * Devuelve todas las participaciones
 * de un docente.
 */
function getTeacherSchedule(
  teacherName
) {

  const target =
    printNormalize(
      teacherName
    ).toLocaleLowerCase('es');

  if (!target) {
    return [];
  }

  const assignments = [];

  printRecords().forEach(
    record => {

      (record.weeks || []).forEach(
        (week, weekIndex) => {

          (week.cells || []).forEach(
            (raw, dayIndex) => {

              const item =
                parseCell(raw);

              if (
                !item ||
                item.holiday ||
                !item.teacher
              ) {
                return;
              }

              const currentTeacher =
                printNormalize(
                  item.teacher
                ).toLocaleLowerCase(
                  'es'
                );

              if (
                currentTeacher !== target
              ) {
                return;
              }

              const day =
                dayNames[dayIndex] || '';

              assignments.push({

                program:
                  plan,

                year:
                  record.year,

                section:
                  record.section,

                time:
                  record.time || '',

                week:
                  weekIndex + 1,

                day:
                  day,

                dayIndex:
                  dayIndex,

                date:
                  printDate(
                    week.dates?.[dayIndex],
                    day
                  ),

                subject:
                  item.subject || '',

                teacher:
                  item.teacher || ''

              });

            }
          );

        }
      );

    }
  );


  /*
   * Orden:
   *
   * año
   * semana
   * día
   * horario
   * división
   */
  assignments.sort(
    (a, b) => {

      const year =
        String(a.year)
          .localeCompare(
            String(b.year),
            'es',
            {
              numeric: true,
              sensitivity: 'base'
            }
          );

      if (year !== 0) {
        return year;
      }

      if (
        a.week !== b.week
      ) {
        return a.week - b.week;
      }

      if (
        a.dayIndex !== b.dayIndex
      ) {
        return (
          a.dayIndex -
          b.dayIndex
        );
      }

      const time =
        String(a.time)
          .localeCompare(
            String(b.time),
            'es',
            {
              numeric: true
            }
          );

      if (time !== 0) {
        return time;
      }

      return String(a.section)
        .localeCompare(
          String(b.section),
          'es',
          {
            sensitivity: 'base'
          }
        );

    }
  );

  return assignments;

}


/* =========================================================
   IMPRIMIR HORARIO DEL DOCENTE
   ========================================================= */

function printTeacherSchedule(
  teacherName
) {

  const assignments =
    getTeacherSchedule(
      teacherName
    );

  if (!assignments.length) {

    alert(
      'No encontramos actividades para el docente seleccionado.'
    );

    return;
  }

  const teacher =
    assignments[0].teacher;

  let rows = '';

  assignments.forEach(
    item => {

      rows += `

        <tr>

          <td>
            ${printEscape(
              item.program
            )}
          </td>

          <td>
            ${printEscape(
              item.year
            )} año
          </td>

          <td>
            ${printEscape(
              item.section
            )}
          </td>

          <td>
            ${printEscape(
              item.time
            )}
          </td>

          <td>
            Semana
            ${item.week}
          </td>

          <td>

            <strong>
              ${printEscape(
                item.day
              )}
            </strong>

            <div class="date">
              ${printEscape(
                item.date
              )}
            </div>

          </td>

          <td>

            <div class="subject">
              ${printEscape(
                item.subject
              )}
            </div>

          </td>

        </tr>

      `;

    }
  );


  const content = `

    ${printHeader(
      'Horario del docente',
      'Todas las participaciones del docente en IEFI 2026'
    )}

    <div class="info">

      <div class="info-item">

        <strong>
          Docente:
        </strong>

        ${printEscape(
          teacher
        )}

      </div>

      <div class="info-item">

        <strong>
          Programa:
        </strong>

        ${printEscape(
          plan
        )}

      </div>

      <div class="info-item">

        <strong>
          Total:
        </strong>

        ${assignments.length}
        participaciones

      </div>

    </div>


    <table>

      <thead>

        <tr>

          <th>
            Programa
          </th>

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
            Día / fecha
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

      Docente:
      ${printEscape(
        teacher
      )}

      ·

      ${assignments.length}
      participaciones

    </div>

  `;


  printDocument(
    'IEFI 2026 - Horario del docente',
    content,
    'landscape'
  );

}


/* =========================================================
   SELECTOR DE DOCENTES
   ========================================================= */
/*
function createTeacherSelector() {

  if (
    document.getElementById(
      'teacherSelector'
    )
  ) {
    return;
  }


  const searchWrap =
    document.querySelector(
      '.search-wrap'
    );


  if (!searchWrap) {
    return;
  }


  const wrapper =
    document.createElement(
      'div'
    );

  wrapper.id =
    'teacherPrintControls';


  wrapper.innerHTML = `

    <div class="teacher-print-label">

      Horario de docente

    </div>


    <select
      id="teacherSelector"
      class="teacher-selector"
      aria-label="Seleccionar docente"
    >

      <option value="">

        Seleccioná un docente

      </option>

    </select>


    <button
      id="printTeacher"
      class="print-button"
      type="button"
    >

      Imprimir horario del docente

    </button>

  `;


  searchWrap.appendChild(
    wrapper
  );


  const selector =
    document.getElementById(
      'teacherSelector'
    );


  const button =
    document.getElementById(
      'printTeacher'
    );


  function refresh() {

    const current =
      selector.value;

    const teachers =
      getAllTeachers();


    selector.innerHTML = `

      <option value="">

        Seleccioná un docente

      </option>


      ${
        teachers
          .map(
            name => `

              <option
                value="${printEscape(name)}"
              >

                ${printEscape(name)}

              </option>

            `
          )
          .join('')
      }

    `;


    if (
      teachers.includes(
        current
      )
    ) {

      selector.value =
        current;

    }

  }


  refresh();


  button.addEventListener(
    'click',
    () => {

      const teacher =
        selector.value;


      if (!teacher) {

        alert(
          'Seleccioná un docente antes de imprimir.'
        );

        return;
      }


      printTeacherSchedule(
        teacher
      );

    }
  );


  
  window.refreshTeacherSelector =
    refresh;

}
*/
/* =========================================================
   BOTÓN DE IMPRESIÓN DEL HORARIO
   ========================================================= */

function createSchedulePrintButton() {

  if (
    document.getElementById(
      'printSchedule'
    )
  ) {
    return;
  }


  const cronTop =
    document.querySelector(
      '.cron-top'
    );


  if (!cronTop) {
    return;
  }


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


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    createSchedulePrintButton();
    /*
    createTeacherSelector();
    */
  }
);