import type {
  HealthResponse,
  GenerateFromModelIDsRequest,
  GenerateResponse,
  CompletenessResponse,
  ValidateResponse,
  VulnScanResponse,
  MergeResponse,
} from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      // Don't set Content-Type for FormData – the browser must set the boundary
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const err = json as { error?: string; details?: string };
    throw new Error(err.error ?? `Request failed (${res.status})`);
  }

  return json as T;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const api = {
  health(): Promise<HealthResponse> {
    return apiFetch("/health");
  },

  generate(body: GenerateFromModelIDsRequest): Promise<GenerateResponse> {
    return apiFetch("/generate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  checkCompleteness(bomFile: File): Promise<CompletenessResponse> {
    const form = new FormData();
    form.append("bom", bomFile);
    return apiFetch("/completeness", { method: "POST", body: form });
  },

  validate(
    bomFile: File,
    opts?: { strict_mode?: boolean; min_completeness_score?: number; check_model_card?: boolean }
  ): Promise<ValidateResponse> {
    const form = new FormData();
    form.append("bom", bomFile);
    if (opts?.strict_mode)            form.append("strict_mode", "true");
    if (opts?.min_completeness_score) form.append("min_completeness_score", String(opts.min_completeness_score));
    if (opts?.check_model_card)       form.append("check_model_card", "true");
    return apiFetch("/validate", { method: "POST", body: form });
  },

  mergeAIBOMsWithSBOM(
    sbom: File,
    aiboms: File[],
    opts?: { deduplicate_components?: boolean }
  ): Promise<MergeResponse> {
    const form = new FormData();
    form.append("sbom", sbom);
    for (const f of aiboms) form.append("aibom[]", f);
    if (opts?.deduplicate_components)    form.append("deduplicate_components", "true");
    return apiFetch("/merge/aiboms-with-sbom", { method: "POST", body: form });
  },

  vulnScan(
    bomFile: File,
    opts?: { hf_token?: string; timeout_seconds?: number; enrich?: boolean }
  ): Promise<VulnScanResponse> {
    const form = new FormData();
    form.append("bom", bomFile);
    if (opts?.hf_token)        form.append("hf_token", opts.hf_token);
    if (opts?.timeout_seconds) form.append("timeout_seconds", String(opts.timeout_seconds));
    if (opts?.enrich)          form.append("enrich", "true");
    return apiFetch("/vuln-scan", { method: "POST", body: form });
  },
} as const;
