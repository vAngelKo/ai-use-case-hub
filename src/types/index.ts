export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface UseCaseOutput {
  marketing_function: string;
  subfunction: string;
  use_case: string;
  ai_tool: string;
  description: string;
  supporting_documentation: string;
  additional_stakeholders: string;
  escalation_tier: string;
  roi: string;
  roi_details: string;
  /** Plain-language estimate, e.g. "~5 hrs/week" or "N/A" */
  hours_saved: string;
  status: string;
  business_owner: string;
  missing_info: string[];
  suggested_follow_up_questions: string[];
}

/** Row shape returned from Supabase `ideas` table */
export interface IdeaRow {
  id: string;
  created_at: string;
  updated_at: string;
  submitter_email: string;
  submitter_name: string | null;
  marketing_function: string | null;
  subfunction: string | null;
  status: string | null;
  business_owner: string | null;
  additional_stakeholders: string | null;
  use_case: string | null;
  ai_tool: string | null;
  description: string | null;
  supporting_documentation: string | null;
  escalation_tier: string | null;
  roi: string | null;
  roi_details: string | null;
  hours_saved: string | null;
  missing_info: unknown;
  suggested_follow_up_questions: unknown;
}

export interface StructuredFormState {
  marketing_function: string;
  subfunction: string;
  status: string;
  business_owner: string;
  additional_stakeholders: string;
}

export const EMPTY_STRUCTURED_FORM: StructuredFormState = {
  marketing_function: "",
  subfunction: "",
  status: "",
  business_owner: "",
  additional_stakeholders: "",
};

export function isStructuredFormComplete(s: StructuredFormState): boolean {
  const extra = s.additional_stakeholders.trim();
  return !!(
    s.marketing_function &&
    s.subfunction &&
    s.status &&
    s.business_owner &&
    extra
  );
}

export const USE_CASE_FIELDS = [
  { key: "marketing_function", label: "Marketing Function", required: true },
  { key: "subfunction", label: "Subfunction", required: true },
  { key: "use_case", label: "Use Case", required: true },
  { key: "ai_tool", label: "AI Tool", required: true },
  { key: "description", label: "Description", required: true },
  { key: "supporting_documentation", label: "Supporting Documentation", required: false },
  { key: "additional_stakeholders", label: "Additional Stakeholders", required: true },
  { key: "escalation_tier", label: "Escalation Tier", required: true },
  { key: "roi", label: "ROI (value type)", required: true },
  { key: "roi_details", label: "ROI details (your words)", required: true },
  { key: "hours_saved", label: "Hours saved (estimate)", required: true },
  { key: "status", label: "Status", required: true },
  { key: "business_owner", label: "Business Owner", required: true },
] as const;

export function rowToUseCase(row: IdeaRow): UseCaseOutput {
  const mi = row.missing_info;
  const fq = row.suggested_follow_up_questions;
  return {
    marketing_function: row.marketing_function ?? "",
    subfunction: row.subfunction ?? "",
    use_case: row.use_case ?? "",
    ai_tool: row.ai_tool ?? "",
    description: row.description ?? "",
    supporting_documentation: row.supporting_documentation ?? "",
    additional_stakeholders: row.additional_stakeholders ?? "",
    escalation_tier: row.escalation_tier ?? "",
    roi: row.roi ?? "",
    roi_details: row.roi_details ?? "",
    hours_saved: row.hours_saved ?? "",
    status: row.status ?? "",
    business_owner: row.business_owner ?? "",
    missing_info: Array.isArray(mi) ? (mi as string[]) : [],
    suggested_follow_up_questions: Array.isArray(fq) ? (fq as string[]) : [],
  };
}
