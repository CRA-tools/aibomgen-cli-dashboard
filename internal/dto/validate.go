package dto

// ValidateRequest carries the strict-mode / scoring options for validation.
// The BOM itself is supplied as a multipart file upload named "bom".
type ValidateOptions struct {
	// StrictMode causes the result to be marked invalid when required fields are
	// absent (mirrors validator.ValidationOptions.StrictMode).
	StrictMode bool `json:"strict_mode" form:"strict_mode"`
	// MinCompletenessScore is the minimum acceptable completeness score (0–1).
	MinCompletenessScore float64 `json:"min_completeness_score" form:"min_completeness_score"`
	// CheckModelCard enables model-card field validation.
	CheckModelCard bool `json:"check_model_card" form:"check_model_card"`
}

// ValidateResponse mirrors validator.ValidationResult in a serialisable form.
type ValidateResponse struct {
	ModelID           string                           `json:"model_id"`
	Valid             bool                             `json:"valid"`
	Errors            []string                         `json:"errors"`
	Warnings          []string                         `json:"warnings"`
	CompletenessScore float64                          `json:"completeness_score"`
	MissingRequired   []string                         `json:"missing_required"`
	MissingOptional   []string                         `json:"missing_optional"`
	DatasetResults    map[string]DatasetValidateResult `json:"dataset_results,omitempty"`
}

// DatasetValidateResult mirrors validator.DatasetValidationResult.
type DatasetValidateResult struct {
	DatasetRef        string   `json:"dataset_ref"`
	CompletenessScore float64  `json:"completeness_score"`
	MissingRequired   []string `json:"missing_required"`
	MissingOptional   []string `json:"missing_optional"`
	Errors            []string `json:"errors"`
	Warnings          []string `json:"warnings"`
}
