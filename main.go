// Package main is the entry-point for the AIBoMGen REST API server.
package main

import (
	"log"
	"os"

	_ "github.com/CRA-tools/aibomgen-cli-dashboard/docs" // generated Swagger docs
	"github.com/CRA-tools/aibomgen-cli-dashboard/internal/server"
)

// @title           AIBoMGen REST API
// @version         1.0
// @description     HTTP API for generating, assessing and merging CycloneDX AI/ML Bills of Materials (AIBOMs) using the AIBoMGen-cli library.
// @contact.name    IDLab Discover
// @contact.url     https://github.com/idlab-discover/AIBoMGen-cli
// @license.name    MIT
// @license.url     https://opensource.org/licenses/MIT
// @host            localhost:8080
// @BasePath        /api/v1
// @schemes         http https

func main() {
	addr := os.Getenv("AIBOMGEN_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	r := server.New()

	log.Printf("AIBoMGen API server listening on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
