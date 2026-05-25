# AIBoMGen CLI: Demo Dashboard

A demo showcasing the [AIBoMGen CLI](https://github.com/idlab-discover/aibomgen-cli) library (v0.2.1). It consists of a lightweight Go REST API backed by the library and a Next.js web dashboard that lets users generate, validate, assess, and merge AI Bills of Materials (AIBOMs).

## AIBoMGen Ecosystem

This repository is part of the broader AIBoMGen ecosystem for generating, analyzing, and validating AI/ML Bills of Materials (AIBOMs).

| Repository | Purpose |
|---|---|
| [AIBoMGen CLI](https://github.com/idlab-discover/aibomgen-cli) | Command-line tool for generating AIBOMs from source code and ML artifacts |
| [AIBoMGen CLI Action](https://github.com/CRA-tools/AIBoMGen-cli-action) | GitHub Action for automated AIBOM generation in CI/CD pipelines |
| [AIBoMGen CLI Dashboard](https://github.com/CRA-tools/aibomgen-cli-dashboard) | Demo dashboard using [AIBoMGen CLI](https://github.com/idlab-discover/aibomgen-cli) |
| [AIBoMGen](https://github.com/idlab-discover/AIBoMGen) | Proof of concept research repository |
| [AIBoMGen Experiments](https://github.com/idlab-discover/AIBoMGen-experiments) | Experimental evaluations of [AIBoMGen](https://github.com/idlab-discover/AIBoMGen)|

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

## Contact

For inquiries, feel free to reach out

Maintained by:

Wiebe Vandendriessche  
[wiebe.vandendriessche@ugent.be](mailto:wiebe.vandendriessche@ugent.be)  
[LinkedIn](https://www.linkedin.com/in/wiebe-vandendriessche/?locale=en_US)  
[DISCOVER: IDLab, Ghent University – imec](https://idlab.ugent.be/research-teams/discover).

## License

This project is licensed under the terms described in the [LICENSE](./LICENSE) file.

## Acknowledgements

This work has been partially supported by the [CRACY project](https://cra-cy.eu/), funded by the European Union’s Digital Europe Programme under grant agreement No 101190492.
