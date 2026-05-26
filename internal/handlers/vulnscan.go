package handlers

import (
	"fmt"
	"net/http"
	"os"

	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/bomutil"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/dto"
	cdx "github.com/CycloneDX/cyclonedx-go"
	"github.com/gin-gonic/gin"
	"github.com/idlab-discover/aibomgen-cli/pkg/aibomgen/vulnscan"
)

// VulnScan handles POST /api/v1/vuln-scan.
//
// @Summary     Vulnerability scan of an AIBOM
// @Description Fetches per-file security scan results from the Hugging Face Hub for every
// @Description model and dataset component referenced in the uploaded AIBOM. Scanners covered:
// @Description Cisco Foundation AI (ClamAV), ProtectAI, HuggingFace Pickle Scanner,
// @Description VirusTotal, and JFrog Research. Set enrich=true to inject findings back into
// @Description the BOM as CycloneDX Vulnerabilities and receive the updated BOM in the response.
// @Tags        vuln-scan
// @Accept      multipart/form-data
// @Produce     json
// @Param       bom            formData file   true  "CycloneDX AIBOM file (JSON or XML)"
// @Param       hf_token       formData string false "HuggingFace API token (for private/gated models)"
// @Param       timeout_seconds formData int   false "Per-component fetch timeout in seconds (default 30)"
// @Param       enrich         formData bool   false "Inject findings into the BOM and return the enriched BOM"
// @Success     200 {object} dto.VulnScanResponse
// @Failure     400 {object} dto.ErrorResponse "Missing BOM file"
// @Failure     422 {object} dto.ErrorResponse "BOM parse error"
// @Router      /vuln-scan [post]
func VulnScan(c *gin.Context) {
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

	hfToken := c.PostForm("hf_token")
	enrich := c.PostForm("enrich") == "true"

	var timeoutSecs int
	if v := c.PostForm("timeout_seconds"); v != "" {
		if n, err2 := parseInt(v); err2 == nil {
			timeoutSecs = n
		}
	}

	results := vulnscan.ScanBOM(bom, vulnscan.Options{
		HFToken: hfToken,
		Timeout: resolveTimeout(timeoutSecs),
	})

	components, total := buildVulnComponents(results)

	resp := dto.VulnScanResponse{
		Components:           components,
		TotalVulnerabilities: total,
	}

	if enrich {
		vulnscan.ApplyToDOM(bom, results)
		raw, encErr := bomutil.EncodeBOM(bom)
		if encErr == nil {
			resp.EnrichedBOM = raw
		}
	}

	c.JSON(http.StatusOK, resp)
}

// buildVulnComponents converts []vulnscan.ComponentScanResult into DTOs.
func buildVulnComponents(results []vulnscan.ComponentScanResult) ([]dto.ComponentVulnScanResult, int) {
	components := make([]dto.ComponentVulnScanResult, 0, len(results))
	total := 0

	for _, r := range results {
		findings := make([]dto.VulnerabilityFinding, 0, len(r.Vulnerabilities))
		for _, v := range r.Vulnerabilities {
			findings = append(findings, vulnToFinding(v))
		}

		errStr := ""
		if r.Err != nil {
			errStr = r.Err.Error()
		}

		components = append(components, dto.ComponentVulnScanResult{
			ComponentRef:       r.ComponentRef,
			ModelID:            r.ModelID,
			VulnerabilityCount: len(r.Vulnerabilities),
			Vulnerabilities:    findings,
			ScanEntriesCount:   len(r.Entries),
			Error:              errStr,
		})
		total += len(r.Vulnerabilities)
	}

	return components, total
}

// vulnToFinding maps a cdx.Vulnerability to the lightweight wire DTO.
func vulnToFinding(v cdx.Vulnerability) dto.VulnerabilityFinding {
	f := dto.VulnerabilityFinding{
		ID:          v.ID,
		Description: v.Description,
	}
	if v.Source != nil {
		f.Source = v.Source.Name
	}
	if v.Ratings != nil && len(*v.Ratings) > 0 {
		f.Severity = string((*v.Ratings)[0].Severity)
	}
	return f
}

// parseInt parses a decimal string to int.
func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}
