package dto

import "encoding/json"

// GenerateFromModelIDsRequest asks the service to fetch metadata from HuggingFace
// and produce an AIBOM for each supplied model identifier.
type GenerateFromModelIDsRequest struct {
	// ModelIDs is the list of HuggingFace model identifiers (e.g. "org/model").
	ModelIDs []string `json:"model_ids" binding:"required,min=1"`
	// HFToken is an optional HuggingFace API token for private/gated models.
	HFToken string `json:"hf_token"`
	// TimeoutSeconds is the per-model fetch timeout (default 30 s when 0).
	TimeoutSeconds int `json:"timeout_seconds"`
}

// GeneratedBOM holds the AIBOM produced for a single model.
type GeneratedBOM struct {
	ModelID   string          `json:"model_id"`
	ModelName string          `json:"model_name"`
	BOM       json.RawMessage `json:"bom"`
}

// GenerateResponse is the top-level response for all generate endpoints.
type GenerateResponse struct {
	BOMs  []GeneratedBOM `json:"boms"`
	Count int            `json:"count"`
}
