package dto

import "encoding/json"

// VulnerabilityFinding is a single security finding extracted from the
// HuggingFace security scan tree for one model or dataset file.
type VulnerabilityFinding struct {
	// ID is the CycloneDX vulnerability identifier (BOM-ref).
	ID string `json:"id"`
	// Source is the name of the scanner that reported the finding
	// (e.g. "ClamAV", "ProtectAI", "HuggingFace Pickle Scanner").
	Source string `json:"source,omitempty"`
	// Severity is the severity string from the first rating
	// (none | low | medium | high | critical | unknown).
	Severity string `json:"severity,omitempty"`
	// Description is a human-readable description of the finding.
	Description string `json:"description,omitempty"`
}

// ComponentVulnScanResult holds the vulnerability scan outcome for a single
// BOM component (model or dataset).
type ComponentVulnScanResult struct {
	// ComponentRef is the BOM-ref of the affected component.
	ComponentRef string `json:"component_ref"`
	// ModelID is the HuggingFace model/dataset ID that was scanned.
	ModelID string `json:"model_id"`
	// VulnerabilityCount is the number of vulnerability findings.
	VulnerabilityCount int `json:"vulnerability_count"`
	// Vulnerabilities lists each individual finding.
	Vulnerabilities []VulnerabilityFinding `json:"vulnerabilities"`
	// ScanEntriesCount is the number of raw per-file security entries returned
	// by the HuggingFace tree API (useful to distinguish "no files" from "no findings").
	ScanEntriesCount int `json:"scan_entries_count"`
	// Error is set when the tree API call for this component failed (non-fatal).
	Error string `json:"error,omitempty"`
}

// VulnScanResponse is the top-level response for POST /api/v1/vuln-scan.
type VulnScanResponse struct {
	// Components holds one result per scanned BOM component.
	Components []ComponentVulnScanResult `json:"components"`
	// TotalVulnerabilities is the sum of all vulnerability findings across components.
	TotalVulnerabilities int `json:"total_vulnerabilities"`
	// EnrichedBOM is the full updated BOM with injected CycloneDX vulnerabilities.
	// Only present when the request included enrich=true.
	EnrichedBOM json.RawMessage `json:"enriched_bom,omitempty" swaggertype:"object"`
}
