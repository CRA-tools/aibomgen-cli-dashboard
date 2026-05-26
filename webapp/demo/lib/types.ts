// ── Shared ───────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
  go_arch: string;
}

// ── Generate ──────────────────────────────────────────────────────────────────

export interface GenerateFromModelIDsRequest {
  model_ids: string[];
  hf_token?: string;
  timeout_seconds?: number;
  skip_security_scan?: boolean;
}

export interface GeneratedBOM {
  model_id: string;
  model_name: string;
  bom: Record<string, unknown>;
}

export interface GenerateResponse {
  boms: GeneratedBOM[];
  count: number;
}

// ── Completeness ──────────────────────────────────────────────────────────────

export interface DatasetCompletenessResult {
  dataset_ref: string;
  score: number;
  passed: number;
  total: number;
  missing_required: string[];
  missing_optional: string[];
}

export interface CompletenessResponse {
  model_id: string;
  score: number;
  passed: number;
  total: number;
  missing_required: string[];
  missing_optional: string[];
  dataset_results?: Record<string, DatasetCompletenessResult>;
}

// ── Validate ──────────────────────────────────────────────────────────────────

export interface DatasetValidateResult {
  dataset_ref: string;
  completeness_score: number;
  missing_required: string[];
  missing_optional: string[];
  errors: string[];
  warnings: string[];
}

export interface ValidateResponse {
  model_id: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  completeness_score: number;
  missing_required: string[];
  missing_optional: string[];
  dataset_results?: Record<string, DatasetValidateResult>;
}

// ── Vuln-scan ─────────────────────────────────────────────────────────────────

export interface VulnerabilityFinding {
  id: string;
  source?: string;
  severity?: string;
  description?: string;
}

export interface ComponentVulnScanResult {
  component_ref: string;
  model_id: string;
  vulnerability_count: number;
  vulnerabilities: VulnerabilityFinding[];
  scan_entries_count: number;
  error?: string;
}

export interface VulnScanResponse {
  components: ComponentVulnScanResult[];
  total_vulnerabilities: number;
  enriched_bom?: Record<string, unknown>;
}

// ── Merge ─────────────────────────────────────────────────────────────────────

export interface MergeResponse {
  merged_bom: Record<string, unknown>;
  sbom_component_count: number;
  aibom_component_count: number;
  duplicates_removed: number;
  sbom_components: string[];
  model_components: string[];
  dataset_components: string[];
  metadata_component: string;
}
