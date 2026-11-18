import { entrySchema, type Entry } from "../shared/contracts";

type CaseTranslation = Pick<Entry, "title" | "summary" | "problem" | "contribution" | "decisions" | "results" | "limits" | "tags"> & {
  evidenceLabels: Record<string, string>;
};

const translations: Record<string, CaseTranslation> = {
  fak: {
    title: "Website development: Kendo Federation",
    summary: "A bilingual institutional website that connects events, content, and publishing to make the federation’s site easier to maintain.",
    problem: "Updating events and galleries needed an alternative to editing each page by hand, with checks to prevent incomplete information from going live.",
    contribution: "I built the platform with React and TypeScript, from the initial Figma design through implementation, testing, and documentation. I built responsive components and added animations and transitions.",
    decisions: [
      "Use Calendar as the source, reading ICS over HTTP and transforming the events into site data.",
      "Validate before publishing by detecting malformed data, changes to past events, and large-scale removals. Keep the last valid version when checks fail.",
      "Use Playwright, visual regression tests, and axe-core to check the interface against WCAG 2.1 AA. Run type checks and tests in CI.",
      "Optimize WebP images and loading, review Core Web Vitals with Lighthouse and Screaming Frog audits, and generate HTML and metadata for each route.",
      "Require current approvals for sensitive changes and remove sensitive information from diagnostics.",
    ],
    results: "I completed the platform over four months in my spare time. Events and galleries update from their sources without manual edits to each page.",
    limits: "Scope covered the bilingual site, responsive components, event synchronization, galleries, and publishing checks.",
    tags: ["React", "TypeScript", "Automation", "Integration", "Data Quality", "QA", "Technical SEO"],
    evidenceLabels: { "fak-sitio": "Federation website.", "fak-codigo": "Platform source code and checks." },
  },
  "operacion-cms": {
    title: "AEM: templates, components, and content",
    summary: "Six years of AEM experience in the automotive sector, covering frontend work, editable content, and release review.",
    problem: "Launches and updates needed to meet brand, content, and functional requirements, including when changes touched existing code.",
    contribution: "As a Content Analyst from July 2019 to October 2025, I maintained Adobe Experience Manager experiences for the automotive sector. I fixed CSS and JavaScript and built layouts, marketing forms, and Vue components with animations and transitions. I reviewed content and assets before publication with QA, development, and marketing.",
    decisions: [
      "Review deliveries against designs and brand requirements, including responsive behavior and accessibility.",
      "Reproduce defects and document the environment so QA and development can coordinate fixes.",
      "Create reusable page structures and document how nontechnical users can manage their content.",
    ],
    results: "Content releases, campaign pages, interface improvements, and user documentation.",
    limits: "Scope covered frontend work, templates, components, forms, and content management in AEM.",
    tags: ["CMS", "AEM", "WordPress", "Templates", "Content management"],
    evidenceLabels: {},
  },
  "auditoria-datos": {
    title: "Data quality and review tools",
    summary: "Investigation of catalog errors and development of tools to prepare files, inspect XML, document audits, and extract products by ID.",
    problem: "Outdated or inaccurate records affected quality indicators. The team needed to distinguish data-loading errors from presentation issues.",
    contribution: "I led the investigation of .content.xml files, audited the full catalog, and classified the errors. I prepared test cases and shared findings with QA, development, and marketing.",
    decisions: [
      "Turn findings into validation criteria and train teams to review similar issues.",
      "ExcelBatch converts and reorganizes Excel files in batches before review.",
      "CleanTreeFlow transforms AEM XML structures into readable paths for inspection.",
      "Audit reports gather responsive screenshots and produce PDFs for review.",
      "A local product extractor prototype builds a product list from identifiers.",
    ],
    results: "The investigation supported data cleanup and expanded QA coverage.",
    limits: "My scope covered catalog investigation, error classification, and test cases. The QA Automation Lead implemented the automated tests using the context and cases I shared.",
    tags: ["Data Quality", "AEM", "XML", "QA"],
    evidenceLabels: { "excelbatch-code": "Macro source code.", "cleantree-code": "Python script and documentation." },
  },
  "portafolio-editorial": {
    title: "Portfolio: editorial workflow and CI/CD checks",
    summary: "Local implementation for preparing, reviewing, and publishing approved content, with type checks, tests, and separate builds for the site and Studio.",
    problem: "Separating private sources, drafts, and approved content required retaining revisions and verifying which version was prepared for publication.",
    contribution: "I defined the scope and reviewed iterations of a React and TypeScript site with a private panel, Workers, D1, and Drizzle. I integrated the editorial workflow with CI/CD checks to verify changes and prepare releases for review.",
    decisions: [
      "Generate the site from an approved snapshot and keep administration and queries private.",
      "Retain revisions, detect editing conflicts, and freeze the content and commit for each release.",
      "Limit the connector to reading approved local resources for queries.",
      "Check types, tests, and site and Studio builds before preparing a release, with human approval for publication.",
    ],
    results: "Local code with contract validation, editorial revisions, a connector, and separate builds for the site and panel.",
    limits: "Scope covered local implementation of the site, Studio, and editorial workflow with CI/CD checks. Remote operation and deployment of the editorial workflow remain pending.",
    tags: ["Automation", "Content", "Events", "Integration"],
    evidenceLabels: { "editorial-local": "Local implementation: source code, contracts, CI/CD configuration, and verification records. Remote operation pending." },
  },
};

export function translatedCase(entry: Entry): Entry | undefined {
  if (entry.kind !== "case" || !Object.hasOwn(translations, entry.id)) return undefined;
  const { evidenceLabels, ...copy } = translations[entry.id]!;
  return entrySchema.parse({
    ...entry,
    ...copy,
    evidence: entry.evidence.flatMap(item => {
      const label = evidenceLabels[item.id];
      return label ? [{ ...item, label }] : [];
    }),
  });
}
