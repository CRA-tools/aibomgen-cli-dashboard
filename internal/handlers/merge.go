package handlers

import (
	"net/http"
	"os"

	cdx "github.com/CycloneDX/cyclonedx-go"
	"github.com/gin-gonic/gin"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/bomutil"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/dto"
	"github.com/idlab-discover/aibomgen-cli/pkg/aibomgen/merger"
)

// MergeAIBOMsWithSBOM handles POST /api/v1/merge/aiboms-with-sbom.
//
// @Summary     Merge AIBOMs into an SBOM
// @Description Merges one or more AIBOMs into a base SBOM. This is the recommended workflow when integrating AI/ML model metadata into an existing software BOM.
// @Tags        merge
// @Accept      multipart/form-data
// @Produce     json
// @Param       sbom                   formData file   true  "Base SBOM file"
// @Param       aibom[]                formData []file true  "One or more AIBOM files (select multiple in the file picker)"
// @Param       deduplicate_components formData bool   false "Remove duplicate components (default false)"
// @Success     200 {object} dto.MergeResponse
// @Failure     400 {object} dto.ErrorResponse "Missing required file(s)"
// @Failure     422 {object} dto.ErrorResponse "BOM parse error"
// @Failure     500 {object} dto.ErrorResponse "Merge error"
// @Router      /merge/aiboms-with-sbom [post]
func MergeAIBOMsWithSBOM(c *gin.Context) {
	sbomFH, err := c.FormFile("sbom")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error:   "missing 'sbom' file",
			Details: err.Error(),
		})
		return
	}

	form, err := c.MultipartForm()
	if err != nil || len(form.File["aibom[]"]) == 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{
			Error: "at least one 'aibom[]' file is required",
		})
		return
	}

	sbomBOM, tmpSBOM, err := bomutil.BOMFromUpload(sbomFH)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{Error: "could not parse SBOM", Details: err.Error()})
		return
	}
	defer os.Remove(tmpSBOM)

	aiboms := make([]*cdx.BOM, 0, len(form.File["aibom[]"]))
	var tmps []string
	for _, fh := range form.File["aibom[]"] {
		bom, tmp, err := bomutil.BOMFromUpload(fh)
		if err != nil {
			for _, t := range tmps {
				os.Remove(t)
			}
			c.JSON(http.StatusUnprocessableEntity, dto.ErrorResponse{
				Error:   "could not parse AIBOM: " + fh.Filename,
				Details: err.Error(),
			})
			return
		}
		aiboms = append(aiboms, bom)
		tmps = append(tmps, tmp)
	}
	for _, t := range tmps {
		defer os.Remove(t)
	}

	var opts dto.MergeOptions
	_ = c.ShouldBind(&opts)

	result, err := merger.MergeAIBOMsWithSBOM(sbomBOM, aiboms, merger.MergeOptions{
		DeduplicateComponents: opts.DeduplicateComponents,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "merge failed", Details: err.Error()})
		return
	}

	c.JSON(http.StatusOK, buildMergeResponse(result))
}

// buildMergeResponse converts a merger.MergeResult into the wire DTO.
func buildMergeResponse(result *merger.MergeResult) dto.MergeResponse {
	raw, _ := bomutil.EncodeBOM(result.MergedBOM)
	return dto.MergeResponse{
		MergedBOM:           raw,
		SBOMComponentCount:  result.SBOMComponentCount,
		AIBOMComponentCount: result.AIBOMComponentCount,
		DuplicatesRemoved:   result.DuplicatesRemoved,
		SBOMComponents:      result.SBOMComponents,
		ModelComponents:     result.ModelComponents,
		DatasetComponents:   result.DatasetComponents,
		MetadataComponent:   result.MetadataComponent,
	}
}
