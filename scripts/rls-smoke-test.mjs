import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

function client() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function signIn(email, password) {
  const sb = client();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { sb, user: data.user };
}

async function run() {
  const buyerEmail = process.env.TEST_BUYER_EMAIL;
  const buyerPass = process.env.TEST_BUYER_PASS;
  const coopEmail = process.env.TEST_COOP_EMAIL;
  const coopPass = process.env.TEST_COOP_PASS;

  if (!buyerEmail || !buyerPass || !coopEmail || !coopPass) {
    throw new Error("Set TEST_BUYER_EMAIL/PASS and TEST_COOP_EMAIL/PASS");
  }

  // 1) Buyer sees published lots
  const { sb: buyer } = await signIn(buyerEmail, buyerPass);
  const lotsRes = await buyer.from("lots").select("id,status").eq("status", "published").limit(5);
  console.log("Buyer published lots:", lotsRes.error ?? lotsRes.data);

  // Pick a lot id to test deeper
  const lotId = lotsRes.data?.[0]?.id;
  if (!lotId) {
    console.log("No published lot found to continue tests.");
    return;
  }

  // 2) Buyer creates RFQ for that lot (adjust columns to your schema)
  const rfqInsert = await buyer.from("rfqs").insert({
    lot_id: lotId,
    // DO NOT send buyer_id if your DB sets it from auth.uid() via trigger/policy.
    // If you do store buyer_id explicitly, your RLS should enforce buyer_id = auth.uid().
    message: "Test RFQ from script",
    status: "sent",
  }).select("id,lot_id,cooperative_id,buyer_id").single();

  console.log("Buyer insert RFQ:", rfqInsert.error ?? rfqInsert.data);
  const rfqId = rfqInsert.data?.id;
  const coopIdFromRfq = rfqInsert.data?.cooperative_id;

  // 3) Coop should see RFQ (only if addressed to them)
  const { sb: coop } = await signIn(coopEmail, coopPass);
  const coopRfqs = await coop.from("rfqs").select("id,lot_id,cooperative_id").eq("id", rfqId).single();
  console.log("Coop sees RFQ:", coopRfqs.error ?? coopRfqs.data);

  // 4) Coop replies (quote) (adjust table/columns)
  const quoteInsert = await coop.from("quotes").insert({
    rfq_id: rfqId,
    price: 123,
    currency: "AZN",
    status: "sent",
  }).select("id,rfq_id").single();

  console.log("Coop insert quote:", quoteInsert.error ?? quoteInsert.data);

  // 5) Buyer sees their RFQ + quote
  const buyerRfq = await buyer.from("rfqs").select("id,buyer_id,cooperative_id").eq("id", rfqId).single();
  console.log("Buyer reads RFQ:", buyerRfq.error ?? buyerRfq.data);

  const buyerQuote = await buyer.from("quotes").select("id,rfq_id").eq("rfq_id", rfqId).single();
  console.log("Buyer reads quote:", buyerQuote.error ?? buyerQuote.data);

  console.log("Done.");
}

run().catch((e) => {
  console.error("RLS SMOKE TEST FAILED:", e);
  process.exit(1);
});