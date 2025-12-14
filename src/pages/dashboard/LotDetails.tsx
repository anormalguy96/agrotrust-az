import { useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { PassportQR } from "@/features/passport/components/PassportQR";
import { env } from "@/app/config/env";
import { ROUTES } from "@/app/config/routes";

type Lot = {
  id: string;
  product: string;
  variety?: string;
  coopId?: string;
  cooperativeId?: string;
  coopName?: string;
  region?: string;
  harvestDate?: string;
  quantityKg?: number;
  qualityGrade?: string;
  certifications?: string[];
  passportId?: string | null;
  status?: "draft" | "ready" | "exported";
  notes?: string;
  photos?: string[];
};

type PassportCreateResponse = {
  passportId: string;
  lotId: string;
  qrPayload?: string;
  createdAt?: string;
  status?: "created" | "linked";
};

type RawLot = {
  id: string;
  coopId?: string;
  product?: {
    name?: string;
    variety?: string;
    quantity?: number;
    unit?: string;
  };
  harvest?: {
    harvestDate?: string;
    region?: string;
    district?: string;
    farmName?: string;
  };
  certifications?: {
    claimed?: string[];
    verified?: string[];
  };
  exportReadiness?: {
    status?: string;
    targetMarkets?: string[];
  };
};

function mapRawLot(raw: RawLot): Lot {
  const productName = raw.product?.name?.trim() || "Unnamed product";
  const variety = raw.product?.variety?.trim() || undefined;
  const quantity =
    typeof raw.product?.quantity === "number" ? raw.product.quantity : undefined;
  const unit = raw.product?.unit;

  const certifications: string[] = [
    ...(raw.certifications?.claimed ?? []),
    ...(raw.certifications?.verified ?? [])
  ];

  let status: Lot["status"] = "draft";
  switch (raw.exportReadiness?.status) {
    case "READY_FOR_BUYER_REVIEW":
      status = "ready";
      break;
    case "CERT_EVIDENCE_PENDING":
      status = "draft";
      break;
    default:
      status = "draft";
  }

  return {
    id: raw.id,
    product: productName,
    variety,
    coopId: raw.coopId,
    cooperativeId: raw.coopId,
    coopName: raw.harvest?.farmName,
    region: raw.harvest?.region,
    harvestDate: raw.harvest?.harvestDate,
    quantityKg: unit === "kg" ? quantity : undefined,
    qualityGrade: undefined,
    certifications,
    passportId: null,
    status,
    notes: undefined,
    photos: []
  };
}

async function fetchLotById(lotId: string): Promise<Lot | null> {
  if (!lotId) return null;

  if (env.enableMocks) {
    const lots = await fetchSampleLots();
    return lots.find((l) => l.id === lotId) ?? null;
  }

  const res = await fetch(`/api/lots/${encodeURIComponent(lotId)}`);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text().catch(() => "");

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(text || `Failed to load lot (${res.status}).`);
  }

  if (!ct.includes("application/json")) {
    throw new Error(`Expected JSON, got ${ct}: ${text.slice(0, 120)}`);
  }

  return JSON.parse(text) as Lot;
}


async function fetchLotById(lotId: string): Promise<Lot | null> {
  if (!lotId) return null;

  if (env.enableMocks) {
    const lots = await fetchSampleLots();
    return lots.find((l) => l.id === lotId) ?? null;
  }

  const res = await fetch(`/api/lots/${encodeURIComponent(lotId)}`);
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error("Failed to load lot.");
  if (!ct.includes("application/json")) throw new Error(`Expected JSON, got ${ct}: ${text.slice(0, 60)}`);

  return JSON.parse(text) as Lot;

}

async function createPassportForLot(lot: Lot): Promise<PassportCreateResponse> {
  const res = await fetch("/.netlify/functions/passport-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lotId: lot.id,
      cooperativeId: lot.cooperativeId ?? lot.coopId ?? "demo-coop-001",
      product: {
        name: lot.product,
        variety: lot.variety,
        quantity: lot.quantityKg,
        unit: "kg"
      },
      harvest: {
        region: lot.region,
        harvestDate: lot.harvestDate
      },
      certifications: lot.certifications ?? []
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to create passport.");
  }

  return (await res.json()) as PassportCreateResponse;
}

export function LotDetails() {
  const params = useParams();
  const lotId = params.lotId ?? "";

  const [localPassport, setLocalPassport] = useState<PassportCreateResponse | null>(
    null
  );
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const lotQuery = useQuery({
    queryKey: ["lot", lotId, env.enableMocks ? "mock" : "api"],
    queryFn: () => fetchLotById(lotId),
    enabled: Boolean(lotId)
  });

  const lot = lotQuery.data ?? null;

  const createPassportMutation = useMutation<
    PassportCreateResponse,
    Error,
    Lot
  >({
    mutationFn: (currentLot) => createPassportForLot(currentLot),
    onSuccess: (data) => {
      setLocalPassport(data);
      setActionMsg("Passport created successfully and saved to the database.");
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Passport creation failed.";
      setActionMsg(msg);
    }
  });

  const effectivePassportId = useMemo(() => {
    return localPassport?.passportId || lot?.passportId || null;
  }, [localPassport?.passportId, lot?.passportId]);

  const certifications = lot?.certifications ?? [];

  return (
    <div className="lot-details-page">
      <header className="lot-details-head">
        <div>
          <p className="dash-kicker">Product lots</p>
          <h1 className="dash-title">Lot details</h1>
          <p className="muted lot-details-subtitle">
            Review traceability fields and generate a Digital Product Passport
            for buyer verification.
          </p>
        </div>

        <div className="lot-details-head__actions">
          <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--ghost">
            Back to lots
          </NavLink>

          <button
            type="button"
            className="btn btn--primary"
            disabled={!lot || createPassportMutation.isPending}
            onClick={() => {
              if (!lot) return;
              setActionMsg(null);
              createPassportMutation.mutate(lot);
            }}
            title="Creates a passport using the Netlify Function."
          >
            {createPassportMutation.isPending ? "Generating…" : "Generate passport"}
          </button>
        </div>
      </header>

      <section className="lot-details-body">
        <div className="lot-left">
          <div className="card">
            {lotQuery.isLoading && (
              <div className="lot-state">
                <p>Loading lot…</p>
              </div>
            )}

            {lotQuery.isError && (
              <div className="lot-state">
                <p className="muted">
                  {(lotQuery.error as Error)?.message ?? "Something went wrong."}
                </p>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => lotQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            )}

            {!lotQuery.isLoading && !lotQuery.isError && !lot && (
              <div className="lot-state">
                <p className="muted">This lot could not be found.</p>
                <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--ghost">
                  Return to lots
                </NavLink>
              </div>
            )}

            {!lotQuery.isLoading && !lotQuery.isError && lot && (
              <>
                <div className="lot-header-row">
                  <div>
                    <div className="lot-id">
                      <span className="lot-id__label">Lot ID</span>
                      <code className="lot-id__value">{lot.id}</code>
                    </div>
                    <div className="lot-product">
                      <span className="lot-product__name">{lot.product}</span>
                      {lot.variety && (
                        <span className="muted lot-product__variety">
                          {lot.variety}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="lot-status">
                    <span className="lot-chip">
                      {lot.status ?? "ready"}
                    </span>
                  </div>
                </div>

                <div className="lot-grid">
                  <InfoItem label="Cooperative" value={lot.coopName ?? "—"} />
                  <InfoItem label="Region" value={lot.region ?? "—"} />
                  <InfoItem label="Harvest date" value={lot.harvestDate ?? "—"} />
                  <InfoItem
                    label="Quantity"
                    value={
                      typeof lot.quantityKg === "number"
                        ? `${lot.quantityKg} kg`
                        : "—"
                    }
                  />
                  <InfoItem label="Quality grade" value={lot.qualityGrade ?? "—"} />
                </div>

                <div className="lot-section">
                  <div className="lot-section__title">Certification claims</div>
                  {certifications.length === 0 ? (
                    <div className="muted">No claims listed in this sample lot.</div>
                  ) : (
                    <div className="lot-chips">
                      {certifications.map((c) => (
                        <span key={c} className="lot-claim-chip">{c}</span>
                      ))}
                    </div>
                  )}
                  <div className="muted lot-section__note">
                    Claims are shown for the MVP. Verified status can be added
                    with accredited partners in later iterations.
                  </div>
                </div>

                <div className="lot-section">
                  <div className="lot-section__title">Notes</div>
                  <div className="muted">
                    {lot.notes ??
                      "This sample lot demonstrates a clean, export-oriented traceability record for hackathon judging."}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lot-right">
          <div className="card card--soft">
            <div className="aside-label">Passport status</div>

            {!effectivePassportId && (
              <>
                <div className="passport-state">
                  <div className="passport-state__title">Not created yet</div>
                  <div className="muted">
                    Generate a Digital Product Passport to produce a buyer-friendly
                    traceability summary with a QR payload.
                  </div>
                </div>
              </>
            )}

            {effectivePassportId && (
              <>
                <div className="passport-state">
                  <div className="passport-state__title">Passport linked</div>
                  <div className="muted">
                    This lot now has a Digital Product Passport connected.
                  </div>
                </div>

                <div className="passport-box">
                  <div className="passport-box__label">Passport ID</div>
                  <code className="passport-box__id">{effectivePassportId}</code>

                  {localPassport?.qrPayload && (
                    <div className="passport-qr">
                      <div className="passport-box__label">Passport QR</div>
                      <PassportQR
                        data={localPassport.qrPayload}
                        title="Digital Product Passport"
                        subtitle="Scan to view this lot’s passport payload"
                        size="md"
                        showDataText={false}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            {actionMsg && (
              <div className="passport-alert">
                {actionMsg}
              </div>
            )}

            <div className="passport-actions">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!lot || createPassportMutation.isPending}
                onClick={() => {
                  if (!lot) return;
                  setActionMsg(null);
                  createPassportMutation.mutate(lot);
                }}
              >
                {effectivePassportId ? "Regenerate (MVP)" : "Generate passport"}
              </button>

              <NavLink to={ROUTES.DASHBOARD.BUYERS} className="btn btn--ghost">
                Buyer perspective
              </NavLink>
            </div>
          </div>

          <div className="card">
            <div className="aside-label">Escrow narrative</div>
            <p className="muted">
              After a Passport is available, the buyer can place funds into escrow.
              In the hackathon build, release is simulated based on inspection outcome.
              This provides a clean, judge-friendly trust storyline.
            </p>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Open contracts
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .lot-details-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .lot-details-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .lot-details-subtitle{
            margin: 0;
          }

          .lot-details-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lot-details-body{
            display:grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: var(--space-4);
            align-items: start;
          }

          .lot-state{
            padding: var(--space-5);
            display:flex;
            align-items:center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .lot-header-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-4);
            align-items: start;
            padding-bottom: var(--space-4);
            border-bottom: 1px solid var(--color-border);
          }

          .lot-id{
            display:flex;
            align-items:center;
            gap: var(--space-2);
            margin-bottom: var(--space-2);
          }

          .lot-id__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .lot-id__value{
            font-family: var(--font-mono);
            font-size: var(--fs-2);
          }

          .lot-product{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .lot-product__name{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .lot-product__variety{
            font-size: var(--fs-1);
          }

          .lot-chip{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
            white-space: nowrap;
          }

          .lot-grid{
            margin-top: var(--space-4);
            display:grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: var(--space-3);
          }

          .info-item{
            background: var(--color-surface);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .info-item__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .info-item__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .lot-section{
            margin-top: var(--space-5);
          }

          .lot-section__title{
            font-size: var(--fs-2);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-2);
          }

          .lot-section__note{
            margin-top: var(--space-2);
            font-size: var(--fs-1);
          }

          .lot-chips{
            display:flex;
            flex-wrap: wrap;
            gap: var(--space-2);
          }

          .lot-claim-chip{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            background: var(--color-elevated);
            border: var(--border-1);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .lot-right{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .passport-state{
            margin-bottom: var(--space-3);
          }

          .passport-state__title{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .passport-box{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-2);
            padding: var(--space-4);
            margin-bottom: var(--space-3);
          }

          .passport-box__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: var(--space-1);
          }

          .passport-box__id{
            display:block;
            font-family: var(--font-mono);
            font-size: var(--fs-2);
            margin-bottom: var(--space-3);
          }

          .passport-box__payload{
            display:block;
            font-family: var(--font-mono);
            font-size: var(--fs-1);
            white-space: pre-wrap;
            word-break: break-word;
          }

          .passport-qr{
            margin-top: var(--space-3);
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            align-items: flex-start;
          }

          .passport-alert{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-2);
            margin-bottom: var(--space-3);
          }

          .passport-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1100px){
            .lot-details-body{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .lot-grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="info-item">
      <div className="info-item__label">{label}</div>
      <div className="info-item__value">{value}</div>
    </div>
  );
}
