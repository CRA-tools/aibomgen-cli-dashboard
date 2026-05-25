package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/bomutil"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/dto"
	"github.com/idlab-discover/aibomgen-cli/pkg/aibomgen/validator"
)

// Validate handles POST /api/v1/validate.
//
// @Summary     Validate a CycloneDX BOM
// @Description Upload a CycloneDX BOM and receive a full validation report: schema and semantic checks, completeness score, errors, warnings, and per-dataset results. Returns HTTP 422 when the BOM is invalid.
// @Tags        validate
// @Accept      multipart/form-data
// @Produce     json
// @Param       bom                    formData file    true  "CycloneDX BOM file (JSON or XML)"
// @Param       strict_mode            formData bool    false "Fail if required fields are missing (default false)"
// @Param       min_completeness_score formData number  false "Minimum acceptable completeness score 0–1 (default 0.0)"
// @Param       check_model_card       formData bool    false "Validate model card fields (default false)"
// @Success     200 {object} dto.ValidateResponse "BOM is valid"
// @Failure     400 {object} dto.ErrorResponse   "Missing BOM file"
// @Failure     422 {object} dto.ValidateResponse "BOM is invalid"
// @Router      /validate [post]
func Validate(c *gin.Context) {
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

	// Bind query/form options
	var opts dto.ValidateOptions
	// Ignore binding error – all fields are optional
	_ = c.ShouldBind(&opts)

	result := validator.Validate(bom, validator.ValidationOptions{
		StrictMode:           opts.StrictMode,
		MinCompletenessScore: opts.MinCompletenessScore,
		CheckModelCard:       opts.CheckModelCard,
	})

	// Convert dataset results
	dsResults := make(map[string]dto.DatasetValidateResult, len(result.DatasetResults))
	for ref, dr := range result.DatasetResults {
		dsResults[ref] = dto.DatasetValidateResult{
			DatasetRef:        dr.DatasetRef,
			CompletenessScore: dr.CompletenessScore,
			MissingRequired:   bomutil.KeysToStrings(dr.MissingRequired),
			MissingOptional:   bomutil.KeysToStrings(dr.MissingOptional),
			Errors:            dr.Errors,
			Warnings:          dr.Warnings,
		}
	}

	status := http.StatusOK

	c.JSON(status, dto.ValidateResponse{
		ModelID:           result.ModelID,
		Valid:             result.Valid,
		Errors:            result.Errors,
		Warnings:          result.Warnings,
		CompletenessScore: result.CompletenessScore,
		MissingRequired:   bomutil.KeysToStrings(result.MissingRequired),
		MissingOptional:   bomutil.KeysToStrings(result.MissingOptional),
		DatasetResults:    dsResults,
	})
}
