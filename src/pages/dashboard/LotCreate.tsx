import { FormEvent, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { ROUTES } from "@/app/config/routes";
import { supabase } from "@/lib/supabaseClient";

type CreateLotResponse = {
  lot: {
    id: string;
  };
};

type CreateLotPayload = {
  productName: string;
  variety?: string;
  quantityKg: number;
  region: string;
  harvestDate: string;
  certifications: string[];
};

async function createLot(payload: CreateLotPayload): Promise<CreateLotResponse> {
  const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
  if (sessErr) throw new Error(sessErr.message);

  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be signed in.");

  const res = await fetch("/.netlify/functions/lots-create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // your function returns { error: "..." }
    throw new Error((json as any)?.error || "Failed to create lot.");
  }

  return json as CreateLotResponse;
}

export function LotCreate() {
  const navigate = useNavigate();

  const [productName, setProductName] = useState("");
  const [variety, setVariety] = useState("");
  const [region, setRegion] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [quantityKg, setQuantityKg] = useState("0");
  const [certifications, setCertifications] = useState("");

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createLot({
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
      navigate(`/dashboard/lots/${data.lot.id}`, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Create lot failed.");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productName.trim()) return setError("Product name is required.");

    const q = Number(quantityKg);
    if (!Number.isFinite(q) || q <= 0) {
      return setError("Quantity must be a positive number.");
    }

    if (!region.trim()) return setError("Region is required.");
    if (!harvestDate.trim()) return setError("Harvest date is required.");

    mutation.mutate();
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="dash-title">Create lot</h1>
          <p className="muted">
            Creates a real lot in the database. Cooperative ID is taken from your logged-in profile.
          </p>
        </div>

        <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--ghost">
          Back
        </NavLink>
      </div>

      <form onSubmit={onSubmit} className="stack stack--md" style={{ marginTop: 16 }}>
        <label className="form-label">
          Product name
          <input
            className="input"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Hazelnuts"
          />
        </label>

        <label className="form-label">
          Variety (optional)
          <input
            className="input"
            value={variety}
            onChange={(e) => setVariety(e.target.value)}
            placeholder="e.g. Ata Baba"
          />
        </label>

        <label className="form-label">
          Region
          <input
            className="input"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. Quba"
          />
        </label>

        <label className="form-label">
          Harvest date
          <input
            className="input"
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
          />
        </label>

        <label className="form-label">
          Quantity (kg)
          <input
            className="input"
            inputMode="numeric"
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
            placeholder="e.g. 1200"
          />
        </label>

        <label className="form-label">
          Certifications (comma-separated)
          <input
            className="input"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="GlobalG.A.P, Organic, HACCP"
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