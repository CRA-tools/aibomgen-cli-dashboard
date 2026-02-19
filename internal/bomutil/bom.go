// Package bomutil provides shared helpers for encoding and decoding CycloneDX
// BOMs within HTTP handlers.
package bomutil

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"

	cdx "github.com/CycloneDX/cyclonedx-go"
	"github.com/idlab-discover/AIBoMGen-cli/pkg/aibomgen/bomio"
)

// EncodeBOM serialises a CycloneDX BOM to JSON for embedding in API responses.
func EncodeBOM(bom *cdx.BOM) (json.RawMessage, error) {
	buf := new(bytes.Buffer)
	enc := cdx.NewBOMEncoder(buf, cdx.BOMFileFormatJSON)
	enc.SetPretty(false)
	if err := enc.Encode(bom); err != nil {
		return nil, fmt.Errorf("encoding bom: %w", err)
	}
	return json.RawMessage(buf.Bytes()), nil
}

// DecodeBOM deserialises a CycloneDX BOM from JSON bytes.
func DecodeBOM(data []byte) (*cdx.BOM, error) {
	dec := cdx.NewBOMDecoder(bytes.NewReader(data), cdx.BOMFileFormatJSON)
	var bom cdx.BOM
	if err := dec.Decode(&bom); err != nil {
		return nil, fmt.Errorf("decoding bom: %w", err)
	}
	return &bom, nil
}

// BOMFromUpload writes the uploaded file bytes to a temporary file and reads it
// back through bomio.ReadBOM, which handles both JSON and XML CycloneDX formats.
// The caller is responsible for deleting the returned temporary path.
func BOMFromUpload(fh *multipart.FileHeader) (*cdx.BOM, string, error) {
	f, err := fh.Open()
	if err != nil {
		return nil, "", fmt.Errorf("opening upload: %w", err)
	}
	defer f.Close()

	ext := filepath.Ext(fh.Filename)
	if ext == "" {
		ext = ".json"
	}

	tmp, err := os.CreateTemp("", "aibomgen-*"+ext)
	if err != nil {
		return nil, "", fmt.Errorf("creating temp file: %w", err)
	}
	defer tmp.Close()

	buf := make([]byte, 1<<20)
	var written int64
	for {
		n, readErr := f.Read(buf)
		if n > 0 {
			if _, werr := tmp.Write(buf[:n]); werr != nil {
				os.Remove(tmp.Name())
				return nil, "", fmt.Errorf("writing temp file: %w", werr)
			}
			written += int64(n)
		}
		if readErr != nil {
			break
		}
	}
	if written == 0 {
		os.Remove(tmp.Name())
		return nil, "", fmt.Errorf("uploaded file is empty")
	}

	format := "json"
	if ext == ".xml" {
		format = "xml"
	}

	bom, err := bomio.ReadBOM(tmp.Name(), format)
	if err != nil {
		os.Remove(tmp.Name())
		return nil, "", fmt.Errorf("parsing bom: %w", err)
	}
	return bom, tmp.Name(), nil
}

// KeysToStrings converts a slice of any ~string type (e.g. metadata.Key) to
// plain []string via the fmt package so the caller is not forced to import the
// internal metadata package directly.
func KeysToStrings[K ~string](keys []K) []string {
	out := make([]string, len(keys))
	for i, k := range keys {
		out[i] = string(k)
	}
	return out
}
