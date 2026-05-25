// Package server wires up the Gin engine, attaches all middleware, and registers
// every API route exposed by the AIBoMGen REST service.
package server

import (
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/handlers"
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/middleware"
)

// New creates and configures a Gin engine with all routes registered.
// The caller is responsible for calling engine.Run(addr).
func New() *gin.Engine {
	r := gin.New()

	// Middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())

	// Increase the maximum multipart memory to 64 MiB so large BOM files can be
	// uploaded in one shot without spilling to disk prematurely.
	r.MaxMultipartMemory = 64 << 20

	// Swagger UI – available at /swagger/index.html
	// Redirect bare /swagger to the UI for convenience.
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	v1 := r.Group("/api/v1")
	{
		// ------------------------------------------------------------------
		// Health
		// ------------------------------------------------------------------
		// GET /api/v1/health
		// Liveness check – no authentication required.
		v1.GET("/health", handlers.Health)

		// ------------------------------------------------------------------
		// Generate
		// ------------------------------------------------------------------
		// POST /api/v1/generate
		// Fetch metadata from HuggingFace Hub for each supplied model ID
		// and produce a CycloneDX AIBOM per model.
		v1.POST("/generate", handlers.GenerateFromModelIDs)

		// ------------------------------------------------------------------
		// Completeness
		// ------------------------------------------------------------------
		// POST /api/v1/completeness
		// Upload a CycloneDX BOM and receive a completeness report (score,
		// missing fields, per-dataset breakdown).
		v1.POST("/completeness", handlers.CheckCompleteness)

		// ------------------------------------------------------------------
		// Validate
		// ------------------------------------------------------------------
		// POST /api/v1/validate
		// Upload a CycloneDX BOM and receive a full validation report
		// (schema + semantic checks, completeness score, errors/warnings).
		v1.POST("/validate", handlers.Validate)

		// ------------------------------------------------------------------
		// Merge
		// ------------------------------------------------------------------
		// POST /api/v1/merge/aiboms-with-sbom
		// Merge one or more AIBOMs into a base SBOM – the recommended
		// workflow when integrating AI/ML metadata into an existing
		// software BOM.
		v1.POST("/merge/aiboms-with-sbom", handlers.MergeAIBOMsWithSBOM)
	}

	return r
}
