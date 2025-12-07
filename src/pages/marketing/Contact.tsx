// agrotrust-az/src/pages/marketing/Contact.tsx

import { useState } from "react";
import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * Contact (Marketing)
 *
 * Hackathon-friendly contact page.
 * This does not send real emails yet.
 * It provides a clean UI and a realistic B2B enquiry form.
 *
 * Later upgrade options:
 * - Netlify Forms
 * - A Netlify Function (contact-submit.ts)
 * - A real CRM integration
 */
export function Contact() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [audience, setAudience] = useState<"coop" | "buyer" | "other">("coop");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 10;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!canSubmit) {
      setStatus("error");
      return;
    }

    // MVP behaviour: simulate a successful submission locally.
    // This keeps the demo clean without requiring an email backend.
    try {
      // eslint-disable-next-line no-console
      console.log("AgroTrust contact payload", {
        name,
        company,
        email,
        audience,
        message
      });

      setStatus("success");

      // Optional: clear fields for a polished demo feel
      setName("");
      setCompany("");
      setEmail("");
      setAudience("coop");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="container">
      <header className="marketing-page-head">
        <p className="marketing-kicker">Get in touch</p>
        <h1 className="marketing-title">Contact {BRAND.productName}</h1>
        <p className="marketing-subtitle muted">
          Whether you represent a cooperative preparing for export or a buyer
          seeking verified suppliers, we would like to hear your requirements.
          This is a hackathon MVP contact flow with realistic B2B framing.
        </p>
      </header>

      <section className="contact-grid">
        <div className="card">
          <h3>Send an enquiry</h3>
          <p className="muted">
            Share your expectations for traceability, quality evidence, volume,
            and target markets. The more specific you are, the stronger the
            matching logic we can build next.
          </p>

          <form onSubmit={handleSubmit} className="contact-form">
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
                value={audience}
                onChange={(e) =>
                  setAudience(e.target.value as "coop" | "buyer" | "other")
                }
              >
                <option value="coop">Farmer / Cooperative</option>
                <option value="buyer">Buyer / Importer</option>
                <option value="other">Other stakeholder</option>
              </select>
            </label>

            <label className="contact-label">
              Message
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us your needs: products, volumes, certifications, markets..."
              />
            </label>

            {status === "success" && (
              <div className="contact-alert contact-alert--success">
                Your message is captured for the demo. In a real release, this
                will be routed to the team.
              </div>
            )}

            {status === "error" && (
              <div className="contact-alert contact-alert--error">
                Please fill in your name, email, and a slightly longer message.
              </div>
            )}

            <div className="contact-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit}
              >
                Submit enquiry
              </button>

              <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
                Review the flow
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
              This contact form is part of the hackathon demo. It is designed to
              show stakeholder intent and product maturity. You can later enable:
            </p>
            <ul className="contact-list">
              <li>Netlify Forms for zero-backend submissions</li>
              <li>A dedicated Netlify Function endpoint</li>
              <li>CRM integration for export pipelines</li>
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

          .contact-label:nth-child(5){
            grid-column: 1 / -1;
          }

          .contact-label textarea{
            grid-column: 1 / -1;
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