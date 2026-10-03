# Ontology Studio

A static, local-first ontology editor for GitHub Pages.

**Website:** https://malivi.github.io/quento-replica/

## Use the app

1. Create a concept, import an existing JSON ontology, or explicitly load the fictional example.
2. Add parent concepts to build a hierarchy. Multiple parents are supported; cycles are rejected.
3. Create instances and assign each to at least one concept.
4. Define relationship types with allowed source and target kinds, then connect entities with assertions.
5. Explore the list, hierarchy, or graph. Search definitions and aliases, filter by tags or relationship, and inspect an entity's details.
6. Validate the document and resolve warnings. Use Undo/Redo to reverse changes during the current session.
7. Export JSON regularly to back up or share your work.

Changes are saved **only in this browser**, not in GitHub. Clearing site data removes the saved document. Exported files are the portable backup. There are no accounts, telemetry, remote ontology requests, or runtime dependencies.

The app pauses saving if another tab changes the saved document. Export the stale tab's work or reload the latest saved version. Corrupt saved content can be downloaded before explicitly resetting storage. If storage is unavailable or full, the in-memory document remains editable and exportable.

The hierarchy shows a multi-parent concept under each parent. Graph edges point from parent to child, from instance to concept for membership, and from assertion source to target. The list and detail panels provide an alternative to graph interaction. Large lists are paginated; graphs show at most 60 entities and hierarchies at most 500 visible entries. Search and neighborhood selection narrow the graph.

## JSON format

The root object contains `schemaVersion: 1`, `id`, `title`, UTC ISO 8601 `createdAt` and `updatedAt` timestamps, and four arrays:

- `concepts`: `{ id, label, parentIds, description?, aliases?, tags? }`
- `instances`: `{ id, label, conceptIds, description?, aliases?, tags? }`
- `relationshipTypes`: `{ id, label, sourceKind, targetKind, description? }`
- `assertions`: `{ id, typeId, sourceId, targetId, description? }`

Optional document fields are `description`, `namespace`, `ontologyVersion`, and `language`. Endpoint kinds are `concept`, `instance`, or `either`. IDs are globally unique within the document, including the document ID. References use IDs, not labels. Unknown fields and unsupported versions are rejected instead of silently lost. Import/export preserves the original content, including omitted optional fields; editing uses empty strings/arrays as defaults.

An import is validated before confirmation to replace the current document. Failed imports leave the current document untouched. The file limit is 10 MiB. This format is application-specific JSON, not RDF/OWL, and the app performs no formal reasoning.

See [spec.md](spec.md) for the full requirements and [VALIDATION.md](VALIDATION.md) for verification results and limitations.

## Run locally

Use Node.js 20 or newer for tests, and Python 3 for a local static server:

```sh
npm start
```

Open http://localhost:4173. Use an HTTP server rather than opening `index.html` directly, because the application uses ES modules.

```sh
npm ci
npm test
npm run test:browser
```

Browser tests expect the local server and an installed Chrome browser. Set `BROWSER_CHANNEL=msedge` to exercise installed Edge. Test screenshots are written to ignored `test-results/`. Playwright and axe are development-only dependencies; no npm build or package installation is needed on the host.

## Publish on GitHub Pages

Publish the **main branch**, **/ (root)** under repository **Settings → Pages → Deploy from a branch**. This repository already uses root static publishing. Push changes to `main` to update the site. `.nojekyll` disables Jekyll processing. All asset paths are relative, so the same files work at the root or `/quento-replica/`.

Runtime files: `index.html`, `styles.css`, `app.js`, `model.js`, `storage.js`, and `favicon.svg`. No server-side code, credentials, or build step is required.

## Architecture

- `model.js`: versioned data model, validation, deletion rules, transaction history, and fictional example.
- `storage.js`: local persistence, recovery, and optimistic revision checking.
- `app.js`: interface, forms, navigation, graph, import/export, and cooperative cross-tab write locking.
- `styles.css`: responsive styling, focus states, and reduced-motion behavior.
- `tests/`: domain, persistence, performance, and browser workflow checks.
