import { Link } from 'react-router-dom'
import { Wordmark } from '../components/Layout'

function LandingNav() {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <Link to="/" className="topbar-brand" aria-label="Sweety home">
          <Wordmark />
        </Link>
        <div className="lp-nav-cta">
          <Link to="/login" className="button button-quiet">
            Log in
          </Link>
          <Link to="/register" className="button">
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}

function FeatureCard({ icon, label, title, body }) {
  return (
    <div className="lp-feature-card">
      <div className="lp-feature-icon">{icon}</div>
      <p className="eyebrow">{label}</p>
      <h3 className="lp-feature-title">{title}</h3>
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

export default function Landing() {
  return (
    <>
      <LandingNav />

      {/* ---- Hero Section ---- */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              <span>Smart Clinical Glucose Tracking</span>
            </div>

            <h1 className="lp-hero-heading">
              A quiet, reliable companion for <mark>diabetes care</mark>.
            </h1>

            <p className="lp-hero-sub">
              Log up to four structured daily blood glucose readings. Gain clear clinical insights,
              review month-to-date trends, and share verified reports directly with your healthcare provider.
            </p>

            <div className="lp-hero-cta">
              <Link to="/register" className="button lp-btn-primary">
                Create Free Account
              </Link>
              <Link to="/login" className="button button-quiet lp-btn-secondary">
                Log In
              </Link>
            </div>

            <div className="lp-stats-ribbon">
              <div className="lp-stat-item">
                <span className="lp-stat-num">4</span>
                <span className="lp-stat-label">Metabolic Slots / Day</span>
              </div>
              <div className="lp-stat-item">
                <span className="lp-stat-num">40–600</span>
                <span className="lp-stat-label">Target mg/dl Range</span>
              </div>
              <div className="lp-stat-item">
                <span className="lp-stat-num">100%</span>
                <span className="lp-stat-label">Isolated Patient Data</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Features Grid ---- */}
      <section className="lp-section lp-container" aria-labelledby="features-heading">
        <p className="lp-section-eyebrow">Comprehensive Features</p>
        <h2 id="features-heading" className="lp-section-heading">Designed for precision and clarity</h2>
        <p className="lp-section-sub">
          Every screen in Sweety is built to minimise cognitive load while giving you and your physician
          actionable glycemic insights.
        </p>

        <div className="lp-feature-grid">
          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            }
            label="Protocol"
            title="Four Daily Reading Slots"
            body="Morning fasting, after breakfast, after lunch, and after dinner — perfectly mapped to clinical diabetes monitoring routines."
          />

          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
            label="Integrity"
            title="Strict Data Validation"
            body="Immediate enforcement prevents duplicates per slot, restricts values to 40–600 mg/dl, and eliminates accidental future entries."
          />

          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
            label="Reporting"
            title="Comprehensive Daily Summary"
            body="View individual slot readings alongside highest, lowest, and average glucose levels for any chosen day."
          />

          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
            label="Analytics"
            title="Month-to-Date & Monthly"
            body="Monitor rolling monthly progression up to any anchor date, or evaluate full prior calendar month reports with one click."
          />

          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            }
            label="Visualisation"
            title="ADA Target-Zone Charts"
            body="Interactive Recharts trajectory displays day-to-day fluctuations with clearly shaded American Diabetes Association healthy thresholds."
          />

          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
            label="Security"
            title="Privacy First by Design"
            body="Bcrypt password hashing and JWT authentication ensure complete tenant isolation. You and only you see your data."
          />
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="lp-alt-section" aria-labelledby="how-heading">
        <div className="lp-container">
          <p className="lp-section-eyebrow">Seamless Flow</p>
          <h2 id="how-heading" className="lp-section-heading">How Sweety works in your daily life</h2>
          <p className="lp-section-sub">
            Built to be used in seconds so managing diabetes fits naturally into your routine.
          </p>

          <div className="lp-steps">
            <StepRow
              number="01"
              heading="Sign Up in Seconds"
              body="Create your account with just your name, email, and password. No credit card, no complex onboarding."
            />
            <StepRow
              number="02"
              heading="Log Fasting & Meals"
              body="Input your readings across the 4 standard slots. Instant feedback lets you know if a value is within target."
            />
            <StepRow
              number="03"
              heading="Review & Share Reports"
              body="Inspect your daily and monthly analytics anytime to discuss informed changes with your physician."
            />
          </div>
        </div>
      </section>

      {/* ---- CTA Footer ---- */}
      <section className="lp-cta-section lp-container" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="lp-cta-heading">Take control of your glucose logbook today.</h2>
        <p className="lp-cta-sub">
          Clean, distraction-free logging accessible from your phone, tablet, or desktop.
        </p>
        <div className="lp-cta-buttons">
          <Link to="/register" className="button lp-btn-primary">
            Get Started Now
          </Link>
          <Link to="/login" className="button button-quiet lp-btn-secondary">
            Sign In
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span>
            <Wordmark /> &mdash; Blood Glucose Tracker
          </span>
          <span>
            Target bands reflect general adult guidelines (fasting 70–130, post-meal &lt; 180 mg/dl).
            Sweety is a personal tracker, not medical diagnosis.
          </span>
        </div>
      </footer>
    </>
  )
}
