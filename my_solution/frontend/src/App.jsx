import { useState } from 'react';
import { diagnoseAlert } from './api.js';

const placeholder = `Paste a ticket (email/SMS/call). Example:\n\nRE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received\n\nHi team,...`;

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  const [alertText, setAlertText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!alertText.trim()) {
      setError('Please paste an alert before running diagnostics.');
      return;
    }

    setLoading(true);
    setError('');
    setDiagnosis(null);
    try {
      const result = await diagnoseAlert(alertText.trim());
      if (result.error) {
        throw new Error(result.error);
      }
      setDiagnosis(result);
    } catch (err) {
      setError(err.message || 'Diagnostics failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>PSA L2 Diagnostic Assistant</h1>
        <p>Paste an alert and generate a GPT-backed resolution plan.</p>
      </header>

      <main>
        <form onSubmit={handleSubmit} className="card">
          <label htmlFor="alert-text">Alert text</label>
          <textarea
            id="alert-text"
            value={alertText}
            placeholder={placeholder}
            onChange={(event) => setAlertText(event.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Running diagnostics…' : 'Run diagnostics'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>

        {diagnosis && (
          <>
            <Section title="Ticket details">
              <div className="grid">
                <div>
                  <strong>Ticket ID:</strong> {diagnosis.parsed.ticket_id || '—'}
                </div>
                <div>
                  <strong>Channel:</strong> {diagnosis.parsed.channel || '—'}
                </div>
                <div>
                  <strong>Module:</strong> {diagnosis.parsed.module || '—'}
                </div>
                <div>
                  <strong>Priority:</strong> {diagnosis.parsed.priority || '—'}
                </div>
              </div>
            </Section>

            <Section title="Root cause">
              <p>{diagnosis.rootCause.root_cause}</p>
              <p className="muted">{diagnosis.rootCause.technical_details}</p>
              <p>
                <strong>Confidence:</strong> {diagnosis.rootCause.confidence}%
              </p>
              {diagnosis.rootCause.evidence_summary?.length ? (
                <ul>
                  {diagnosis.rootCause.evidence_summary.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </Section>

            <Section title="Resolution plan">
              <p>
                <strong>Estimated time:</strong> {diagnosis.resolution.estimated_time || '—'}
              </p>
              <p>
                <strong>Escalate:</strong>{' '}
                {diagnosis.resolution.escalate
                  ? `Yes → ${diagnosis.resolution.escalate_to || 'L3 team'}`
                  : 'No'}
              </p>
              {diagnosis.resolution.resolution_steps?.length ? (
                <ol>
                  {diagnosis.resolution.resolution_steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              ) : null}
              {diagnosis.resolution.verification_steps?.length ? (
                <>
                  <h3>Verification</h3>
                  <ul>
                    {diagnosis.resolution.verification_steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {diagnosis.resolution.sql_queries?.length ? (
                <>
                  <h3>SQL / Commands</h3>
                  <pre>{diagnosis.resolution.sql_queries.join('\n\n')}</pre>
                </>
              ) : null}
            </Section>

            <Section title="Full report">
              <pre>{diagnosis.report}</pre>
            </Section>
          </>
        )}
      </main>

      <footer>
        <span>PSA Code Sprint 2025 — L2 Diagnostic Assistant</span>
        <span className="muted">Front-end version {__APP_VERSION__}</span>
      </footer>
    </div>
  );
}
