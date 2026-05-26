"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GeneratePanel } from "@/components/panels/generate-panel";
import { CompletenessPanel } from "@/components/panels/completeness-panel";
import { ValidatePanel } from "@/components/panels/validate-panel";
import { MergeAibomsPanel } from "@/components/panels/merge-aiboms-panel";
import { VulnScanPanel } from "@/components/panels/vuln-scan-panel";
import { api } from "@/lib/api";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { CheckCircle2, Info, Shield, FileText, Cpu, XCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export default function Home() {
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    api.health()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 shadow-md"
        style={{ backgroundColor: "#19224d" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          {/* CRACy logo */}
          <Image
            src="/cracy-blue-bg.png"
            alt="CRACy – CRA made easY"
            width={140}
            height={48}
            className="h-10 w-auto object-contain"
            priority
          />

          <Separator orientation="vertical" className="h-8 bg-white/20 hidden sm:block" />

          <div className="hidden sm:block">
            <p className="text-white font-semibold text-lg leading-tight tracking-tight">
              AIBoMGen - Dashboard
            </p>
            <p className="text-[#72caf0] text-xs font-medium">IDLab - imec, Ghent University</p>
          </div>

          {/* spacer */}
          <div className="ml-auto flex items-center gap-3">
            <code className="text-xs text-white/50 hidden md:inline">{API_URL}</code>
            <div className="text-xs">
              {healthy === null ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-white/30 text-white/70"
                >
                  Checking…
                </Badge>
              ) : healthy ? (
                <Badge
                  variant="outline"
                  className="gap-1 border-[#72caf0] text-[#72caf0]"
                >
                  <CheckCircle2 className="h-3 w-3" /> API online
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-1">
                  <XCircle className="h-3 w-3" /> API offline
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero strip ───────────────────────────────────────────── */}
      <div
        className="w-full border-b"
        style={{
          background: "linear-gradient(135deg, #19224d 0%, #243060 60%, #1b3a5c 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            AI Bill of Materials Generator
          </h1>
          <p className="mt-1 text-sm max-w-xl" style={{ color: "#a8c4d8" }}>
            Generate, assess completeness, validate, and merge CycloneDX-compliant AIBOMs
            for your Hugging Face AI/ML models, powered by{" "}
            <span style={{ color: "#72caf0" }} className="font-medium">AIBoMGen-cli</span>.
          </p>

          {/* What is an AIBOM? hover card */}
          <div className="mt-5">
            <HoverCard openDelay={100} closeDelay={150}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2"
                  style={{ borderColor: "rgba(114,202,240,0.5)", color: "#72caf0" }}
                >
                  <Info className="h-3.5 w-3.5" />
                  What is an AIBOM?
                </button>
              </HoverCardTrigger>

              <HoverCardContent
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-96 p-0 shadow-xl"
              >
                {/* Header */}
                <div className="rounded-t-md px-4 py-3" style={{ backgroundColor: "#19224d" }}>
                  <p className="text-sm font-semibold text-white">AI Bill of Materials (AIBOM)</p>
                  <p className="text-xs mt-0.5" style={{ color: "#72caf0" }}>
                    Your compliance starting point for the AI Act &amp; CRA
                  </p>
                </div>

                {/* Body */}
                <div className="px-4 py-4 space-y-3 text-sm">
                  <p className="text-muted-foreground leading-relaxed">
                    An <span className="font-semibold text-foreground">AIBOM</span> is a{" "}
                    <span className="font-semibold text-foreground">Software Bill of Materials (SBOM)</span>{" "}
                    extended with AI-specific metadata, covering the models, datasets, training
                    parameters, and licensing information that regulators and auditors need to see.
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-2.5">
                      <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#8D3688" }} />
                      <div>
                        <p className="font-medium text-foreground text-xs">EU AI Act &amp; CRA compliance</p>
                        <p className="text-xs text-muted-foreground">
                          High-risk AI systems must document components and supply chains.
                          An AIBOM gives you that documentation automatically.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <Cpu className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#72caf0" }} />
                      <div>
                        <p className="font-medium text-foreground text-xs">Built from real model metadata</p>
                        <p className="text-xs text-muted-foreground">
                          AIBoMGen pulls live data from the Hugging Face Hub: model cards,
                          dataset references, licence info, so your BOM reflects reality,
                          not guesswork.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2.5">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#19224d" }} />
                      <div>
                        <p className="font-medium text-foreground text-xs">CycloneDX format, industry standard</p>
                        <p className="text-xs text-muted-foreground">
                          Output is a machine-readable{" "}
                          <span className="font-mono text-xs">.cdx.json</span> file accepted
                          by existing SBOM toolchains, vulnerability scanners, and procurement workflows.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="rounded-md px-3 py-2 text-xs"
                    style={{ backgroundColor: "#eef8fd", color: "#19224d" }}
                  >
                    <span className="font-semibold">SME tip:</span> If you ship software that
                    includes an AI model (even a third-party one), you may be required to
                    declare it. Generate your AIBOM in seconds, free.
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList
            className="flex-wrap h-auto gap-1"
            variant="default"
          >
            {[
              { value: "generate",     label: "Generate" },
              { value: "completeness", label: "Completeness" },
              { value: "validate",    label: "Validate" },
              { value: "merge-aiboms", label: "Merge AIBOMs + SBOM" },
              { value: "vuln-scan",   label: "Vulnerability Scan" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Generate ─────────────────────────────────────────── */}
          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Generate AIBOMs</CardTitle>
                <CardDescription>
                  Fetch metadata from Hugging Face Hub for one or more model IDs and produce a
                  CycloneDX AIBOM per model.
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">POST /api/v1/generate</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneratePanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Completeness ─────────────────────────────────────── */}
          <TabsContent value="completeness">
            <Card>
              <CardHeader>
                <CardTitle>Completeness Assessment</CardTitle>
                <CardDescription>
                  Upload a CycloneDX AIBOM (generated by this dashboard or the cli tool) and receive a completeness score, missing required/optional
                  fields, and per-dataset breakdown.
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">POST /api/v1/completeness</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompletenessPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Validate ─────────────────────────────────────────── */}
          <TabsContent value="validate">
            <Card>
              <CardHeader>
                <CardTitle>BOM Validation</CardTitle>
                <CardDescription>
                  Run schema &amp; semantic validation on a CycloneDX AIBOM (generated by this dashboard or the cli tool) with configurable strictness
                  and minimum completeness thresholds.
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">POST /api/v1/validate</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValidatePanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Merge AIBOMs + SBOM ──────────────────────────────── */}
          <TabsContent value="merge-aiboms">
            <Card>
              <CardHeader>
                <CardTitle>Merge AIBOMs into SBOM</CardTitle>
                <CardDescription>
                  Recommended workflow for integrating AI/ML metadata into an existing software BOM.
                  Upload one SBOM and one or more AIBOMs (generated by this dashboard or the cli tool).
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">POST /api/v1/merge/aiboms-with-sbom</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MergeAibomsPanel />
              </CardContent>
            </Card>
          </TabsContent>
          {/* ── Vulnerability Scan ─────────────────────────────────────────── */}
          <TabsContent value="vuln-scan">
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Scan</CardTitle>
                <CardDescription>
                  Fetch per-file security scan results from the Hugging Face Hub for every model and
                  dataset component in an AIBOM. Scanners: Cisco ClamAV, ProtectAI, HuggingFace Pickle
                  Scanner, VirusTotal, and JFrog Research. Optionally inject findings back into the BOM
                  as CycloneDX Vulnerabilities.
                  <br />
                  <span className="font-mono text-xs text-muted-foreground">POST /api/v1/vuln-scan</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VulnScanPanel />
              </CardContent>
            </Card>
          </TabsContent>        </Tabs>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-xs text-center mb-4" style={{ color: "#58595B" }}>
            This project is part of the CRACY initiative, co-funded by the European Union.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <Image
              src="/eccc-logo.png"
              alt="European Cybersecurity Competence Centre"
              width={160}
              height={60}
              className="h-12 w-auto object-contain"
            />
            <Image
              src="/eu_co_funded_en.jpg"
              alt="Co-funded by the European Union"
              width={180}
              height={60}
              className="h-12 w-auto object-contain"
            />
            <Image
              src="/cracy-blue-bg.png"
              alt="CRACy – cra-cy.eu"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-center mt-4" style={{ color: "#58595B" }}>
            &copy; {new Date().getFullYear()} IDLab - imec, Ghent University.
          </p>
        </div>
      </footer>
    </div>
  );
}

