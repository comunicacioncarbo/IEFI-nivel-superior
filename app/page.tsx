"use client";

import { useEffect, useMemo, useState } from "react";
import { generateSchedulePdf } from "@/lib/pdf/generate-schedule-pdf";

type PlanCode = "PEP" | "PEI";
type Section = "A" | "B" | "C" | "D";

type Evaluation = {
  id: string;
  plan: PlanCode;
  year: number;
  section: Section;
  time: string | null;
  date: string;
  subject: string;
  teacher: string | null;
  notes: string | null;
};

type ApiResponse = {
  success: boolean;
  count: number;
  data: Evaluation[];
  error?: string;
};

const PLAN_DESCRIPTIONS: Record<PlanCode, string> = {
  PEP: "Recorrido correspondiente al cronograma PEP 2026 de ENSA Carbó.",
  PEI: "Recorrido correspondiente al segundo cronograma institucional provisto.",
};

const SECTION_ORDER: Section[] = ["A", "B", "C", "D"];

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day));
}

function formatTime(time: string | null): string {
  if (!time) {
    return "";
  }

  return time.slice(0, 5);
}

function getDayName(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function getWeekNumber(date: string): number {
  const current = new Date(`${date}T12:00:00`);
  const start = new Date("2026-11-02T12:00:00");

  const diff = Math.floor(
    (current.getTime() - start.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return Math.floor(diff / 7) + 1;
}

export default function Home() {
  const [selectedPlan, setSelectedPlan] =
    useState<PlanCode | null>(null);

  const [selectedYear, setSelectedYear] =
    useState<number | null>(null);

  const [selectedSection, setSelectedSection] =
    useState<Section | null>(null);

  const [evaluations, setEvaluations] =
    useState<Evaluation[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [generatingPdf, setGeneratingPdf] =
    useState(false);

  /*
   * ==========================================
   * CARGA DE EVALUACIONES
   * ==========================================
   */

  useEffect(() => {
    if (!selectedPlan) {
      setEvaluations([]);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadEvaluations() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/evaluations?plan=${selectedPlan}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar las evaluaciones."
          );
        }

        const result =
          (await response.json()) as ApiResponse;

        if (!result.success) {
          throw new Error(
            result.error ??
              "Error cargando los datos."
          );
        }

        if (!cancelled) {
          setEvaluations(
            Array.isArray(result.data)
              ? result.data
              : []
          );
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Ocurrió un error inesperado."
        );

        setEvaluations([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvaluations();

    return () => {
      cancelled = true;
    };
  }, [selectedPlan]);

  /*
   * ==========================================
   * AÑOS DISPONIBLES
   * ==========================================
   */

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        evaluations.map(
          (evaluation) => evaluation.year
        )
      )
    ).sort((a, b) => a - b);
  }, [evaluations]);

  /*
   * ==========================================
   * SECCIONES DISPONIBLES
   * ==========================================
   */

  const availableSections = useMemo(() => {
    if (selectedYear === null) {
      return [];
    }

    return SECTION_ORDER.filter((section) =>
      evaluations.some(
        (evaluation) =>
          evaluation.year === selectedYear &&
          evaluation.section === section
      )
    );
  }, [evaluations, selectedYear]);

  /*
   * ==========================================
   * EVALUACIONES DEL RECORRIDO
   * ==========================================
   */

  const selectedEvaluations = useMemo(() => {
    if (
      selectedYear === null ||
      selectedSection === null
    ) {
      return [];
    }

    return evaluations
      .filter(
        (evaluation) =>
          evaluation.year === selectedYear &&
          evaluation.section === selectedSection
      )
      .sort((a, b) => {
        const dateCompare =
          a.date.localeCompare(b.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return (a.time ?? "").localeCompare(
          b.time ?? ""
        );
      });
  }, [
    evaluations,
    selectedYear,
    selectedSection,
  ]);

  /*
   * ==========================================
   * BÚSQUEDA
   * ==========================================
   */

  const filteredEvaluations = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return selectedEvaluations;
    }

    return selectedEvaluations.filter(
      (evaluation) => {
        const subject =
          evaluation.subject?.toLowerCase() ?? "";

        const teacher =
          evaluation.teacher?.toLowerCase() ?? "";

        const notes =
          evaluation.notes?.toLowerCase() ?? "";

        return (
          subject.includes(term) ||
          teacher.includes(term) ||
          notes.includes(term)
        );
      }
    );
  }, [selectedEvaluations, search]);

  /*
   * ==========================================
   * AGRUPACIÓN POR SEMANA
   * ==========================================
   */

  const groupedByWeek = useMemo(() => {
    const groups = new Map<
      number,
      Evaluation[]
    >();

    for (const evaluation of filteredEvaluations) {
      const week = getWeekNumber(
        evaluation.date
      );

      const existing = groups.get(week);

      if (existing) {
        existing.push(evaluation);
      } else {
        groups.set(week, [evaluation]);
      }
    }

    return Array.from(groups.entries()).sort(
      ([weekA], [weekB]) => weekA - weekB
    );
  }, [filteredEvaluations]);

  /*
   * ==========================================
   * DESCARGA PDF
   * ==========================================
   */

  async function handleDownloadPdf() {
    if (
      !selectedPlan ||
      selectedYear === null ||
      selectedSection === null ||
      selectedEvaluations.length === 0 ||
      generatingPdf
    ) {
      return;
    }

    try {
      setGeneratingPdf(true);

      await generateSchedulePdf({
        evaluations: selectedEvaluations,
        plan: selectedPlan,
        year: selectedYear,
        section: selectedSection,
      });
    } catch (err) {
      console.error(
        "Error generando PDF:",
        err
      );

      setError(
        "No se pudo generar el PDF."
      );
    } finally {
      setGeneratingPdf(false);
    }
  }

  /*
   * ==========================================
   * SELECCIÓN DE PLAN
   * ==========================================
   */

  function handlePlanSelect(
    plan: PlanCode
  ) {
    if (selectedPlan === plan) {
      setSelectedPlan(null);
      setSelectedYear(null);
      setSelectedSection(null);
      setSearch("");
      return;
    }

    setSelectedPlan(plan);
    setSelectedYear(null);
    setSelectedSection(null);
    setSearch("");
    setError(null);

    window.setTimeout(() => {
      document
        .getElementById("recorrido")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  /*
   * ==========================================
   * SELECCIÓN DE AÑO
   * ==========================================
   */

  function handleYearSelect(
    year: number
  ) {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedSection(null);
      setSearch("");
      return;
    }

    setSelectedYear(year);
    setSelectedSection(null);
    setSearch("");
  }

  /*
   * ==========================================
   * SELECCIÓN DE SECCIÓN
   * ==========================================
   */

  function handleSectionSelect(
    section: Section
  ) {
    if (selectedSection === section) {
      setSelectedSection(null);
      setSearch("");
      return;
    }

    setSelectedSection(section);
    setSearch("");

    window.setTimeout(() => {
      document
        .getElementById("cronograma")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  /*
   * ==========================================
   * NAVEGACIÓN ENTRE SEMANAS
   * ==========================================
   */

  function scrollToWeek(
    week: number
  ) {
    document
      .querySelector(
        `[data-week="${week}"]`
      )
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }

  /*
   * ==========================================
   * RENDER
   * ==========================================
   */

  return (
    <div className="page">

      {/* ======================================
          NAV
          ====================================== */}

      <header className="nav">
        <div className="nav-inner">

          <a
            className="brand"
            href="#inicio"
            aria-label="Inicio"
          >
            <span className="mark logo-mark">
              <img
                src="/resources/Logo-A-Carbo-Blanco1-1711x1900.png"
                alt="Logo ENSA Carbó"
              />
            </span>
          </a>

          <div className="nav-links">

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("planes")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Planes
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("recorrido")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Recorrido
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("cronograma")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Cronograma
            </button>

          </div>
        </div>
      </header>

      <main>

        {/* ====================================
            HERO
            ==================================== */}

        <section
          id="inicio"
          className="hero"
        >

          <div>

            <div className="eyebrow">
              Escuela Normal Superior Dr. Alejandro
              Carbó
            </div>

            <h1>
              IEFI
              <br />
              <span>2026</span>
            </h1>

            <p>
              Instancias Evaluativas Finales
              Integradoras. Un cronograma para recorrer
              por plan, año, sección y semana.
            </p>

          </div>

          <div className="hero-side">

            <div className="big">
              NOV
            </div>

            <p>
              Del 2 al 27 de noviembre de 2026.
              <br />
              Cuatro semanas de organización académica.
            </p>

          </div>

        </section>

        {/* ====================================
            PLANES
            ==================================== */}

        <section
          id="planes"
          className="section"
        >

          <div className="section-head">

            <div>

              <div className="section-kicker">
                01 · Elegí tu plan
              </div>

              <h2 className="section-title">
                Dos recorridos.
              </h2>

            </div>

            <div className="context">
              Seleccioná uno para comenzar.
            </div>

          </div>

          <div className="plan-grid">

            <button
              type="button"
              className={`plan-card ${
                selectedPlan === "PEP"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handlePlanSelect("PEP")
              }
            >
              <div className="label">
                Plan
              </div>

              <h3>
                PEP
              </h3>

              <p>
                {PLAN_DESCRIPTIONS.PEP}
              </p>

              <span className="arrow">
                ↗
              </span>
            </button>

            <button
              type="button"
              className={`plan-card ${
                selectedPlan === "PEI"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handlePlanSelect("PEI")
              }
            >
              <div className="label">
                Plan
              </div>

              <h3>
                PEI
              </h3>

              <p>
                {PLAN_DESCRIPTIONS.PEI}
              </p>

              <span className="arrow">
                ↗
              </span>
            </button>

          </div>

          {loading && (
            <div className="context">
              Cargando cronograma…
            </div>
          )}

          {error && (
            <div className="context">
              {error}
            </div>
          )}

        </section>

        {/* ====================================
            RECORRIDO
            ==================================== */}

        <section
          id="recorrido"
          className={`route ${
            selectedPlan
              ? ""
              : "is-hidden"
          }`}
        >

          <div
            className="section"
            style={{
              paddingTop: 0,
              paddingBottom: 0,
            }}
          >

            <div className="section-head">

              <div>

                <div className="section-kicker">
                  02 · Tu recorrido
                </div>

                <h2 className="section-title">
                  Elegí año y sección.
                </h2>

              </div>

              <div className="context">
                {selectedPlan
                  ? `Plan ${selectedPlan}`
                  : "Plan seleccionado"}
              </div>

            </div>

            <div
              id="years"
              className="year-grid"
            >

              {availableYears.map(
                (year) => (
                  <button
                    key={year}
                    type="button"
                    className={
                      selectedYear === year
                        ? "active"
                        : ""
                    }
                    aria-pressed={
                      selectedYear === year
                    }
                    onClick={() =>
                      handleYearSelect(year)
                    }
                  >
                    {year}
                  </button>
                )
              )}

            </div>

            {selectedYear !== null && (
              <div
                id="sections"
                className="sections"
              >

                {availableSections.map(
                  (section) => (
                    <button
                      key={section}
                      type="button"
                      className={
                        selectedSection ===
                        section
                          ? "active"
                          : ""
                      }
                      aria-pressed={
                        selectedSection ===
                        section
                      }
                      onClick={() =>
                        handleSectionSelect(
                          section
                        )
                      }
                    >
                      {section}
                    </button>
                  )
                )}

              </div>
            )}

          </div>

        </section>

        {/* ====================================
            CRONOGRAMA
            ==================================== */}

        <section
          id="cronograma"
          className={`cron ${
            selectedSection
              ? ""
              : "is-hidden"
          }`}
        >

          <div className="cron-top">

            <div>

              <div className="section-kicker">
                03 · Organización semanal
              </div>

              <h2 className="section-title">
                Cronograma
              </h2>

              <div className="context">
                {selectedPlan &&
                  selectedYear !== null &&
                  selectedSection &&
                  `${selectedPlan} · ${selectedYear}° · Sección ${selectedSection}`}
              </div>

              <div className="search-hint">
                Buscá un docente o espacio dentro
                del recorrido seleccionado.
              </div>

            </div>

            <div className="search-wrap">

              <div className="search-label">
                Buscá un docente o espacio
              </div>

              <input
                className="search"
                type="search"
                autoComplete="off"
                placeholder="Ej.: Giménez, Pedagogía, Navarro…"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <div className="schedule-actions">

                <button
                  type="button"
                  className="download-pdf"
                  onClick={
                    handleDownloadPdf
                  }
                  disabled={
                    generatingPdf ||
                    selectedEvaluations.length ===
                      0
                  }
                >
                  {generatingPdf
                    ? "Generando PDF…"
                    : "Descargar cronograma PDF"}
                </button>

              </div>

            </div>

          </div>

          {groupedByWeek.length > 0 && (
            <div className="weeks">

              {groupedByWeek.map(
                ([week]) => (
                  <button
                    key={week}
                    type="button"
                    onClick={() =>
                      scrollToWeek(week)
                    }
                  >
                    Semana {week}
                  </button>
                )
              )}

            </div>
          )}

          <div className="days">

            {groupedByWeek.map(
              ([week, weekEvaluations]) => (

                <section
                  key={week}
                  className="week"
                  data-week={week}
                >

                  <div className="week-header">

                    <span className="section-kicker">
                      Semana {week}
                    </span>

                  </div>

                  <div className="evaluation-list">

                    {weekEvaluations.map(
                      (evaluation) => (

                        <article
                          key={evaluation.id}
                          className="evaluation-card"
                        >

                          <div className="evaluation-date">

                            <span className="evaluation-day">
                              {getDayName(
                                evaluation.date
                              )}
                            </span>

                            <strong>
                              {formatDate(
                                evaluation.date
                              )}
                            </strong>

                          </div>

                          {evaluation.time && (
                            <div className="evaluation-time">
                              {formatTime(
                                evaluation.time
                              )}
                            </div>
                          )}

                          <div className="evaluation-content">

                            <h3>
                              {evaluation.subject}
                            </h3>

                            {evaluation.teacher && (
                              <p className="evaluation-teacher">
                                {evaluation.teacher}
                              </p>
                            )}

                            {evaluation.notes && (
                              <p className="evaluation-notes">
                                {evaluation.notes}
                              </p>
                            )}

                          </div>

                        </article>

                      )
                    )}

                  </div>

                </section>

              )
            )}

          </div>

          {search.trim() &&
            filteredEvaluations.length === 0 && (
              <div className="context search-empty">
                No se encontraron evaluaciones para
                “{search}”.
              </div>
            )}

          {!search.trim() &&
            selectedSection &&
            selectedEvaluations.length === 0 && (
              <div className="context search-empty">
                No hay evaluaciones disponibles para
                esta selección.
              </div>
            )}

        </section>

      </main>

      {/* ======================================
          FOOTER
          ====================================== */}

      <footer className="footer">

        <div className="footer-inner">

          <div>

            <strong>
              ENSA Carbó · IEFI 2026
            </strong>

            <br />

            Organización institucional

          </div>

          <div>
            PEP · PEI · Noviembre 2026
          </div>

          <div className="footer-logo">

            <img
              src="/resources/original.svg"
              alt="Logo Dpto Comunicación"
            />

          </div>

        </div>

        <div className="footer-credit">
          Página construida por Dpto. de Comunicación
          ENSA Carbó. Toda la información fué suministrada por la Coordinación de Curso de N. Superior
        </div>

      </footer>

    </div>
  );
}