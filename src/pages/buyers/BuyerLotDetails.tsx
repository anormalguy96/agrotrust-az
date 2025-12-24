// src/pages/buyers/BuyerLotDetails.tsx

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ROUTES } from "@/app/config/routes";

type Lot = {
  id: string;
  title?: string | null;
  product_name?: string | null;
  description?: string | null;
  category?: string | null;
  region?: string | null;
  quantity?: number | null;
  unit?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  status?: string | null;
  passport_id?: string | null;
};

function BuyerLotDetails() {
  const { lotId } = useParams();
  const [lot, setLot] = useState<Lot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!lotId) return;

      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.from("lots").select("*").eq("id", lotId).single();

      if (!isMounted) return;

      if (error) {
        setError(error.message);
        setLot(null);
      } else {
        setLot(data as Lot);
      }

      setIsLoading(false);
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [lotId]);

  if (isLoading) {
    return (
      <div className="container" style={{ padding: "24px 0" }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "24px 0" }}>
        <div
          style={{
            padding: 12,
            border: "1px solid rgba(255,0,0,0.25)",
            borderRadius: 12,
          }}
        >
          <b>Error:</b> {error}
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="container" style={{ padding: "24px 0" }}>
        Lot not found.
      </div>
    );
  }

  const name = lot.title ?? lot.product_name ?? "Untitled lot";

  const passportHref = lot.passport_id
    ? `${ROUTES.BUYERS.PASSPORT}?passportId=${encodeURIComponent(lot.passport_id)}`
    : null;

  return (
    <div className="container" style={{ padding: "24px 0" }}>
      <Link to={ROUTES.BUYERS.MARKET} style={{ textDecoration: "none" }}>
        ← Back to marketplace
      </Link>

      <h1 style={{ marginTop: 12 }}>{name}</h1>

      <div style={{ opacity: 0.85 }}>
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
        {lot.price_min != null || lot.price_max != null ? (
          <div>
            <b>Price:</b> {lot.price_min ?? "?"} - {lot.price_max ?? "?"}
          </div>
        ) : null}
        {lot.status ? (
          <div>
            <b>Status:</b> {lot.status}
          </div>
        ) : null}
      </div>

      {lot.description ? (
        <div style={{ marginTop: 14 }}>
          <h3>Description</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{lot.description}</p>
        </div>
      ) : null}

      <div style={{ marginTop: 16 }}>
        {passportHref ? (
          <Link to={passportHref} style={{ textDecoration: "none" }}>
            View Digital Product Passport →
          </Link>
        ) : (
          <div style={{ opacity: 0.6 }}>This lot has no passport yet.</div>
        )}
      </div>
    </div>
  );
}

export default BuyerLotDetails;