import { useState } from "react";
import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

type Audience = "coop" | "buyer" | "other";


export function Contact() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState<Audience>("coop");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 10;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      setStatus("error");
      setError("Please fill in your name, email, and a slightly longer message.");
      return;
    }

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/.netlify/functions/contact-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          company,
          email,
          audience,
          message,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Contact submit failed:", res.status, text);
        throw new Error(text || "Failed to submit contact form");
      }

      setStatus("success");
      setError(null);

      setName("");
      setCompany("");
      setEmail("");
      setAudience("coop");
      setMessage("");
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus("error");
      setError("Something went wrong while sending your message. Please try again.");
    }
  }

  return (
    <div className="container">
      <header className="marketing-page-head">
        <p className="marketing-kicker">Get in touch</p>
        <h1 className="marketing-title">Contact {BRAND.productName}</h1>
        <p className="marketing-subtitle">
          Whether you represent a cooperative preparing for export or a buyer
          seeking verified suppliers, we would like to hear your requirements.
          This is now a real enquiry channel, not just a demo.
        </p>
      </header>

      <section className="contact-grid">
        <div className="card">
          <h2>Send an enquiry</h2>
          <p className="muted">
            Share your expectations for traceability, quality evidence, volume,
            and target markets. The more specific you are, the stronger the
            matching logic we can build next.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>
            <label className="contact-label">
              Your name
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name and surname"
                autoComplete="name"
              />
            </label>

            <label className="contact-label">
              Company / Cooperative
              <input
                className="input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Organisation name"
                autoComplete="organization"
              />
            </label>

            <label className="contact-label">
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </label>

            <label className="contact-label">
              I am a
              <select
                className="input"
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as Audience)
                }
              >
                <option value="coop">Farmer / Cooperative</option>
                <option value="buyer">Buyer / Importer</option>
                <option value="other">Other stakeholder</option>
              </select>
            </label>

            <label className="contact-label" style={{ gridColumn: "1 / -1" }}>
              Message
              <textarea
                className="input"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us your needs: products, volumes, certifications, markets..."
              />
            </label>

            {status === "success" && (
              <div className="contact-alert contact-alert--success">
                Your message has been sent. We&apos;ll follow up from
                agrotrust.az@gmail.com.
              </div>
            )}

            {status === "error" && (
              <div className="contact-alert contact-alert--error">
                {error ??
                  "Please check your details and try again."}
              </div>
            )}

            <div className="contact-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit || status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Submit enquiry"}
              </button>

              <NavLink to={ROUTES.FOR_FARMERS} className="btn btn--ghost">
                Farmer pathway
              </NavLink>
            </div>
          </form>
        </div>

        <div className="contact-aside">
          <div className="card card--soft">
            <div className="aside-label">Quick links</div>
            <div className="contact-links">
              <NavLink to={ROUTES.FOR_FARMERS} className="contact-link">
                Farmer pathway
              </NavLink>
              <NavLink to={ROUTES.FOR_BUYERS} className="contact-link">
                Buyer pathway
              </NavLink>
              <NavLink to={ROUTES.STANDARDS} className="contact-link">
                Standards model
              </NavLink>
            </div>
          </div>

          <div className="card card--soft">
            <div className="aside-label">MVP note</div>
            <p className="muted">
              This contact form was originally a mock. It now routes to the
              AgroTrust team inbox while keeping the MVP architecture.
            </p>
            <ul className="contact-list">
              <li>SMTP-based email via Netlify Functions</li>
              <li>Reuses the same mailer as OTP verification</li>
              <li>Ready for future CRM integration</li>
            </ul>
          </div>

          <div className="card">
            <div className="aside-label">Core promise</div>
            <div className="contact-promise">
              Traceability that respects traditional farming realities, paired
              with modern buyer expectations.
            </div>
          </div>
        </div>
      </section>

      <style>
        {`
          .marketing-page-head{
            max-width: 860px;
            margin-bottom: var(--space-6);
          }

          .marketing-kicker{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-1);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .marketing-title{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-7);
            line-height: var(--lh-tight);
          }

          .marketing-subtitle{
            margin: 0;
            font-size: var(--fs-4);
          }

          .contact-grid{
            display:grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: var(--space-5);
            align-items: start;
          }

          .contact-form{
            margin-top: var(--space-4);
            display:grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-3);
          }

          .contact-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text);
          }

          .contact-alert{
            grid-column: 1 / -1;
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            font-size: var(--fs-2);
          }

          .contact-alert--success{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
          }

          .contact-alert--error{
            background: color-mix(in oklab, var(--color-danger) 10%, transparent);
          }

          .contact-actions{
            grid-column: 1 / -1;
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-2);
          }

          .contact-aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .aside-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: var(--space-2);
          }

          .contact-links{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .contact-link{
            padding: 8px 10px;
            border-radius: var(--radius-1);
            background: var(--color-elevated);
            border: var(--border-1);
            font-size: var(--fs-2);
            color: var(--color-text);
          }

          .contact-link:hover{
            text-decoration: none;
            border-color: var(--color-border-strong);
          }

          .contact-list{
            margin: 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .contact-promise{
            font-size: var(--fs-4);
            font-weight: var(--fw-medium);
          }

          @media (max-width: 980px){
            .contact-grid{
              grid-template-columns: 1fr;
            }

            .contact-form{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}
