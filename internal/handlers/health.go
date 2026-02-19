package handlers

import (
	"net/http"
	"runtime"

	"github.com/gin-gonic/gin"
)

// HealthResponse is the body returned by GET /api/v1/health.
type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
	GoArch  string `json:"go_arch"`
}

// Health handles GET /api/v1/health.
//
// @Summary     Health check
// @Description Returns a liveness signal with Go runtime metadata.
// @Tags        system
// @Produce     json
// @Success     200 {object} HealthResponse
// @Router      /health [get]
func Health(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "ok",
		Version: runtime.Version(),
		GoArch:  runtime.GOARCH,
	})
}
