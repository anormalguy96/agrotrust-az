import React from "react";
import {
  addAgrochemical,
  getPassportAgrochemicals,
  getPassportLabReports,
  type Agrochemical,
  type LabReport,
} from "./passportChemLabApi";

export function PassportChemLabSection({ passportId }: { passportId: string }) {
  const [agros, setAgros] = React.useState<Agrochemical[]>([]);
  const [reports, setReports] = React.useState<LabReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  // simple form state (you can replace with your existing form system)
  const [kind, setKind] = React.useState<"pesticide" | "fertilizer">("pesticide");
  const [productName, setProductName] = React.useState("");
  const [activeIngredient, setActiveIngredient] = React.useState("");
  const [dose, setDose] = React.useState("");
  const [doseUnit, setDoseUnit] = React.useState("");
  const [applicationDate, setApplicationDate] = React.useState("");
  const [phiDays, setPhiDays] = React.useState("");

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [a, r] = await Promise.all([
        getPassportAgrochemicals(passportId),
        getPassportLabReports(passportId),
      ]);
      setAgros(a);
      setReports(r);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load pesticide/fertilizer + lab data");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, [passportId]);

  async function onAdd() {
    setErr(null);
    try {
      if (!productName.trim()) throw new Error("Product name is required");

      await addAgrochemical({
        passport_id: passportId,
        kind,
        product_name: productName.trim(),
        active_ingredient: activeIngredient.trim() || null,
        dose: dose ? Number(dose) : null,
        dose_unit: doseUnit.trim() || null,
        application_date: applicationDate || null,
        phi_days: phiDays ? Number(phiDays) : null,
        method: null,
        concentration: null,
        notes: null,
      });

      setProductName("");
      setActiveIngredient("");
      setDose("");
      setDoseUnit("");
      setApplicationDate("");
      setPhiDays("");

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to add entry");
    }
  }

  if (loading) return <section><h3>Pesticides & Fertilizers</h3><p>Loading…</p></section>;

  return (
    <section style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16 }}>
      <h3 style={{ margin: "0 0 10px" }}>Pesticides & Fertilizers</h3>

      {err && (
        <div style={{ padding: 10, background: "rgba(255,0,0,0.06)", marginBottom: 12 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gap: 8, maxWidth: 680, marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label>
            Type&nbsp;
            <select value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="pesticide">Pesticide</option>
              <option value="fertilizer">Fertilizer</option>
            </select>
          </label>

          <label style={{ flex: 1, minWidth: 220 }}>
            Product name&nbsp;
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder='e.g. "Urea", "Ridomil Gold"'
              style={{ width: "100%" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label style={{ flex: 1, minWidth: 220 }}>
            Active ingredient (optional)&nbsp;
            <input
              value={activeIngredient}
              onChange={(e) => setActiveIngredient(e.target.value)}
              placeholder='e.g. "Mancozeb"'
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Dose&nbsp;
            <input value={dose} onChange={(e) => setDose(e.target.value)} style={{ width: 100 }} />
          </label>

          <label>
            Unit&nbsp;
            <input
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
              placeholder="kg/ha"
              style={{ width: 120 }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label>
            Application date&nbsp;
            <input
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
            />
          </label>

          <label>
            PHI days (pesticides)&nbsp;
            <input
              value={phiDays}
              onChange={(e) => setPhiDays(e.target.value)}
              style={{ width: 120 }}
            />
          </label>

          <button onClick={onAdd}>Add</button>
        </div>
      </div>

      <h4 style={{ margin: "12px 0 6px" }}>Declared applications</h4>
      {agros.length === 0 ? (
        <p>No pesticide/fertilizer records yet.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {agros.map((a) => (
            <li key={a.id}>
              <strong>{a.kind.toUpperCase()}</strong>: {a.product_name}
              {a.active_ingredient ? ` (${a.active_ingredient})` : ""}
              {a.dose != null ? ` — ${a.dose} ${a.dose_unit ?? ""}` : ""}
              {a.application_date ? ` — ${a.application_date}` : ""}
              {a.phi_days != null ? ` — PHI ${a.phi_days} days` : ""}
            </li>
          ))}
        </ul>
      )}

      <h4 style={{ margin: "14px 0 6px" }}>Lab evidence</h4>
      {reports.length === 0 ? (
        <p>No lab reports attached yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {reports.map((r) => (
            <article key={r.id} style={{ padding: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <strong>Sample:</strong> {r.sample_code}
                  {r.report_date ? ` • Report date: ${r.report_date}` : ""}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  {r.passed == null ? "Unknown" : r.passed ? "PASS" : "FAIL"}
                </div>
              </div>

              {r.passport_lab_results && r.passport_lab_results.length > 0 && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 18 }}>
                  {r.passport_lab_results.map((x) => (
                    <li key={x.id}>
                      {x.analyte}: {x.value ?? "—"} {x.unit ?? ""}
                      {x.limit_value != null ? ` (limit ${x.limit_value} ${x.limit_unit ?? ""})` : ""}
                      {" — "}
                      <strong>{x.status.toUpperCase()}</strong>
                    </li>
                  ))}
                </ul>
              )}

              {r.notes && <p style={{ marginTop: 8 }}>{r.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
