# Static Ontology Manager — Requirements and Use Cases

Status: Draft for review before implementation.

## 1. Objective

Build a static, single-page web application for creating, exploring, editing, and exporting an ontology. The app runs entirely in the browser and can be published on GitHub Pages. Users own their data and can work without an account or backend.

This document defines the proposed first release. No application implementation is included in this phase.

## 2. Assumptions and scope

- The initial product is a general-purpose ontology editor for concepts, typed relationships, and instances.
- A concept represents a class or category; an instance represents an individual belonging to one or more concepts.
- An ontology includes its vocabulary, hierarchy, relationship definitions, and assertions.
- The first release uses a documented, versioned JSON format. It does not claim RDF, OWL, or other semantic-web compatibility.
- One ontology is open at a time. Users switch documents by exporting, creating, or importing files.
- Editing is local to the current browser. Publishing the app does not publish a user's ontology or edits.
- A single page may contain panels, tabs, dialogs, and multiple views. It does not have to be a single source file.
- Desktop is the primary editing environment; essential browsing and editing must also work on mobile.

These assumptions are proposed defaults, not confirmed domain requirements. Section 14 lists the decisions to resolve before implementation.

## 3. Users and outcomes

| User | Need | Successful outcome |
| --- | --- | --- |
| Ontology author | Define and maintain a shared vocabulary | A consistent ontology that can be saved and exchanged |
| Domain expert | Understand how concepts relate | Searchable definitions, hierarchy, and relationship views |
| Reviewer | Identify gaps and inconsistencies | Actionable validation results linked to affected records |
| Recipient | Open an ontology someone shared | Import a file and inspect it without installing software |

## 4. Release boundaries

### Required for the first release

- Ontology metadata and document lifecycle.
- Concept hierarchy with multiple parents.
- Relationship types and directed assertions.
- Instances with concept membership.
- Search, filtering, hierarchy navigation, and a relationship graph.
- Validation, safe deletion, and undo/redo.
- Local persistence and JSON import/export.
- Responsive, keyboard-accessible interface.
- Static deployment under a GitHub Pages repository subpath.

### Outside the first release

- Accounts, permissions, real-time collaboration, and server synchronization.
- Editing GitHub repository files or making commits from the browser.
- Formal OWL reasoning, RDF/Turtle import/export, SPARQL, and semantic inference.
- Arbitrary property schemas, cardinality constraints, and custom datatype systems.
- AI generation, external integrations, and remote ontology fetching.
- Ontology merging, version comparison, and multiple-document libraries.
- Required offline installation or service-worker caching. An already loaded app must support local editing without network requests.

## 5. Data model

All records use stable, opaque string IDs. Labels can change without breaking references. IDs are unique across the document and are never derived from labels.

| Record | Required fields | Optional fields |
| --- | --- | --- |
| Ontology | `schemaVersion`, `id`, `title`, `createdAt`, `updatedAt`, entity arrays | `description`, `namespace`, `ontologyVersion`, `language` |
| Concept | `id`, `label`, `parentIds` | `description`, `aliases`, `tags` |
| Relationship type | `id`, `label`, `sourceKind`, `targetKind` | `description` |
| Instance | `id`, `label`, `conceptIds` | `description`, `aliases`, `tags` |
| Assertion | `id`, `typeId`, `sourceId`, `targetId` | `description` |

### Data semantics

- Entity arrays are `concepts`, `relationshipTypes`, `instances`, and `assertions`. Empty arrays are valid.
- `schemaVersion` identifies the file structure; the initial value is `1`. `ontologyVersion` is a user-maintained descriptive version.
- Dates use UTC ISO 8601 strings. Creation dates remain stable; successful content changes update the document modification date.
- Required labels and titles must contain non-whitespace text. Stored values are trimmed.
- Optional arrays default to empty arrays; optional text defaults to an empty string when omitted.
- A concept can have zero or more parents. Zero parents means a root concept.
- The hierarchy is a directed acyclic graph. A concept cannot be its own ancestor.
- An instance must reference at least one existing concept. Membership in ancestor concepts can be displayed as derived information but is not written as explicit membership.
- Relationship endpoint kinds are `concept`, `instance`, or `either`. An assertion must respect its type's endpoint kinds.
- Assertions are directed. Reciprocal relationships require a separate assertion. No transitivity or symmetry is inferred.
- An exact duplicate `(typeId, sourceId, targetId)` assertion is invalid. Self-referencing assertions are allowed; hierarchy self-links are not.
- Duplicate labels are allowed with a warning; selectors show record kind and ID when needed to distinguish them.
- Namespace is optional descriptive metadata, not a claim that entity IDs are globally resolvable IRIs.
- Descriptions are plain text. Embedded markup or scripts must never execute.
- View state, graph positions, and panel preferences are stored separately from ontology content and are not included in the JSON export.

## 6. Functional requirements

### FR-01 — Create and manage a document

- Create an empty ontology with a title and optional metadata.
- Edit metadata without changing document identity.
- Show the active document title, counts, save status, and validation summary.
- New document and example-loading actions must offer an export before replacing the current document, or require explicit confirmation to discard it.
- Provide an explicitly loaded, small fictional example covering concepts, multiple parents, instances, and assertions.

### FR-02 — Manage concepts

- Create, inspect, edit, and delete concepts, including descriptions, aliases, and tags.
- Add and remove multiple parent links using searchable selectors.
- Reject hierarchy cycles before applying changes and explain which link causes the cycle.
- Display ancestors, direct children, direct instances, and incoming/outgoing assertions.
- Removing a parent link must preserve the concept and its other relationships.

### FR-03 — Manage relationship types and assertions

- Create and edit relationship types, including allowed endpoint kinds.
- Create assertions from an entity detail panel or a dedicated form.
- Offer only compatible endpoint records and validate the selection again on submission.
- Display relationship direction and type in graph and list views.
- Block endpoint-kind changes that would invalidate existing assertions and list the affected assertions.

### FR-04 — Manage instances

- Create, inspect, edit, and delete instances.
- Assign an instance to one or more concepts using searchable selectors.
- Distinguish explicit concept membership from any displayed inherited membership.
- Show incoming and outgoing assertions on the instance detail panel.

### FR-05 — Explore and search

- Provide concept hierarchy, entity list, and graph views of the same document.
- Search labels, aliases, descriptions, and tags case-insensitively.
- Filter by entity kind, tag, and relationship type where applicable.
- Selecting a result opens its details and highlights it in the relevant view.
- In the hierarchy, show multi-parent concepts in each applicable branch while editing the same underlying record.
- Provide clear empty and no-results states, including a way to reset filters.
- Support graph pan, zoom, fit-to-view, and selected-entity neighborhood exploration.
- Distinguish hierarchy edges, membership edges, and assertions through labels or line styles as well as color.
- List and detail views must expose the same relationships without requiring graph interaction.

### FR-06 — Validate content

- Validate individual edits immediately and validate the full document on import and on demand.
- Errors include missing required fields, duplicate IDs, dangling references, hierarchy cycles, invalid memberships, incompatible endpoints, and duplicate assertions.
- Warnings include duplicate labels and missing descriptions. Isolated concepts are allowed.
- Validation results include severity, an understandable explanation, and a navigable record or field reference when one exists.
- Invalid edits must not partially modify the document. Warnings do not prevent saving or exporting valid content.

### FR-07 — Delete safely

- Show the exact impact before deleting a referenced record.
- Deleting a concept removes its parent links from children and its memberships from instances; it does not delete children or instances automatically.
- If concept deletion would leave an instance without membership, block deletion until that instance is reassigned or explicitly deleted.
- Deleting an entity removes its attached assertions only after the user confirms the impact.
- Deleting a relationship type with assertions offers cancellation or explicit deletion of the type and its assertions.
- Apply each confirmed deletion and its dependent changes as one undoable transaction.

### FR-08 — Undo and redo

- Support undo and redo for content changes during the current editing session, with at least 50 transactions.
- Support toolbar controls and platform-appropriate keyboard shortcuts. Native text-field undo must continue working while typing.
- A new edit clears the redo stack. Selection, filtering, and graph movement do not create content history entries.
- Reset history after creating or importing a different document. History does not need to survive reloads.

### FR-09 — Save locally and recover

- Automatically persist committed changes in browser storage, including after undo/redo.
- Restore the last successfully persisted document on reload after validating the saved structure.
- Distinguish saving, saved locally, and save-failed states. Never display saved status before storage succeeds.
- If storage is unavailable or full, keep the in-memory document editable and provide a visible export action.
- Detect a newer local revision from another tab; pause writes in the stale tab and offer reload or export of its in-memory document. Do not silently overwrite changes.
- Corrupt saved content must not be silently discarded or overwritten. Offer a raw recovery download when possible, followed by an explicit reset action.
- Explain that local browser storage is not a backup and that clearing site data can remove the document.

### FR-10 — Import and export

- Import a local `.json` file through a file picker; drag-and-drop is optional.
- Parse and validate imports in a temporary document before replacing the active one.
- An unsuccessful import leaves the current document unchanged and presents actionable errors.
- Reject unsupported schema versions and unrecognized content fields with clear diagnostics, preventing silent loss of data from unsupported extensions.
- After successful validation, show document title and record counts and ask the user to confirm replacement; offer export of the current document.
- Export the complete ontology as UTF-8, formatted JSON with a sanitized filename based on its title.
- Export must preserve IDs, text, hierarchy, memberships, relationship types, assertions, and metadata exactly. Exporting alone does not modify content or timestamps.
- Export/import round trips must preserve semantic content. Export must work even if browser persistence fails.
- Proposed import limit: 10 MiB. Reject larger files before parsing with an understandable message.

## 7. Interface requirements

- Header: document title, save status, new, import, export, undo/redo, and validation controls.
- Navigation panel: search, filters, hierarchy, and entity-type navigation.
- Main panel: selected list or graph view, with visible view-switching controls.
- Detail panel: selected record information, relationships, editing controls, and delete action.
- Settings or metadata dialog: ontology metadata and local-storage information.
- Mobile layout: stack or switch panels without hiding core commands; no required hover-only interactions.
- Every form has clear labels, required-field indicators, inline errors, submit, and cancel.
- Canceling a form leaves the document unchanged. Navigating away from an unsubmitted form prompts to save or discard that form.
- Confirmations explain the specific operation and affected records rather than using generic warnings.

## 8. Use cases and acceptance scenarios

| ID | Use case | Main flow and expected result | Alternative or failure behavior |
| --- | --- | --- | --- |
| UC-01 | Start an ontology | Create a document, enter a title, add metadata; a valid empty ontology opens and is saved locally | Blank title is rejected; replacing existing work requires confirmation |
| UC-02 | Build a hierarchy | Create `Asset`, `Digital asset`, and `Dataset`; connect child concepts to parents | A link making `Asset` a descendant of `Dataset` is rejected without mutation |
| UC-03 | Use multiple inheritance | Give `Dataset` two parents; it appears under both and edits are reflected in both branches | Removing one parent preserves the other and the concept itself |
| UC-04 | Define a relationship | Create `depends on` with concept endpoints and assert that one concept depends on another | Instance endpoints and exact duplicate assertions are rejected |
| UC-05 | Add an instance | Create `Customer dataset`, assign it to `Dataset`, and add compatible assertions | Unknown concept IDs or zero memberships are rejected |
| UC-06 | Find and inspect content | Search an alias, select the result, inspect definition and neighbors | No results offers filter reset; ambiguous labels include distinguishing IDs |
| UC-07 | Review quality | Run validation and follow a warning to a record to add a description | Warnings remain nonblocking; invalid imports cannot become the active document |
| UC-08 | Rename a concept | Rename a concept used by hierarchy links, memberships, and assertions | All references remain intact because they use stable IDs |
| UC-09 | Delete referenced content | Review dependency counts, confirm deletion, then undo | Last-membership deletion is blocked; cancel leaves all records unchanged |
| UC-10 | Exchange an ontology | Export JSON, import it in another browser, inspect all records | Unsupported versions, oversized files, or malformed JSON leave current work intact |
| UC-11 | Resume work | Reload after a successful save; the same ontology is restored | Storage failure is visible and offers export; corrupt storage offers recovery |
| UC-12 | Recover from a mistake | Edit or delete records, undo, then redo | New edits after undo clear redo; history resets on document replacement |
| UC-13 | Work in two tabs | Edit in one tab; the other detects that its revision is stale | Stale tab pauses writes and offers reload or export before reconciliation |
| UC-14 | Use keyboard or mobile | Search, create, edit, inspect relationships, and export without graph dragging | Focus remains visible; dialogs return focus to their trigger on close |
| UC-15 | Open the published app | Visit the GitHub Pages repository URL and load the example | Relative assets load under the repository subpath; no server routes are required |

## 9. Nonfunctional requirements

### Static architecture and deployment

- Deliver HTML, CSS, JavaScript, and local assets without a runtime server, database, secrets, or API keys.
- A build step is allowed. Commit dependency lockfiles if a package manager is used.
- Support hosting at both `/` and a repository subpath such as `/quento-replica/`.
- Use relative asset references or an explicitly configured base path. Navigation must not depend on server rewrites.
- Bundle runtime dependencies with the deployed app; no CDN dependency is required for normal use.
- Keep data model, validation, persistence, and rendering sufficiently separate to test domain behavior independently.
- Record the deployment method during implementation. Recreate deployment configuration removed during the repository reset as needed.

### Privacy and safety

- No telemetry or transmission of ontology data by default.
- Treat imported files and all text fields as untrusted input. Render text safely and avoid evaluating user content.
- Do not automatically fetch namespace URLs or other imported values.
- No credentials are stored in the ontology or deployment artifacts.

### Accessibility and compatibility

- Target WCAG 2.2 AA with keyboard navigation, visible focus, appropriate contrast, accessible names, and usable error announcements.
- Provide accessible list/detail alternatives for all graph content and actions.
- Respect reduced-motion preferences.
- Verify current stable Chrome, Firefox, Safari, and Edge at release time; record tested versions.
- Support layouts from 360 CSS pixels wide through desktop sizes.

### Performance targets

- Proposed reference dataset: 1,000 concepts, 2,000 instances, and 5,000 assertions.
- On a documented reference laptop, target search/filter responses within 200 ms and import validation within 2 seconds for this dataset.
- Use a bounded neighborhood graph for large documents rather than rendering every node by default. Show when the view is filtered or truncated.
- Keep long operations cancellable where feasible and show progress or a busy indicator when they exceed 500 ms.
- Confirm targets during implementation with measured results; they are requirements to validate, not existing performance claims.

## 10. Verification plan

- Unit tests: hierarchy cycle detection, reference integrity, endpoint rules, memberships, duplicate assertions, and dependency-aware deletion.
- Data tests: JSON round trip, Unicode, empty documents, unsupported versions, unknown fields, dangling references, duplicate IDs, malformed input, and file-size limit.
- Transaction tests: failed edits leave no partial state; deletion undo restores dependent records; redo and history boundaries behave correctly.
- Persistence tests: reload recovery, storage failure, corrupt saved data, and concurrent-tab revision conflicts.
- Integration tests: create → model → validate → export → import, including rejected imports preserving current content.
- Browser checks: required use cases on supported browsers, keyboard-only editing, mobile layout, and accessible graph alternatives.
- Deployment smoke check: app and assets load under the GitHub Pages subpath; refresh and local import/export work.
- Performance checks: measure documented targets against the reference dataset.

## 11. First-release acceptance gate

The release is complete when:

1. FR-01 through FR-10 are implemented and the UC-01 through UC-15 scenarios pass.
2. No accepted operation leaves dangling references or hierarchy cycles.
3. JSON round trips preserve complete ontology content.
4. Local save failures and import failures do not silently destroy current work.
5. Core editing is usable by keyboard and on a mobile-width screen.
6. The static build works at the repository's GitHub Pages URL.
7. Tests, browser versions, and performance measurements are documented.
8. Usage documentation explains the data model, JSON format, local persistence, backup workflow, and deployment.

## 12. Implementation sequence

1. Resolve scope decisions and finalize the JSON schema and example dataset.
2. Implement and test the domain model, validation, and content transactions.
3. Build document lifecycle, forms, hierarchy/list navigation, and details.
4. Add persistence, recovery, import/export, and undo/redo.
5. Add graph exploration, responsive layout, and accessibility refinements.
6. Validate against use cases, performance targets, and the static deployment environment.

## 13. Repository reset

- Remove the previous application's source, content, documentation, and deployment marker.
- Preserve `.git`, repository history, branch information, and remote configuration.
- Keep this specification as the sole project file at the end of the specification phase.
- Do not implement, commit, push, or publish the new application as part of this phase.
- Existing remote files and any published website remain unchanged until changes are committed, pushed, and deployed separately.

## 14. Open decisions

These do not prevent drafting the specification but should be settled before implementation:

1. Is the intended ontology general-purpose, domain-specific, or required to interoperate with RDF/OWL tools? Formal interoperability changes the data model and scope.
2. Are instances needed in the first release, or is the intended product a vocabulary/taxonomy editor only?
3. What domain and example ontology should the shipped demonstration use?
4. Is the proposed size target sufficient for expected real documents?
5. Are custom properties, multilingual labels, or ontology merging required at launch? They are currently deferred.
6. What product name and visual style should the app use? A neutral, readable interface is the proposed default.

