package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/bomutil"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/dto"
	"github.com/idlab-discover/aibomgen-cli/pkg/aibomgen/completeness"
)

// CheckCompleteness handles POST /api/v1/completeness.
//
// @Summary     Assess BOM completeness
// @Description Upload a CycloneDX BOM (JSON or XML) and receive a completeness report: overall score, passed/total field counts, missing required/optional fields, and per-dataset breakdown.
// @Tags        completeness
// @Accept      multipart/form-data
// @Produce     json
// @Param       bom formData file true "CycloneDX BOM file (JSON or XML)"
// @Success     200 {object} dto.CompletenessResponse
// @Failure     400 {object} dto.ErrorResponse "Missing BOM file"
// @Failure     422 {object} dto.ErrorResponse "BOM parse error"
// @Router      /completeness [post]
func CheckCompleteness(c *gin.Context) {
	fh, err := c.FormFile("bom")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "missing 'bom' file in multipart form",
			Details: err.Error(),
		})
		return
	}

	bom, tmpPath, err := bomutil.BOMFromUpload(fh)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{
			Error:   "could not parse BOM",
			Details: err.Error(),
		})
		return
	}
	defer os.Remove(tmpPath)

	result := completeness.Check(bom)

	// Convert dataset results
	dsResults := make(map[string]dto.DatasetCompletenessResult, len(result.DatasetResults))
	for ref, dr := range result.DatasetResults {
		dsResults[ref] = dto.DatasetCompletenessResult{
			DatasetRef:      dr.DatasetRef,
			Score:           dr.Score,
			Passed:          dr.Passed,
			Total:           dr.Total,
			MissingRequired: bomutil.KeysToStrings(dr.MissingRequired),
			MissingOptional: bomutil.KeysToStrings(dr.MissingOptional),
		}
	}

	c.JSON(http.StatusOK, dto.CompletenessResponse{
		ModelID:         result.ModelID,
		Score:           result.Score,
		Passed:          result.Passed,
		Total:           result.Total,
		MissingRequired: bomutil.KeysToStrings(result.MissingRequired),
		MissingOptional: bomutil.KeysToStrings(result.MissingOptional),
		DatasetResults:  dsResults,
	})
}
