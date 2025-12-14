import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type CreateLotResponse = {
  lotId: string;
};

async function createLot(payload: any): Promise<CreateLotResponse> {
  const res = await fetch("/.netlify/functions/lots-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(text || "Failed to create lot.");

  // if function returns JSON
  return JSON.parse(text) as CreateLotResponse;
}

export function LotCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [productName, setProductName] = useState("");
  const [cooperativeId, setCooperativeId] = useState(user?.cooperativeId || "");
  const [variety, setVariety] = useState("");
  const [region, setRegion] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantityKg, setQuantityKg] = useState("0");
  const [certifications, setCertifications] = useState("");

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createLot({
        cooperativeId: cooperativeId.trim(),
        productName: productName.trim(),
        variety: variety.trim() || undefined,
        quantityKg: Number(quantityKg),
        region: region.trim(),
        harvestDate: harvestDate,
        certifications: certifications
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    onSuccess: (data) => {
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Create lot failed.");
    }
  });


  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) return setError("Product name is required.");
    if (!Number.isFinite(Number(quantityKg)) || Number(quantityKg) <= 0) {
      return setError("Quantity must be a positive number.");
    }

    mutation.mutate();
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="dash-title">Create lot</h1>
          <p className="muted">Creates a real lot in the database.</p>
        </div>

        <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--ghost">
          Back
        </NavLink>
      </div>

      <form onSubmit={onSubmit} className="stack stack--md" style={{ marginTop: 16 }}>
        <label className="form-label">
          Cooperative ID
          <input className="input" value={cooperativeId} onChange={(e) => setCooperativeId(e.target.value)} />
        </label>

        <label className="form-label">
          Product name
          <input className="input" value={productName} onChange={(e) => setProductName(e.target.value)} />
        </label>

        <label className="form-label">
          Variety (optional)
          <input className="input" value={variety} onChange={(e) => setVariety(e.target.value)} />
        </label>

        <label className="form-label">
          Region (optional)
          <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} />
        </label>

        <label className="form-label">
          Harvest date (optional)
          <input className="input" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
        </label>

        <label className="form-label">
          Quantity (kg)
          <input className="input" inputMode="numeric" value={quantityKg} onChange={(e) => setQuantityKg(e.target.value)} />
        </label>

        <label className="form-label">
          Certifications (comma-separated)
          <input
            className="input"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="GlobalG.A.P, Organic, ..."
          />
        </label>

        {error && <div className="rfq-alert rfq-alert--error">{error}</div>}

        <button className="btn btn--primary" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating…" : "Create lot"}
        </button>
      </form>
    </div>
  );
}
