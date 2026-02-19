package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/idlab-discover/AIBoMGen-cli-demo-frontend/internal/bomutil"
	"github.com/idlab-discover/AIBoMGen-cli-demo-frontend/internal/dto"
	"github.com/idlab-discover/AIBoMGen-cli/pkg/aibomgen/generator"
)

const defaultTimeoutSeconds = 30

// GenerateFromModelIDs handles POST /api/v1/generate/from-model-ids.
//
// @Summary     Generate AIBOMs from HuggingFace model IDs
// @Description Fetches metadata from HuggingFace Hub for each supplied model ID and produces a CycloneDX AIBOM per model.
// @Tags        generate
// @Accept      json
// @Produce     json
// @Param       body body dto.GenerateFromModelIDsRequest true "Model IDs and options"
// @Success     200 {object} dto.GenerateResponse
// @Failure     400 {object} dto.ErrorResponse "Invalid request body"
// @Failure     500 {object} dto.ErrorResponse "Generation error"
// @Router      /generate [post]
func GenerateFromModelIDs(c *gin.Context) {
	var req dto.GenerateFromModelIDsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "invalid request body",
			Details: err.Error(),
		})
		return
	}

	timeout := resolveTimeout(req.TimeoutSeconds)

	ctx, cancel := context.WithTimeout(c.Request.Context(), time.Duration(len(req.ModelIDs))*timeout+timeout)
	defer cancel()

	opts := generator.GenerateOptions{
		HFToken: req.HFToken,
		Timeout: timeout,
	}

	discovered, err := generator.BuildFromModelIDsWithProgress(ctx, req.ModelIDs, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "generation failed",
			Details: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, buildGenerateResponse(discovered))
}

// resolveTimeout returns a per-model fetch timeout, defaulting to
// defaultTimeoutSeconds when the caller supplied 0.
func resolveTimeout(secs int) time.Duration {
	if secs <= 0 {
		return time.Duration(defaultTimeoutSeconds) * time.Second
	}
	return time.Duration(secs) * time.Second
}

// buildGenerateResponse converts []generator.DiscoveredBOM into the wire DTO.
func buildGenerateResponse(discovered []generator.DiscoveredBOM) dto.GenerateResponse {
	boms := make([]dto.GeneratedBOM, 0, len(discovered))
	for _, d := range discovered {
		raw, err := bomutil.EncodeBOM(d.BOM)
		if err != nil {
			// If we cannot encode a single BOM, skip it rather than failing the
			// entire request – the caller can detect the shorter list.
			continue
		}
		boms = append(boms, dto.GeneratedBOM{
			ModelID:   d.Discovery.ID,
			ModelName: d.Discovery.Name,
			BOM:       raw,
		})
	}
	return dto.GenerateResponse{BOMs: boms, Count: len(boms)}
}
