package dto

import "encoding/json"

// MergeOptions carries configuration for the merge operation.
// The BOM files are supplied as multipart file uploads.
type MergeOptions struct {
	// DeduplicateComponents removes duplicate components based on BOM-ref.
	DeduplicateComponents bool `json:"deduplicate_components" form:"deduplicate_components"`
}

// MergeResponse wraps the merged BOM and statistics.
type MergeResponse struct {
	MergedBOM           json.RawMessage `json:"merged_bom" swaggertype:"object"`
	SBOMComponentCount  int             `json:"sbom_component_count"`
	AIBOMComponentCount int             `json:"aibom_component_count"`
	DuplicatesRemoved   int             `json:"duplicates_removed"`
	SBOMComponents      []string        `json:"sbom_components"`
	ModelComponents     []string        `json:"model_components"`
	DatasetComponents   []string        `json:"dataset_components"`
	MetadataComponent   string          `json:"metadata_component"`
}
