import { supabase } from "@/lib/supabaseClient";

export type Agrochemical = {
  id: string;
  passport_id: string;
  kind: "pesticide" | "fertilizer";
  product_name: string;
  active_ingredient?: string | null;
  concentration?: string | null;
  dose?: number | null;
  dose_unit?: string | null;
  application_date?: string | null; // ISO date
  method?: string | null;
  phi_days?: number | null;
  notes?: string | null;
};

export type LabResult = {
  id: string;
  report_id: string;
  analyte: string;
  value?: number | null;
  unit?: string | null;
  limit_value?: number | null;
  limit_unit?: string | null;
  status: "pass" | "fail" | "unknown";
};

export type LabReport = {
  id: string;
  passport_id: string;
  laboratory_id?: string | null;
  sample_code: string;
  sample_date?: string | null;
  report_date?: string | null;
  report_file_path?: string | null;
  report_sha256?: string | null;
  passed?: boolean | null;
  notes?: string | null;
  passport_lab_results?: LabResult[];
};

export async function getPassportAgrochemicals(passportId: string) {
  const { data, error } = await supabase
    .from("passport_agrochemicals")
    .select("*")
    .eq("passport_id", passportId)
    .order("application_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Agrochemical[];
}

export async function getPassportLabReports(passportId: string) {
  const { data, error } = await supabase
    .from("passport_lab_reports")
    .select("*, passport_lab_results(*)")
    .eq("passport_id", passportId)
    .order("report_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LabReport[];
}

export async function addAgrochemical(input: Omit<Agrochemical, "id">) {
  const { data, error } = await supabase
    .from("passport_agrochemicals")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data as Agrochemical;
}