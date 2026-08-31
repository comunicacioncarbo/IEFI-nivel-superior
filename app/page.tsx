export default function Home() {
  return (
    <div className="page">
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
            <button type="button">
              Planes
            </button>

            <button type="button">
              Recorrido
            </button>

            <button type="button">
              Cronograma
            </button>
          </div>
        </div>
      </header>

      <main>
        <section id="inicio" className="hero">
          <div>
            <div className="eyebrow">
              Escuela Normal Superior Dr. Alejandro Carbó
            </div>

            <h1>
              IEFI
              <br />
              <span>2026</span>
            </h1>

            <p>
              Instancias Evaluativas Finales Integradoras.
              Un cronograma para recorrer por plan,
              año, sección y semana.
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
              className="plan-card active"
              type="button"
            >
              <div className="label">
                Plan
              </div>

              <h3>
                PEP
              </h3>

              <p>
                Recorrido correspondiente al cronograma
                PEP 2026 de ENSA Carbó.
              </p>

              <span className="arrow">
                ↗
              </span>
            </button>

            <button
              className="plan-card"
              type="button"
            >
              <div className="label">
                Plan
              </div>

              <h3>
                PEI
              </h3>

              <p>
                Recorrido correspondiente al segundo
                cronograma institucional provisto.
              </p>

              <span className="arrow">
                ↗
              </span>
            </button>
          </div>
        </section>

        <section
          id="recorrido"
          className="route is-hidden"
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
                Plan seleccionado
              </div>
            </div>

            <div
              id="years"
              className="year-grid"
            />

            <div
              id="sections"
              className="sections"
            />
          </div>
        </section>

        <section
          id="cronograma"
          className="cron is-hidden"
        >
          <div className="cron-top">
            <div>
              <div className="section-kicker">
                03 · Organización semanal
              </div>

              <h2 className="section-title">
                Semana 1
              </h2>

              <div className="context">
                Cronograma
              </div>

              <div className="search-hint">
                La búsqueda recorre todo el plan y te lleva
                directamente a la semana y al día correspondiente.
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
              />
            </div>
          </div>

          <div className="weeks" />
          <div className="days" />
        </section>
      </main>

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
          Página construida por Dpto. de Comunicación ENSA Carbó
        </div>
      </footer>
    </div>
  );
}