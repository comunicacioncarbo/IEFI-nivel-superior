/* =========================================================
   IEFI 2026 · ENSA CARBÓ
   Lógica de navegación e interacción
   ========================================================= */


/* =========================================================
   01. ESTADO DE LA APLICACIÓN
   ========================================================= */

let plan = null;
let yearIndex = 0;
let sectionIndex = 0;
let weekIndex = 0;
let query = '';

const dayNames = [
  'LUNES',
  'MARTES',
  'MIÉRCOLES',
  'JUEVES',
  'VIERNES'
];


/* =========================================================
   02. ELEMENTOS DEL DOM
   ========================================================= */

const planPEP = document.getElementById('planPEP');
const planPEI = document.getElementById('planPEI');

const recorridoSection =
  document.getElementById('recorrido');

const cronogramaSection =
  document.getElementById('cronograma');

const yearsContainer =
  document.getElementById('years');

const sectionsContainer =
  document.getElementById('sections');

const planContext =
  document.getElementById('planContext');

const selectedPlan =
  document.getElementById('selectedPlan');

const cronTitle =
  document.getElementById('cronTitle');

const cronContext =
  document.getElementById('cronContext');

const weeksContainer =
  document.getElementById('weeks');

const daysContainer =
  document.getElementById('days');

const searchInput =
  document.getElementById('search');

const searchResults =
  document.getElementById('searchResults');

const modal =
  document.getElementById('modal');

const modalClose =
  document.getElementById('modalClose');


/* =========================================================
   03. UTILIDADES
   ========================================================= */

function scrollToId(id) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}


function normalize(value) {

  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}


function escapeHtml(value) {

  return String(value || '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character])
  );
}


/* =========================================================
   04. DATOS
   ========================================================= */

/*
 * DATA viene de:
 *
 * data/data.js
 *
 * index.html debe cargar data.js
 * ANTES de script.js.
 */

function currentRecords() {

  if (!plan || !DATA[plan]) {
    return [];
  }

  return DATA[plan];
}


function years() {

  return [
    ...new Set(
      currentRecords()
        .map(record => record.year)
    )
  ];
}


function selected() {

  const availableYears =
    years();

  if (!availableYears.length) {
    return null;
  }

  const currentYear =
    availableYears[yearIndex];

  const candidates =
    currentRecords().filter(
      record =>
        record.year === currentYear
    );

  if (!candidates.length) {
    return null;
  }

  if (
    sectionIndex >=
    candidates.length
  ) {
    sectionIndex = 0;
  }

  return candidates[sectionIndex];
}


/* =========================================================
   05. PARSEO DE ACTIVIDADES
   ========================================================= */

function parseCell(raw) {

  raw = normalize(raw);

  if (!raw) {
    return null;
  }


  /*
   * Feriados
   */

  if (/^feriado/i.test(raw)) {

    return {
      subject: raw,
      teacher: '',
      holiday: true
    };
  }


  /*
   * Docente entre paréntesis
   */

  const matches = [
    ...raw.matchAll(
      /\(([^()]*)\)/g
    )
  ];


  if (matches.length) {

    const match =
      matches[matches.length - 1];


    return {

      subject: normalize(
        raw.slice(
          0,
          match.index
        )
      ),

      teacher: normalize(
        match[1]
      ),

      holiday: false

    };
  }


  return {

    subject: raw,

    teacher: '',

    holiday: false

  };
}


/* =========================================================
   06. VISIBILIDAD
   ========================================================= */

function showSection(section) {

  if (!section) return;

  section.classList.remove(
    'is-hidden'
  );
}


function hideSection(section) {

  if (!section) return;

  section.classList.add(
    'is-hidden'
  );
}


/* =========================================================
   07. LIMPIAR BÚSQUEDA
   ========================================================= */

function resetSearch() {

  query = '';

  if (searchInput) {
    searchInput.value = '';
  }

  if (searchResults) {

    searchResults.classList.remove(
      'open'
    );

    searchResults.innerHTML = '';
  }
}


/* =========================================================
   08. SELECCIÓN DE PLAN
   ========================================================= */

function setPlan(selectedPlanValue) {

  /*
   * Los únicos planes válidos son:
   *
   * PEP
   * PEI
   */

  if (
    selectedPlanValue !== 'PEP' &&
    selectedPlanValue !== 'PEI'
  ) {
    return;
  }


  plan =
    selectedPlanValue;


  yearIndex = 0;
  sectionIndex = 0;
  weekIndex = 0;


  resetSearch();


  /*
   * Activar tarjeta seleccionada.
   */

  planPEP.classList.toggle(
    'active',
    plan === 'PEP'
  );

  planPEI.classList.toggle(
    'active',
    plan === 'PEI'
  );


  /*
   * Ocultar el plan que no fue seleccionado.
   */

  planPEP.classList.toggle(
    'hidden',
    plan !== 'PEP'
  );

  planPEI.classList.toggle(
    'hidden',
    plan !== 'PEI'
  );


  /*
   * Mostrar recorrido.
   */

  showSection(
    recorridoSection
  );


  /*
   * El cronograma todavía
   * no debe aparecer.
   */

  hideSection(
    cronogramaSection
  );


  /*
   * Renderizar años.
   */

  renderYears();

  updatePlanContext();


  /*
   * Ir al siguiente paso.
   */

  setTimeout(() => {

    scrollToId(
      'recorrido'
    );

  }, 100);
}


/* =========================================================
   09. CONTEXTO DEL PLAN
   ========================================================= */

function updatePlanContext() {

  if (!plan) {

    planContext.innerHTML = '';

    selectedPlan.innerHTML = '';

    return;
  }


  planContext.innerHTML = `
    Plan seleccionado:
    <strong>${plan}</strong>
  `;


  selectedPlan.innerHTML = `

    <span class="selection-label">
      Plan seleccionado
    </span>

    <strong>
      ${plan}
    </strong>

    <button
      type="button"
      class="selection-change"
      id="changePlan"
    >
      Cambiar plan
    </button>

  `;


  const changePlanButton =
    document.getElementById(
      'changePlan'
    );


  if (changePlanButton) {

    changePlanButton.addEventListener(
      'click',
      resetToPlanSelection
    );
  }
}


/* =========================================================
   10. VOLVER A SELECCIÓN DE PLAN
   ========================================================= */

function resetToPlanSelection() {

  plan = null;

  yearIndex = 0;
  sectionIndex = 0;
  weekIndex = 0;


  resetSearch();


  planPEP.classList.remove(
    'active'
  );

  planPEI.classList.remove(
    'active'
  );


  planPEP.classList.remove(
    'hidden'
  );

  planPEI.classList.remove(
    'hidden'
  );


  hideSection(
    recorridoSection
  );

  hideSection(
    cronogramaSection
  );


  planContext.innerHTML = '';

  selectedPlan.innerHTML = '';


  scrollToId(
    'planes'
  );
}


/* =========================================================
   11. RENDERIZAR AÑOS
   ========================================================= */

function renderYears() {

  if (!plan) {

    yearsContainer.innerHTML = '';

    sectionsContainer.innerHTML = '';

    return;
  }


  const availableYears =
    years();


  yearsContainer.innerHTML =
    availableYears
      .map(
        (year, index) => {

          const sectionCount =
            currentRecords().filter(
              record =>
                record.year === year
            ).length;


          return `

            <button
              class="year-card ${
                index === yearIndex
                  ? 'active'
                  : ''
              }"
              data-year-index="${index}"
              type="button"
            >

              <div class="year-no">
                ${String(index + 1)
                  .padStart(2, '0')}
              </div>

              <h4>
                ${escapeHtml(year)}
                año
              </h4>

              <small>
                ${sectionCount}

                ${
                  sectionCount === 1
                    ? 'sección disponible'
                    : 'secciones disponibles'
                }

              </small>

            </button>

          `;

        }
      )
      .join('');


  /*
   * Eventos de años.
   */

  yearsContainer
    .querySelectorAll(
      '.year-card'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(
              button.dataset
                .yearIndex
            );

          selectYear(index);

        }
      );

    });


  renderSections();
}


/* =========================================================
   12. SELECCIÓN DE AÑO
   ========================================================= */

function selectYear(index) {

  yearIndex = index;

  sectionIndex = 0;
  weekIndex = 0;


  resetSearch();


  /*
   * El cronograma permanece oculto.
   */

  hideSection(
    cronogramaSection
  );


  renderYears();


  /*
   * Llevar al usuario a las secciones.
   */

  setTimeout(() => {

    sectionsContainer.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

  }, 100);
}


/* =========================================================
   13. RENDERIZAR SECCIONES
   ========================================================= */

function renderSections() {

  if (!plan) {

    sectionsContainer.innerHTML = '';

    return;
  }


  const availableYears =
    years();


  const currentYear =
    availableYears[yearIndex];


  const candidates =
    currentRecords().filter(
      record =>
        record.year === currentYear
    );


  sectionsContainer.innerHTML = `

    <div class="sections-title">
      Elegí tu sección
    </div>

    <div class="sections-list">

      ${
        candidates
          .map(
            (record, index) => `

              <button
                class="section-chip ${
                  index === sectionIndex
                    ? 'active'
                    : ''
                }"
                data-section-index="${index}"
                type="button"
              >

                Sección
                ${escapeHtml(
                  record.section
                )}

                ${
                  record.time
                    ? ` · ${escapeHtml(
                        record.time
                      )}`
                    : ''
                }

              </button>

            `
          )
          .join('')
      }

    </div>

  `;


  /*
   * Eventos de secciones.
   */

  sectionsContainer
    .querySelectorAll(
      '.section-chip'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(
              button.dataset
                .sectionIndex
            );

          selectSection(index);

        }
      );

    });
}


/* =========================================================
   14. SELECCIÓN DE SECCIÓN
   ========================================================= */

function selectSection(index) {

  sectionIndex = index;

  weekIndex = 0;


  resetSearch();


  const record =
    selected();


  if (!record) {
    return;
  }


  /*
   * Ahora sí aparece el cronograma.
   */

  render();

  showSection(
    cronogramaSection
  );


  setTimeout(() => {

    scrollToId(
      'cronograma'
    );

  }, 100);
}


/* =========================================================
   15. RENDERIZAR SEMANAS
   ========================================================= */

function renderWeeks() {

  const record =
    selected();


  if (!record) {

    weeksContainer.innerHTML = '';

    return;
  }


  weeksContainer.innerHTML =
    (record.weeks || [])
      .map(
        (week, index) => {

          const dates =
            week.dates || [];


          const firstDate =
            dates[0]
              ?.replace(
                /^LUNES /,
                ''
              ) || '';


          const lastDate =
            dates[4]
              ?.replace(
                /^VIERNES /,
                ''
              ) || '';


          return `

            <button
              class="week ${
                index === weekIndex
                  ? 'active'
                  : ''
              }"
              data-week-index="${index}"
              type="button"
            >

              <span class="num">
                Semana ${index + 1}
              </span>

              <span class="date">
                ${escapeHtml(firstDate)}
                —
                ${escapeHtml(lastDate)}
              </span>

            </button>

          `;

        }
      )
      .join('');


  /*
   * Eventos de semanas.
   */

  weeksContainer
    .querySelectorAll(
      '.week'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(
              button.dataset
                .weekIndex
            );

          selectWeek(index);

        }
      );

    });
}


/* =========================================================
   16. SELECCIÓN DE SEMANA
   ========================================================= */

function selectWeek(index) {

  weekIndex = index;

  renderWeeks();

  renderDays();


  scrollToId(
    'cronograma'
  );
}


/* =========================================================
   17. RENDERIZAR DÍAS
   ========================================================= */

function renderDays() {

  const record =
    selected();


  if (!record) {

    daysContainer.innerHTML = '';

    return;
  }


  const week =
    record.weeks[weekIndex] || {
      dates: [],
      cells: []
    };


  const searchTerm =
    query
      .toLowerCase()
      .trim();


  daysContainer.innerHTML =
    dayNames
      .map(
        (day, index) => {

          const item =
            parseCell(
              week.cells?.[index]
            );


          const date =
            normalize(
              week.dates?.[index]
            ).replace(
              day + ' ',
              ''
            );


          /*
           * Día sin actividad.
           */

          if (!item) {

            return `

              <article class="day">

                <div class="day-head">

                  <div class="day-name">
                    ${day}
                  </div>

                  <div class="day-date">
                    ${escapeHtml(date)}
                  </div>

                </div>

                <div class="item empty">

                  ${
                    searchTerm
                      ? 'Sin coincidencias'
                      : 'Sin espacio asignado'
                  }

                </div>

              </article>

            `;
          }


          /*
           * Filtrado de búsqueda.
           */

          const matches =
            !searchTerm ||
            (
              item.subject +
              ' ' +
              item.teacher
            )
              .toLowerCase()
              .includes(searchTerm);


          if (!matches) {

            return `

              <article class="day">

                <div class="day-head">

                  <div class="day-name">
                    ${day}
                  </div>

                  <div class="day-date">
                    ${escapeHtml(date)}
                  </div>

                </div>

                <div class="item empty">
                  Sin coincidencias
                </div>

              </article>

            `;
          }


          /*
           * Actividad.
           */

          return `

            <article class="day">

              <div class="day-head">

                <div class="day-name">
                  ${day}
                </div>

                <div class="day-date">
                  ${escapeHtml(date)}
                </div>

              </div>

              <div
                class="item ${
                  item.holiday
                    ? 'holiday'
                    : ''
                }"
                data-day-index="${index}"
              >

                <div class="subject">
                  ${escapeHtml(
                    item.subject
                  )}
                </div>

                ${
                  item.teacher
                    ? `
                      <div class="teacher">
                        ${escapeHtml(
                          item.teacher
                        )}
                      </div>
                    `
                    : ''
                }

              </div>

            </article>

          `;

        }
      )
      .join('');


  /*
   * Eventos para abrir modal.
   */

  daysContainer
    .querySelectorAll(
      '.item:not(.empty):not(.holiday)'
    )
    .forEach(item => {

      item.addEventListener(
        'click',
        () => {

          const day =
            Number(
              item.dataset.dayIndex
            );

          openModal(day);

        }
      );

    });
}


/* =========================================================
   18. RENDER GENERAL
   ========================================================= */

function render() {

  if (!plan) {
    return;
  }


  const record =
    selected();


  if (!record) {
    return;
  }


  /*
   * Contexto del plan.
   */

  planContext.innerHTML = `
    Plan seleccionado:
    <strong>${plan}</strong>
  `;


  /*
   * Resumen del recorrido.
   */

  selectedPlan.innerHTML = `

    <span class="selection-label">
      Recorrido seleccionado
    </span>

    <strong>
      ${plan}
    </strong>

    <span>
      · ${escapeHtml(
        record.year
      )} año
    </span>

    <span>
      · Sección
      ${escapeHtml(
        record.section
      )}
    </span>

    ${
      record.time
        ? `
          <span>
            · ${escapeHtml(
              record.time
            )}
          </span>
        `
        : ''
    }

    <button
      type="button"
      class="selection-change"
      id="changePlan"
    >
      Cambiar
    </button>

  `;


  const changePlanButton =
    document.getElementById(
      'changePlan'
    );


  if (changePlanButton) {

    changePlanButton.addEventListener(
      'click',
      resetToPlanSelection
    );
  }


  /*
   * Contexto del cronograma.
   */

  cronTitle.textContent =
    `Semana ${weekIndex + 1}`;


  cronContext.innerHTML = `

    <strong>
      ${plan}
    </strong>

    · ${escapeHtml(
      record.year
    )} año

    · Sección
    <strong>
      ${escapeHtml(
        record.section
      )}
    </strong>

    · IEFI

  `;


  renderYears();

  renderWeeks();

  renderDays();
}


/* =========================================================
   19. MODAL
   ========================================================= */

function openModal(day) {

  const record =
    selected();


  if (!record) {
    return;
  }


  const week =
    record.weeks[weekIndex];


  if (!week) {
    return;
  }


  const item =
    parseCell(
      week.cells?.[day]
    );


  if (!item) {
    return;
  }


  document.getElementById(
    'modalTag'
  ).textContent =

    `${plan} · ` +
    `${record.year} año · ` +
    `Sección ${record.section}`;


  document.getElementById(
    'modalTitle'
  ).textContent =
    item.subject;


  document.getElementById(
    'modalTeacher'
  ).textContent =

    item.teacher
      ? `Docente: ${item.teacher}`
      : 'Docente no consignado.';


  document.getElementById(
    'modalDate'
  ).textContent =

    `${week.dates?.[day] || ''} · ` +
    `Semana ${weekIndex + 1}`;


  modal.classList.add(
    'open'
  );


  modal.setAttribute(
    'aria-hidden',
    'false'
  );
}


function closeModal() {

  modal.classList.remove(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'true'
  );
}


/* =========================================================
   20. BÚSQUEDA
   ========================================================= */

function allSearchResults(term) {

  const q =
    term
      .toLowerCase()
      .trim();


  if (!q || !plan) {
    return [];
  }


  const results = [];


  currentRecords().forEach(
    (record, recordIndex) => {

      (record.weeks || [])
        .forEach(
          (week, weekIndex) => {

            (week.cells || [])
              .forEach(
                (raw, dayIndex) => {

                  const item =
                    parseCell(raw);


                  if (
                    !item ||
                    item.holiday
                  ) {
                    return;
                  }


                  const haystack =
                    (
                      item.subject +
                      ' ' +
                      item.teacher
                    )
                      .toLowerCase();


                  if (
                    !haystack.includes(q)
                  ) {
                    return;
                  }


                  results.push({

                    recordIndex,

                    year:
                      record.year,

                    section:
                      record.section,

                    time:
                      record.time,

                    week:
                      weekIndex,

                    day:
                      dayIndex,

                    date:
                      normalize(
                        week.dates?.[
                          dayIndex
                        ]
                      ).replace(
                        dayNames[dayIndex] +
                        ' ',
                        ''
                      ),

                    dayName:
                      dayNames[dayIndex],

                    subject:
                      item.subject,

                    teacher:
                      item.teacher

                  });

                }
              );

          }
        );

    }
  );


  return results;
}


/* =========================================================
   21. RESALTAR COINCIDENCIAS
   ========================================================= */

function highlight(
  text,
  term
) {

  if (!term) {
    return escapeHtml(text);
  }


  const safe =
    escapeHtml(text);


  const escaped =
    term.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );


  return safe.replace(
    new RegExp(
      '(' + escaped + ')',
      'ig'
    ),
    '<span class="search-match">$1</span>'
  );
}


/* =========================================================
   22. RESULTADOS DE BÚSQUEDA
   ========================================================= */

function renderSearchResults() {

  const box =
    searchResults;


  const term =
    searchInput.value.trim();


  if (!term || !plan) {

    box.classList.remove(
      'open'
    );

    box.innerHTML = '';

    return;
  }


  const results =
    allSearchResults(term);


  if (!results.length) {

    box.innerHTML = `

      <div class="search-empty">
        No encontramos ese docente
        o espacio en el plan seleccionado.
      </div>

    `;

    box.classList.add(
      'open'
    );

    return;
  }


  const visible =
    results.slice(
      0,
      8
    );


  box.innerHTML =
    visible
      .map(
        (result, index) => `

          <button
            class="search-result"
            data-result-index="${index}"
            type="button"
          >

            <span class="result-week">

              <strong>
                ${result.week + 1}
              </strong>

              <small>
                semana
              </small>

            </span>


            <span class="result-info">

              <span class="result-subject">

                ${highlight(
                  result.subject,
                  term
                )}

              </span>


              ${
                result.teacher
                  ? `
                    <span class="result-teacher">

                      ${highlight(
                        result.teacher,
                        term
                      )}

                    </span>
                  `
                  : ''
              }


              <span class="result-meta">

                ${result.dayName}

                · ${escapeHtml(
                  result.date
                )}

                · ${escapeHtml(
                  result.year
                )} año

                · Sección
                ${escapeHtml(
                  result.section
                )}

              </span>

            </span>

          </button>

        `
      )
      .join('');


  if (results.length > 8) {

    box.innerHTML += `

      <div class="search-empty">

        Mostrando 8 resultados de
        ${results.length}.

        Refiná la búsqueda para encontrar
        uno específico.

      </div>

    `;
  }


  /*
   * Guardamos resultados para poder
   * acceder al resultado seleccionado.
   */

  window.__searchResults =
    results;


  /*
   * Eventos.
   */

  box
    .querySelectorAll(
      '.search-result'
    )
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const index =
            Number(
              button.dataset
                .resultIndex
            );

          goToSearchResult(
            index
          );

        }
      );

    });


  box.classList.add(
    'open'
  );
}


/* =========================================================
   23. IR A RESULTADO DE BÚSQUEDA
   ========================================================= */

function goToSearchResult(index) {

  const results =
    window.__searchResults || [];


  const result =
    results[index];


  if (!result) {
    return;
  }


  const availableYears =
    years();


  yearIndex =
    availableYears.indexOf(
      result.year
    );


  const candidates =
    currentRecords().filter(
      record =>
        record.year === result.year
    );


  sectionIndex =
    candidates.findIndex(
      record =>
        record.section ===
        result.section
    );


  if (sectionIndex < 0) {
    sectionIndex = 0;
  }


  weekIndex =
    result.week;


  query =
    searchInput.value;


  /*
   * Aseguramos que el cronograma
   * esté visible.
   */

  showSection(
    recorridoSection
  );

  showSection(
    cronogramaSection
  );


  render();


  searchResults.classList.remove(
    'open'
  );


  setTimeout(() => {

    const target =
      document.querySelector(
        `.day .item[data-day-index="${result.day}"]`
      );


    if (!target) {

      scrollToId(
        'cronograma'
      );

      return;
    }


    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });


    target.style.boxShadow =
      '0 0 0 3px rgba(185,31,34,.22)';

    target.style.background =
      '#f9eded';


    setTimeout(() => {

      target.style.boxShadow = '';

      target.style.background = '';

    }, 1800);

  }, 80);
}


/* =========================================================
   24. NAVEGACIÓN SUPERIOR
   ========================================================= */

const navPlanes =
  document.getElementById(
    'navPlanes'
  );

const navRecorrido =
  document.getElementById(
    'navRecorrido'
  );

const navCronograma =
  document.getElementById(
    'navCronograma'
  );


if (navPlanes) {

  navPlanes.addEventListener(
    'click',
    () => {

      scrollToId(
        'planes'
      );

    }
  );

}


if (navRecorrido) {

  navRecorrido.addEventListener(
    'click',
    () => {

      if (!plan) {

        scrollToId(
          'planes'
        );

        return;
      }


      scrollToId(
        'recorrido'
      );

    }
  );

}


if (navCronograma) {

  navCronograma.addEventListener(
    'click',
    () => {

      if (!plan) {

        scrollToId(
          'planes'
        );

        return;
      }


      if (!selected()) {

        scrollToId(
          'recorrido'
        );

        return;
      }


      showSection(
        cronogramaSection
      );


      scrollToId(
        'cronograma'
      );

    }
  );

}


/* =========================================================
   25. EVENTOS DE PLAN
   ========================================================= */

planPEP.addEventListener(
  'click',
  () => {

    setPlan('PEP');

  }
);


planPEI.addEventListener(
  'click',
  () => {

    setPlan('PEI');

  }
);


/* =========================================================
   26. BÚSQUEDA
   ========================================================= */

searchInput.addEventListener(
  'input',
  event => {

    query =
      event.target.value;


    renderDays();

    renderSearchResults();

  }
);


searchInput.addEventListener(
  'focus',
  () => {

    if (
      searchInput.value.trim()
    ) {

      renderSearchResults();

    }

  }
);


/* =========================================================
   27. CERRAR RESULTADOS DE BÚSQUEDA
   ========================================================= */

document.addEventListener(
  'click',
  event => {

    const searchWrap =
      document.querySelector(
        '.search-wrap'
      );


    if (
      searchWrap &&
      !searchWrap.contains(
        event.target
      )
    ) {

      searchResults.classList.remove(
        'open'
      );

    }

  }
);


/* =========================================================
   28. MODAL
   ========================================================= */

if (modalClose) {

  modalClose.addEventListener(
    'click',
    closeModal
  );

}


if (modal) {

  modal.addEventListener(
    'click',
    event => {

      if (
        event.target === modal
      ) {

        closeModal();

      }

    }
  );

}


document.addEventListener(
  'keydown',
  event => {

    if (
      event.key === 'Escape' &&
      modal &&
      modal.classList.contains('open')
    ) {

      closeModal();

    }

  }
);


/* =========================================================
   29. ESTADO INICIAL
   ========================================================= */

/*
 * Al entrar:
 *
 * - No hay plan seleccionado.
 * - PEP y PEI están visibles.
 * - Recorrido está oculto.
 * - Cronograma está oculto.
 *
 * Flujo:
 *
 *       PEP / PEI
 *           ↓
 *          AÑO
 *           ↓
 *        SECCIÓN
 *           ↓
 *       CRONOGRAMA
 */

plan = null;

yearIndex = 0;
sectionIndex = 0;
weekIndex = 0;

hideSection(
  recorridoSection
);

hideSection(
  cronogramaSection
);

planPEP.classList.remove(
  'active'
);

planPEI.classList.remove(
  'active'
);

planPEP.classList.remove(
  'hidden'
);

planPEI.classList.remove(
  'hidden'
);