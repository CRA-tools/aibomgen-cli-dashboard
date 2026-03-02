# AIBoMGen-cli-dashboard

A demo showcasing the [AIBoMGen-cli](https://github.com/idlab-discover/AIBoMGen-cli) library. It consists of a lightweight Go REST API backed by the library and a Next.js web dashboard that lets users generate, validate, assess, and merge AI Bills of Materials (AIBOMs).

## Running the demo

### 1. Start the API (Go)

From the repository root:

```bash
go run .
```

The API will be available at `http://localhost:8080`.

### 2. Start the frontend (Next.js)

```bash
cd webapp/demo
npm install
```

**Development** (hot-reload):

```bash
npm run dev
```

**Production**:

```bash
npm run build
npm run start
```

The frontend will be available at `http://localhost:3000`.

## Updating Swagger docs

Swagger documentation is generated from annotations in [`main.go`](main.go) and the handler files in [`internal/handlers/`](internal/handlers/) using [swaggo/swag](https://github.com/swaggo/swag).

After editing any `@Summary`, `@Description`, `@Param`, `@Success`, `@Router`, or other Swag annotations, regenerate the docs from the repository root:

```bash
# Install the swag CLI (once)
go install github.com/swaggo/swag/cmd/swag@latest

# Regenerate docs/docs.go, docs/swagger.json, docs/swagger.yaml
swag init
```

The Swagger UI is served at `http://localhost:8080/swagger/index.html` when the API is running.

> **Note:** `json.RawMessage` fields must include a `swaggertype` struct tag (e.g. `` `json:"bom" swaggertype:"object"` ``) so `swag` can resolve them. Without it `swag init` will fail with a *cannot find type definition* error.
