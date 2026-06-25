# AI Initiatives 2026

Edit the JSON block below to change any initiative data, dimension levels, or tooltips.
Edit the markdown sections below the JSON block to change legend text.
Run `node build.js` to regenerate `index.html`.

```json
{
  "title": "AI Initiatives 2026",

  "dimensionLevels": {
    "tech":        ["Basic", "Moderate", "Advanced", "Cutting-Edge"],
    "data":        ["Ready", "Partial", "Scattered", "Scarce"],
    "integration": ["Minimal", "Moderate", "Heavy", "Extensive"],
    "org":         ["Low", "Medium", "High", "Transformational"],
    "time":        ["Short", "Medium", "Long", "Extended"],
    "dep":         ["Low", "Moderate", "High", "Critical"],
    "cost":        ["Marginal", "Moderate", "Significant", "Transformational"],
    "strategic":   ["Operational", "Tactical", "Strategic", "Game-Changing"]
  },

  "initiatives": [
    {
      "name": "Multi-Cloud FinOps Optimization (AI)",
      "featured": true,
      "scopeStyle": "s3",
      "scope": "AI εφαρμογή για έλεγχο & βελτιστοποίηση κόστους Multi-Cloud (optimal resource sizing & usage), πρόβλεψη δαπανών και οικονομική διακυβέρνηση, με ενιαίο Cost Control πίνακα για Azure/GCP/AWS.",
      "category": "FinOps & Cost",
      "categoryClass": "cat-finops",
      "teams": "RDNS, CCoE (Cloud & Cost Gov.)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "ML-driven cost forecasting across Azure/GCP/AWS requires custom pipelines and anomaly detection models across three separate cloud APIs." },
        "data":        { "level": 2, "tip": "Cloud billing data exists per provider but tagging is inconsistent; requires normalization into a unified multi-cloud cost schema." },
        "integration": { "level": 3, "tip": "Integrates Azure Cost Management, GCP Billing, AWS Cost Explorer, SNOW, and governance portals — 5+ distinct systems." },
        "org":         { "level": 2, "tip": "CCoE and RDNS must adopt new cost governance workflows and dashboards; moderate team adoption and process change required." },
        "time":        { "level": 2, "tip": "MVP cost dashboard achievable in 3–4 months; full ML optimization recommendations need additional model training cycles." },
        "dep":         { "level": 2, "tip": "Relies on stable cloud provider billing APIs; pricing model changes by Azure/GCP/AWS may require logic updates over time." },
        "cost":        { "level": 3, "tip": "Rightsizing and idle resource elimination typically yields 15–25% cloud spend reduction across all three cloud providers." },
        "strategic":   { "level": 3, "tip": "Multi-cloud cost governance is a C-level priority; positions IT as a financial accountability partner to all business units." }
      }
    },
    {
      "name": "Application & Identity Intelligence (AII)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Συνδυαστική AI λύση διαχείρισης δικαιωμάτων & αδειών, που φτιάχνει πίνακα Role-Based Access από AD/SNOW/SAP, εντοπίζει υπερβολικές/ανενεργές άδειες και προτείνει καθαρισμό, με εξοικονόμηση ~30–40% κόστους λογισμικού.",
      "category": "FinOps & Cost",
      "categoryClass": "cat-finops",
      "teams": "EUC (I&M, Licensing)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "Multi-source correlation across AD, SNOW, and SAP with ML-based permission scoring and overprivilege anomaly detection." },
        "data":        { "level": 3, "tip": "Access and license data spread across AD, SNOW, and SAP with inconsistent formats and no unified source of truth." },
        "integration": { "level": 3, "tip": "Deep integration with AD, SNOW, and SAP; each system requires custom connectors, data mapping, and reconciliation logic." },
        "org":         { "level": 3, "tip": "License cleanup affects business units and requires approval workflows; may face resistance from license owners across teams." },
        "time":        { "level": 3, "tip": "6–9 months for full integration, analysis pipeline, and governance workflows; early quick wins on obvious overprovisioning cases." },
        "dep":         { "level": 2, "tip": "Well-established enterprise systems; main risk is data quality and inconsistencies within AD/SAP rather than the technology itself." },
        "cost":        { "level": 3, "tip": "Initiative targets 30–40% software license cost reduction through systematic permission rightsizing and structured cleanup." },
        "strategic":   { "level": 2, "tip": "Addresses license cost and compliance with measurable KPI impact across teams; limited broader strategic positioning." }
      }
    },
    {
      "name": "Multi-Cloud Management Portal **(CloudOps Hub)**",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Portal ενιαίας διαχείρισης multi-cloud (Azure/GCP/AWS) με ενιαία ορατότητα σε resources/cost. Εντάχθηκε στο πλάνο 2026 ως concept (P3) – μελλοντικά θα ενσωματώσει AIOps αυτοματισμούς σε multi-cloud περιβάλλον.",
      "category": "FinOps & Cost",
      "categoryClass": "cat-finops",
      "teams": "CCoE, RDNS (Cloud Ops Gov.)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "Unified multi-cloud portal requires complex abstraction layers over three providers, plus future AIOps automation integration hooks." },
        "data":        { "level": 2, "tip": "Cloud resource data available via APIs; requires an aggregation layer and real-time metadata synchronization across all clouds." },
        "integration": { "level": 4, "tip": "Full-stack integration across Azure, GCP, and AWS: resources, costs, IAM policies, and automation triggers — 8+ systems." },
        "org":         { "level": 2, "tip": "New portal replaces existing per-cloud tooling workflows for CCoE and RDNS; moderate adoption effort across cloud teams." },
        "time":        { "level": 4, "tip": "Listed as P3 concept for 2026; full delivery with AIOps integration realistically requires 12+ months of phased development." },
        "dep":         { "level": 3, "tip": "Long-term commitment to multi-cloud vendor APIs; roadmap changes by Azure/GCP/AWS create ongoing maintenance and adaptation risk." },
        "cost":        { "level": 2, "tip": "Operational efficiency and tooling consolidation; not a direct cost reduction — savings are indirect through reduced tooling sprawl." },
        "strategic":   { "level": 3, "tip": "Single pane of glass for multi-cloud governance is a foundational capability for scalable, compliant cloud operations at scale." }
      }
    },
    {
      "name": "AI in Solution Design **(Idea-to-Terraform)**",
      "featured": true,
      "scopeStyle": "s3",
      "scope": "Πρόταση (Workshop 2025): AI agent που μετατρέπει μια ιδέα σε cloud υλοποίηση (από requirements σε αρχική αρχιτεκτονική και κώδικα Infrastructure-as-Code), μειώνοντας τον χρόνο σχεδιασμού & ανάπτυξης.",
      "category": "Governance & Delivery",
      "categoryClass": "cat-governance",
      "teams": "CCoE, RDNS (Cloud Arch. Design)",
      "dimensions": {
        "tech":        { "level": 4, "tip": "AI agent translating natural language to architecture diagrams and IaC code is at the current frontier of applied AI research." },
        "data":        { "level": 3, "tip": "Past architectural designs and Terraform templates are not systematically catalogued; training data is sparse and unstructured." },
        "integration": { "level": 2, "tip": "Connects to design tools, Terraform, and cloud provider APIs; fewer systems but the AI agent layer adds significant architectural complexity." },
        "org":         { "level": 3, "tip": "Fundamentally changes how architects and engineers approach solution design; requires deep cultural shift and workflow adoption." },
        "time":        { "level": 3, "tip": "Workshop 2025 proposal; 6–9 months to a functional MVP; full reliability of generated IaC for production use takes considerably longer." },
        "dep":         { "level": 3, "tip": "Depends on advanced LLM maturity and prompt engineering; non-deterministic output quality is an inherent and ongoing challenge." },
        "cost":        { "level": 2, "tip": "Reduces architecture design and IaC coding time significantly; real savings but difficult to quantify precisely upfront." },
        "strategic":   { "level": 3, "tip": "Accelerates cloud adoption velocity and removes design bottlenecks; strong competitive differentiator if proven reliable in practice." }
      }
    },
    {
      "name": "Conversational IT Assistant (Virtual Agent)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Ψηφιακός IT βοηθός (chatbot) στο MS Teams για αυτόματη επίλυση συχνών αιτημάτων υποστήριξης (MFA reset, VPN, κ.λπ.) εντός ~3′ με live εκτέλεση ενεργειών (Azure AD, SNOW API).",
      "category": "IT Ops & Service Mgmt",
      "categoryClass": "cat-itops",
      "teams": "EUC (Service Desk Ops)",
      "dimensions": {
        "tech":        { "level": 2, "tip": "Chatbot with NLP over known request types using mature frameworks (MS Bot Framework, Azure OpenAI) — well-proven technology stack." },
        "data":        { "level": 2, "tip": "KB articles exist but need structuring for RAG; intent training data must be curated and labelled from historical ticket content." },
        "integration": { "level": 3, "tip": "MS Teams, Azure AD, SNOW API, VPN systems, and MFA tools; each action type requires dedicated API integration and end-to-end testing." },
        "org":         { "level": 2, "tip": "Service desk workflow changes required; agents need retraining and end users must trust the bot for sensitive actions like MFA reset." },
        "time":        { "level": 1, "tip": "MVP covering top 5 request types (MFA reset, VPN) achievable in 2–3 months — one of the fastest paths to visible IT value." },
        "dep":         { "level": 2, "tip": "MS Teams, Azure AD, and SNOW are stable enterprise platforms; technology risk is low and vendor ecosystem is well established." },
        "cost":        { "level": 2, "tip": "Estimated 30–50% L1 ticket deflection; frees service desk agents to focus on higher-complexity and higher-value issues." },
        "strategic":   { "level": 2, "tip": "Measurable ticket deflection rate and faster resolution times provide a clear and visible IT value delivery story to management." }
      }
    },
    {
      "name": "AI Ticket Intelligence (Smart Triage & RCA)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Ευφυής μηχανή NLP & ML που διαβάζει νέα tickets και τα ταξινομεί/αναθέτει αυτόματα σε σωστή ομάδα, αναγνωρίζει επαναλαμβανόμενα incidents (outbreaks) & προτείνει πιθανή βασική αιτία (RCA).",
      "category": "IT Ops & Service Mgmt",
      "categoryClass": "cat-itops",
      "teams": "EUC (Service Desk), NOC",
      "dimensions": {
        "tech":        { "level": 3, "tip": "NLP classification and ML-based RCA pattern recognition require custom model training on historical SNOW ticket corpus." },
        "data":        { "level": 1, "tip": "SNOW contains years of well-structured, labelled ticket history — an ideal and rich dataset for supervised ML model training." },
        "integration": { "level": 2, "tip": "Primarily SNOW integration for reading and updating tickets; routing rules and team configuration settings also needed." },
        "org":         { "level": 2, "tip": "Changes how triage teams operate; some resistance expected from agents accustomed to manual review and assignment processes." },
        "time":        { "level": 2, "tip": "3–5 months for an initial NLP classifier; RCA pattern detection needs additional data volume and iterative model tuning cycles." },
        "dep":         { "level": 1, "tip": "SNOW data is stable and richly labelled; NLP classification is a proven and mature ML technique with many available off-the-shelf tools." },
        "cost":        { "level": 2, "tip": "Faster routing reduces average resolution time; outbreak detection prevents repeat incident escalation and associated business costs." },
        "strategic":   { "level": 2, "tip": "MTTR reduction and service quality improvements are measurable operational KPIs with a clear and quantifiable IT performance story." }
      }
    },
    {
      "name": "AI Staff Skills Intelligence **(Skills Gap Analysis)**",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "AI ανάλυση ιστορικών tickets & επιδόσεων, δημιουργία προφίλ δεξιοτήτων ανά technical agent, εντοπισμός κενών δεξιοτήτων & μονοσήμαντων γνώσεων και σύσταση κατάλληλων trainings για ομάδες.",
      "category": "IT Ops & Service Mgmt",
      "categoryClass": "cat-itops",
      "teams": "EUC (IT Support & HR)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "Skill profiling from unstructured ticket text requires NLP and unsupervised ML clustering to extract meaningful competency signals." },
        "data":        { "level": 2, "tip": "Ticket data is rich in SNOW; performance and HR data may be in separate systems with strict access restrictions and governance controls." },
        "integration": { "level": 2, "tip": "SNOW and HR/LMS system integration; sensitive data access requires governance approvals that may delay implementation timeline." },
        "org":         { "level": 3, "tip": "Skill gap findings touch HR processes, training budgets, and performance management — requiring multi-stakeholder alignment and buy-in." },
        "time":        { "level": 3, "tip": "6–9 months for reliable skill profiles; actionable training recommendations require an additional validation and cross-team review cycle." },
        "dep":         { "level": 2, "tip": "Depends on HR system integration access; organizational sensitivity around performance data can significantly slow project progress." },
        "cost":        { "level": 1, "tip": "Indirect savings through better training ROI and reduced skill-gap incidents; direct cost impact is difficult to quantify upfront." },
        "strategic":   { "level": 2, "tip": "Improves team capability and reduces single-point-of-knowledge risk; beneficial for team resilience and long-term staff retention." }
      }
    },
    {
      "name": "Incident Command & War Room (Accenture)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Πρόταση Accenture: Συντονισμός AI πρακτόρων για αυτόματη διαχείριση κρίσιμων συμβάντων (critical incidents) σε Cloud/Δίκτυο. AI agents συνεργάζονται για ταχεία επίλυση ενός major incident — μειωμένος χρόνος impact σε κρίσεις.",
      "category": "IT Ops & Service Mgmt",
      "categoryClass": "cat-itops",
      "teams": "CCoE, NCoE (IT Ops Teams)",
      "dimensions": {
        "tech":        { "level": 4, "tip": "Multi-agent AI coordination for real-time critical incident management is at the frontier of applied AI and autonomous agent research." },
        "data":        { "level": 3, "tip": "Incident data spread across cloud monitoring platforms, network tools, SNOW, and communication logs — no unified real-time view exists." },
        "integration": { "level": 4, "tip": "Cloud platforms, network monitoring, SNOW, MS Teams, and runbook execution systems all required — 8+ system integrations minimum." },
        "org":         { "level": 4, "tip": "Transforms the entire incident response culture; requires organizational trust in AI making autonomous decisions during production crises." },
        "time":        { "level": 4, "tip": "Multi-agent coordination at enterprise scale needs 12–18 months with Accenture support; architectural unknowns add significant risk." },
        "dep":         { "level": 4, "tip": "Accenture external proposal with cutting-edge multi-agent technology; many architectural unknowns and very high vendor dependency." },
        "cost":        { "level": 3, "tip": "Faster resolution of major incidents translates directly to reduced business continuity costs and minimized outage business impact." },
        "strategic":   { "level": 3, "tip": "Business continuity and brand risk mitigation during major incidents are board-level concerns with very high executive visibility." }
      }
    },
    {
      "name": "AI Knowledge Base Intelligence **(Auto-KB Mgmt)**",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Αυτοματοποιεί τη δημιουργία & συντήρηση του IT Knowledge Base: παράγει άρθρα γνώσης από resolved tickets & chatbot διαλόγους, κατηγοριοποιεί & συγχωνεύει παρόμοια, αποσύρει ξεπερασμένα περιεχόμενα.",
      "category": "Knowledge & Assistants",
      "categoryClass": "cat-knowledge",
      "teams": "EUC (Knowledge Mgmt)",
      "dimensions": {
        "tech":        { "level": 2, "tip": "NLP for article generation and classification uses mature techniques (summarization, clustering) on well-structured SNOW ticket data." },
        "data":        { "level": 1, "tip": "Resolved tickets and chatbot logs are available, well-structured, and contain rich content ideal for automatic KB article generation." },
        "integration": { "level": 1, "tip": "Primarily the SNOW KB module; chatbot log integration is straightforward — minimal overall system footprint and few dependencies." },
        "org":         { "level": 1, "tip": "IT-internal knowledge team workflow improvement with minimal impact on end users or other business teams outside IT." },
        "time":        { "level": 1, "tip": "MVP for automatic article drafting from resolved tickets achievable in 6–8 weeks — the fastest path to ROI in this initiative list." },
        "dep":         { "level": 1, "tip": "SNOW data is stable and accessible; NLP summarization is a solved engineering problem with many proven off-the-shelf tooling options." },
        "cost":        { "level": 1, "tip": "Reduces manual KB authoring time for the knowledge team; efficiency gain is real but scoped entirely within IT operations." },
        "strategic":   { "level": 1, "tip": "Better self-service KB content reduces repeat support tickets; a foundational enabler for chatbot accuracy but limited strategic reach." }
      }
    },
    {
      "name": "Knowledge & Document Intelligence (Accenture)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Πρόταση Accenture: AI υπηρεσία ανάκτησης γνώσης από εταιρικά έγγραφα (wiki, SharePoint) σε real-time: θρέφει R&D και Service Desk με απαντήσεις μέσω AI (RAG) για τεχνικές απορίες/λύσεις.",
      "category": "Knowledge & Assistants",
      "categoryClass": "cat-knowledge",
      "teams": "RDNS, EUC (R&D, Service Desk)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "RAG system over heterogeneous enterprise documents with semantic search and answer synthesis — architecturally solid but operationally complex." },
        "data":        { "level": 3, "tip": "Documents span SharePoint, wiki, and email archives in varied formats, inconsistent quality, and complex access control policies." },
        "integration": { "level": 3, "tip": "SharePoint, Confluence/wiki, SNOW, and R&D systems; document permissions and access control management adds considerable complexity." },
        "org":         { "level": 2, "tip": "New query-based knowledge retrieval workflow for R&D and service desk; adoption curve expected over 2–3 months post-launch." },
        "time":        { "level": 2, "tip": "4–6 months for RAG MVP over key document sources; expanding to the full document corpus requires additional implementation sprints." },
        "dep":         { "level": 3, "tip": "Accenture proposal adds delivery risk; RAG infrastructure with vector databases introduces architectural complexity and potential vendor lock-in." },
        "cost":        { "level": 2, "tip": "Faster knowledge retrieval measurably reduces research and troubleshooting time for R&D teams and service desk agents." },
        "strategic":   { "level": 2, "tip": "R&D and service desk efficiency gains are quantifiable; strong tactical KPI story with visible cross-team productivity impact." }
      }
    },
    {
      "name": "AI-Driven Network Operations (NetOps AIOps)",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Εφαρμογή AI/ML στη λειτουργία δικτύων: αυτόνομο NetOps (ανωμαλίες, predictive maintenance, RCA, βελτιστοποίηση επιδόσεων, noise reduction) με dashboards & αυτοματισμούς.",
      "category": "Observability & AIOps",
      "categoryClass": "cat-observ",
      "teams": "NCoE, NOC, CCoE (Δίκτυα & Cloud Ops)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "ML-based anomaly detection, predictive failure modeling, and autonomous RCA on high-volume real-time network telemetry streams." },
        "data":        { "level": 2, "tip": "Network metrics exist in monitoring tools but require normalization, historical anomaly labelling, and a real-time streaming data pipeline." },
        "integration": { "level": 3, "tip": "Network monitoring platforms (SolarWinds/PRTG), NOC dashboards, alerting systems, and network automation tools all require integration." },
        "org":         { "level": 3, "tip": "Shifts NOC from reactive to proactive operations; changes on-call procedures, alert handling culture, and team skill requirements significantly." },
        "time":        { "level": 3, "tip": "6–10 months for anomaly detection MVP; predictive maintenance models require longer training periods and careful accuracy validation." },
        "dep":         { "level": 2, "tip": "Network monitoring vendors are stable; ML model accuracy is dependent on data labelling quality and historical incident coverage depth." },
        "cost":        { "level": 2, "tip": "Reduces unplanned downtime costs through proactive intervention; maintenance scheduling efficiency also contributes meaningful savings." },
        "strategic":   { "level": 3, "tip": "Proactive network reliability positions IT as a strategic enabler; builds the AIOps foundation for broader organizational use cases." }
      }
    },
    {
      "name": "Enterprise Observability & AIOps",
      "featured": true,
      "scopeStyle": "s3",
      "scope": "Ενιαία πλατφόρμα παρατηρησιμότητας E2E: συγκέντρωση metrics από όλα τα συστήματα (endpoint–cloud), για προδραστική ορατότητα και βάση για μελλοντική αυτόνομη λειτουργία (AIOps).",
      "category": "Observability & AIOps",
      "categoryClass": "cat-observ",
      "teams": "CCoE, RDNS (Cloud/Infra)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "E2E observability with ML-powered correlation across endpoints, cloud, network, and application telemetry is a major engineering effort." },
        "data":        { "level": 2, "tip": "Metrics exist across infrastructure silos (EUC, cloud, network) but unification requires significant data engineering and ETL work." },
        "integration": { "level": 4, "tip": "All infrastructure domains in scope: endpoints, Azure/GCP/AWS cloud, network, applications, databases — the widest integration surface of all initiatives." },
        "org":         { "level": 3, "tip": "Requires cross-team alignment across CCoE, RDNS, and EUC on shared observability standards, tooling, and dashboard governance." },
        "time":        { "level": 4, "tip": "Full E2E coverage requires 12–18 months; iterative domain-by-domain rollout provides partial value earlier in the delivery timeline." },
        "dep":         { "level": 2, "tip": "Observability platforms (Datadog, Dynatrace) are mature and proven; multi-domain integration complexity is the primary delivery risk." },
        "cost":        { "level": 2, "tip": "Proactive incident prevention reduces outage costs; exact savings are context-dependent and difficult to forecast with precision upfront." },
        "strategic":   { "level": 4, "tip": "Foundational platform enabling all future AIOps initiatives; transforms IT from reactive to predictive — a fundamental operating model shift." }
      }
    },
    {
      "name": "Platform Self-Healing & SRE",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "Πρόταση Accenture: AI αυτόματη επιδιόρθωση σφαλμάτων στη Cloud πλατφόρμα (SRE), χωρίς ανθρώπινη παρέμβαση: εκτέλεση αυτόνομων runbooks (Ansible, Azure Automation) για self-healing.",
      "category": "Observability & AIOps",
      "categoryClass": "cat-observ",
      "teams": "CCoE (Cloud Ops & SRE)",
      "dimensions": {
        "tech":        { "level": 4, "tip": "Autonomous AI-driven runbook execution and self-healing without human intervention is leading-edge SRE and MLOps practice." },
        "data":        { "level": 2, "tip": "Runbooks exist largely as manual documents; they must be codified, tested, and validated before they can be safely AI-triggered in production." },
        "integration": { "level": 3, "tip": "Ansible, Azure Automation, cloud platform APIs, incident management systems, and alerting pipelines all require deep integration." },
        "org":         { "level": 4, "tip": "Redefines the SRE role from manual responder to automation overseer; requires strong organizational trust in autonomous production actions." },
        "time":        { "level": 4, "tip": "Depends on mature Enterprise Observability as a prerequisite; realistic minimum delivery is 12–18 months from today given current maturity." },
        "dep":         { "level": 4, "tip": "Accenture proposal with high operational risk; autonomous remediation in production requires extensive safety validation and robust fallback design." },
        "cost":        { "level": 3, "tip": "Autonomous incident resolution dramatically reduces MTTR and on-call labor costs; high ROI once operational and organizationally trusted." },
        "strategic":   { "level": 4, "tip": "Autonomous cloud operations is the long-term IT vision; this initiative transforms the IT operating model at its most fundamental level." }
      }
    },
    {
      "name": "AI για EUC Security & Compliance",
      "featured": false,
      "scopeStyle": "s3",
      "scope": "AI agent για real-time έλεγχο συμμόρφωσης στα endpoints: ανιχνεύει αυτόματα παραβάσεις πολιτικών ασφαλείας (π.χ. ρυθμίσεις PC) και ειδοποιεί ή αποτρέπει μη εγκεκριμένες ενέργειες στην πηγή.",
      "category": "Security & Risk",
      "categoryClass": "cat-security",
      "teams": "EUC (Πολιτικές IT & Security)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "Real-time policy compliance engine scanning endpoint configurations and autonomously blocking violations — proven approach but operationally complex." },
        "data":        { "level": 2, "tip": "Endpoint telemetry available via MDM/Intune; compliance policy rules must be carefully encoded and kept continuously updated as policies evolve." },
        "integration": { "level": 2, "tip": "Endpoint management (Intune/SCCM), security policy engine, alerting, and reporting systems — a moderate and manageable integration footprint." },
        "org":         { "level": 3, "tip": "Automated enforcement changes end-user experience significantly; requires a clear IT policy governance framework and proactive communication plan." },
        "time":        { "level": 2, "tip": "3–5 months for MVP compliance scanning and alerting; autonomous blocking capability requires additional testing and phased validation." },
        "dep":         { "level": 2, "tip": "Relies on MDM/Intune and established security tooling vendors; well-established but requires deep policy and compliance domain expertise." },
        "cost":        { "level": 2, "tip": "Reduces compliance audit effort and violation remediation costs; helps avoid regulatory penalties in security-audited environments." },
        "strategic":   { "level": 3, "tip": "Regulatory compliance and security risk reduction align directly with legal, audit, and board-level risk management priorities." }
      }
    },
    {
      "name": "VIP Intelligence Suite **(Προληπτική VIP Υποστ.)**",
      "featured": false,
      "scopeStyle": "s4",
      "scope": "*Σουίτα AI για VIP υποστήριξη: Risk Radar (προληπτικά alerts πριν κρίσιμα events), Digital Twin περιβάλλοντος VIP, _μετάφραση τεχνικών θεμάτων σε απλή γλώσσα, προληπτικά IT check-ins πριν από σημαντικά meetings._",
      "category": "Security & Risk",
      "categoryClass": "cat-security",
      "teams": "EUC (VIP IT Support)",
      "dimensions": {
        "tech":        { "level": 3, "tip": "Multi-component suite combining Risk Radar, Digital Twin, NLP translation, and proactive monitoring — high overall implementation complexity." },
        "data":        { "level": 2, "tip": "VIP calendar and meeting data accessible; historical IT issue data specific to VIP users requires a dedicated and separate collection setup." },
        "integration": { "level": 3, "tip": "Calendar systems (O365/Exchange), IT monitoring platforms, MS Teams, communication tools, and VIP endpoint telemetry all require integration." },
        "org":         { "level": 2, "tip": "VIP support team workflow changes meaningfully; stakeholder management with C-suite adds political sensitivity and approval complexity." },
        "time":        { "level": 3, "tip": "Full suite requires 6–10 months; individual components (Risk Radar first) can be delivered incrementally for earlier demonstrable value." },
        "dep":         { "level": 3, "tip": "Multi-component architecture with several integrations; C-suite involvement raises delivery stakes and increases visibility of any delays." },
        "cost":        { "level": 1, "tip": "VIP satisfaction and reputational benefit are hard to quantify in direct cost terms; goodwill with C-suite carries real but intangible value." },
        "strategic":   { "level": 3, "tip": "C-suite IT experience directly shapes executive perception of IT investment; high political visibility and significant organizational influence." }
      }
    }
  ]
}
```

---

## Complexity Dimensions

*Purple headers — lower level = easier to deliver.*

### Tech. Complexity
ML/AI sophistication, custom model requirements, infrastructure needed.
- **Basic** — off-the-shelf tools, no custom ML
- **Moderate** — standard ML frameworks, limited custom work
- **Advanced** — custom ML models, complex data pipelines
- **Cutting-Edge** — multi-agent systems, frontier AI research

### Data Readiness
Availability, quality, and accessibility of the data the initiative depends on.
- **Ready** — data exists, clean, immediately accessible
- **Partial** — data exists but needs cleansing or consolidation
- **Scattered** — data spread across silos, significant prep required
- **Scarce** — key data not yet collected or very hard to access

### Integration
Number of systems and APIs that need to be connected.
- **Minimal** — 1–2 systems
- **Moderate** — 3–4 systems
- **Heavy** — 5–7 systems
- **Extensive** — 8+ systems / enterprise-wide

### Org. Change
Process disruption, stakeholder alignment, and user adoption effort required.
- **Low** — IT-internal, minimal process change
- **Medium** — some workflow changes, moderate stakeholder management
- **High** — significant process redesign, broad adoption effort
- **Transformational** — org-wide cultural and process transformation

### Time to Value
Estimated delivery timeline to a working MVP.
- **Short** — < 3 months
- **Medium** — 3–6 months
- **Long** — 6–12 months
- **Extended** — 12+ months

### Dep. Risk
Reliance on external vendors, third-party proposals, or immature technologies.
- **Low** — internal capabilities, proven mature tech
- **Moderate** — some vendor dependency, stable tools
- **High** — significant vendor or external proposal dependency
- **Critical** — immature tech, key external vendors, many unknowns

---

## Business Value Dimensions

*Green headers — higher level = greater value delivered.*

### Cost Impact
Direct cost savings or avoidance expected from the initiative.
- **Marginal** — < 5% cost reduction or hard to quantify
- **Moderate** — 5–15% cost reduction or avoidance
- **Significant** — 15–30% cost reduction
- **Transformational** — > 30% cost reduction or major new efficiency

### Strategic Impact
Breadth and depth of organizational impact beyond cost.
- **Operational** — efficiency gains within IT only
- **Tactical** — cross-team improvements, measurable KPI impact
- **Strategic** — competitive advantage, executive visibility
- **Game-Changing** — industry differentiation, fundamental operating model shift
