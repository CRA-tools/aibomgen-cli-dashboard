package dto

// CompletenessResponse mirrors completeness.Result in a serialisable form
// and is returned by POST /api/v1/completeness.
// The BOM is supplied as a multipart file upload.
type CompletenessResponse struct {
	ModelID         string   `json:"model_id"`
	Score           float64  `json:"score"`
	Passed          int      `json:"passed"`
	Total           int      `json:"total"`
	MissingRequired []string `json:"missing_required"`
	MissingOptional []string `json:"missing_optional"`
	// DatasetResults maps a dataset reference to its individual completeness result.
	DatasetResults map[string]DatasetCompletenessResult `json:"dataset_results,omitempty"`
}

// DatasetCompletenessResult mirrors completeness.DatasetResult.
type DatasetCompletenessResult struct {
	DatasetRef      string   `json:"dataset_ref"`
	Score           float64  `json:"score"`
	Passed          int      `json:"passed"`
	Total           int      `json:"total"`
	MissingRequired []string `json:"missing_required"`
	MissingOptional []string `json:"missing_optional"`
}
