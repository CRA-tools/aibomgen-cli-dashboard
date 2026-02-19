package dto

// ErrorResponse is the standard error body returned by all endpoints on failure.
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}
