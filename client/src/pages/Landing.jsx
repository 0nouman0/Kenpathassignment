import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Layout'

/* ------------------------------------------------------------------ */
/* Sub-components                                                       */
/* ------------------------------------------------------------------ */

function LandingNav() {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-brand">
          <Wordmark />
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login" className="button button-quiet" style={{ textDecoration: 'none' }}>
            Log in
          </Link>
          <Link to="/register" className="button" style={{ textDecoration: 'none' }}>
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function FeatureCard({ label, body }) {
  return (
    <div className="lp-feature-card">
      <p className="eyebrow">{label}</p>
      <p className="lp-feature-body">{body}</p>
    </div>
  )
}

function StepRow({ number, heading, body }) {
  return (
    <div className="lp-step">
      <span className="lp-step-num" aria-hidden="true">{number}</span>
      <div>
        <h3 className="lp-step-heading">{heading}</h3>
        <p className="lp-step-body">{body}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Landing page                                                         */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <>
      <LandingNav />

      {/* ---- Hero ---- */}
      <section className="lp-hero">
        <div className="lp-container">
          <p className="eyebrow" style={{ marginBottom: '1rem' }}>Blood glucose tracker</p>
          <h1 className="lp-hero-heading">
            A quiet logbook for<br />every reading.
          </h1>
          <p className="lp-hero-sub">
            Record up to four readings a day — fasting, after each meal — and get
            instant daily and monthly summaries you can share with your doctor.
          </p>
          <div className="lp-hero-cta">
            <Link to="/register" className="button lp-cta-primary" style={{ textDecoration: 'none' }}>
              Create a free account
            </Link>
            <Link to="/login" className="button button-quiet" style={{ textDecoration: 'none' }}>
              Log in
            </Link>
          </div>

          {/* Demo callout */}
          <div className="lp-demo-note">
            <p>
              Want to explore first?{' '}
              <Link to="/login">Log in with the demo account</Link>
              {' '}— email{' '}
              <code>demo@sweety.app</code>, password <code>Demo1234!</code>
            </p>
          </div>
        </div>

        {/* Decorative ruled lines */}
        <div className="lp-ruled" aria-hidden="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="lp-rule-line" />
          ))}
        </div>
      </section>

      {/* ---- Divider ---- */}
      <div className="lp-divider" />

      {/* ---- Features ---- */}
      <section className="lp-section lp-container" aria-labelledby="features-heading">
        <h2 id="features-heading" className="lp-section-heading">What it tracks</h2>
        <div className="lp-feature-grid">
          <FeatureCard
            label="Four daily slots"
            body="Morning (fasting), After breakfast, After lunch, After dinner — the four readings your care team actually wants to see."
          />
          <FeatureCard
            label="Strict validation"
            body="Only whole numbers from 40 to 600 mg/dl. One reading per slot per day. Future dates are blocked. The logbook stays clean."
          />
          <FeatureCard
            label="Daily report"
            body="See every reading for a chosen day alongside its high, low, and average at a glance."
          />
          <FeatureCard
            label="Month-to-date"
            body="From the 1st of the month through any anchor date — useful mid-month check-ins."
          />
          <FeatureCard
            label="Monthly summary"
            body="The full previous calendar month: high, low, average, and reading count."
          />
          <FeatureCard
            label="Trend chart"
            body="A line chart of your readings over the month with ADA target-zone bands drawn in."
          />
        </div>
      </section>

      <div className="lp-divider" />

      {/* ---- How it works ---- */}
      <section className="lp-section lp-container" aria-labelledby="how-heading">
        <h2 id="how-heading" className="lp-section-heading">How it works</h2>
        <div className="lp-steps">
          <StepRow
            number="01"
            heading="Create your account"
            body="Register with your name, email and a password. Your data is private — you only ever see your own readings."
          />
          <StepRow
            number="02"
            heading="Log each reading"
            body="Pick the date and slot, type the value. Sweety validates it immediately and stores it against your account."
          />
          <StepRow
            number="03"
            heading="Review your reports"
            body="Open the Reports page and select a date. Your daily, month-to-date and monthly summaries update instantly."
          />
        </div>
      </section>

      <div className="lp-divider" />

      {/* ---- CTA footer ---- */}
      <section className="lp-cta-section lp-container" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="lp-cta-heading">Start logging today.</h2>
        <p className="lp-cta-sub">
          No subscription, no app to install. Open in any browser, on any device.
        </p>
        <div className="lp-hero-cta">
          <Link to="/register" className="button lp-cta-primary" style={{ textDecoration: 'none' }}>
            Get started
          </Link>
          <Link to="/login" className="button button-quiet" style={{ textDecoration: 'none' }}>
            Log in
          </Link>
        </div>
      </section>

      {/* ---- Page footer ---- */}
      <footer className="footer lp-container" style={{ maxWidth: 'var(--page-width)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span>
            <Wordmark /> &mdash; blood glucose logbook
          </span>
          <span>
            Target bands are general adult guidance (fasting 70–130, after meals under 180 mg/dl).
            Sweety is a logbook, not medical advice.
          </span>
        </div>
      </footer>
    </>
  )
}
