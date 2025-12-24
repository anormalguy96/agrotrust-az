// src/pages/buyers/BuyerMarket.tsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/config/routes";

type Lot = {
  id: string;
  title?: string | null;
  product_name?: string | null;
  category?: string | null;
  region?: string | null;
  quantity?: number | null;
  unit?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  status?: string | null; // expected: "published"
  passport_id?: string | null;
  created_at?: string | null;
};

function BuyerMarket() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lots;

    return lots.filter((l) => {
      const hay = [l.title, l.product_name, l.category, l.region, l.unit, l.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [lots, query]);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("lots")
        .select(
          "id,title,product_name,category,region,quantity,unit,price_min,price_max,status,passport_id,created_at"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setLots([]);
      } else {
        setLots((data ?? []) as Lot[]);
      }

      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Marketplace</h1>
        <div style={{ flex: 1 }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lots..."
          style={{
            width: 320,
            maxWidth: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
          }}
        />
      </div>

      <p style={{ opacity: 0.7, marginTop: 8 }}>
        Published lots only. Click a lot to view details.
      </p>

      {isLoading && <div>Loading...</div>}

      {!isLoading && error && (
        <div
          style={{
            padding: 12,
            border: "1px solid rgba(255,0,0,0.25)",
            borderRadius: 12,
          }}
        >
          <b>Error:</b> {error}
          <div style={{ marginTop: 8, opacity: 0.75 }}>
            This is usually caused by missing RLS SELECT policies for buyers.
          </div>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div
          style={{
            padding: 12,
            border: "1px solid rgba(0,0,0,0.12)",
            borderRadius: 12,
          }}
        >
          No published lots found.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        {filtered.map((lot) => {
          const name = lot.title ?? lot.product_name ?? "Untitled lot";
          const price =
            lot.price_min != null || lot.price_max != null
              ? `${lot.price_min ?? "?"} - ${lot.price_max ?? "?"}`
              : null;

          const detailsHref = ROUTES.BUYERS.LOT_DETAILS.replace(":lotId", lot.id);

          const passportHref = lot.passport_id
            ? `${ROUTES.BUYERS.PASSPORT}?passportId=${encodeURIComponent(lot.passport_id)}`
            : null;

          return (
            <div
              key={lot.id}
              style={{
                border: "1px solid rgba(0,0,0,0.12)",
                borderRadius: 16,
                padding: 14,
                background: "rgba(255,255,255,0.7)",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>{name}</h3>
                <span style={{ marginLeft: "auto", opacity: 0.65, fontSize: 12 }}>
                  {lot.status ?? "—"}
                </span>
              </div>

              <div style={{ marginTop: 8, opacity: 0.8, fontSize: 14 }}>
                {lot.category ? (
                  <div>
                    <b>Category:</b> {lot.category}
                  </div>
                ) : null}
                {lot.region ? (
                  <div>
                    <b>Region:</b> {lot.region}
                  </div>
                ) : null}
                {lot.quantity != null ? (
                  <div>
                    <b>Quantity:</b> {lot.quantity} {lot.unit ?? ""}
                  </div>
                ) : null}
                {price ? (
                  <div>
                    <b>Price:</b> {price}
                  </div>
                ) : null}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <Link to={detailsHref} style={{ textDecoration: "none" }}>
                  View details →
                </Link>

                {passportHref ? (
                  <Link to={passportHref} style={{ textDecoration: "none", marginLeft: "auto" }}>
                    View passport →
                  </Link>
                ) : (
                  <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: 12 }}>
                    No passport
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BuyerMarket;