export const collections = ['concepts', 'relationshipTypes', 'instances', 'assertions'];
export const kinds = { concepts: 'concept', instances: 'instance', relationshipTypes: 'relationship type', assertions: 'assertion' };
export const clone = value => structuredClone(value);
export const uid = () => crypto.randomUUID();
export function createDocument(title = 'Untitled ontology') {
  const now = new Date().toISOString();
  return { schemaVersion: 1, id: uid(), title, description: '', namespace: '', ontologyVersion: '1.0', language: 'en', createdAt: now, updatedAt: now, concepts: [], relationshipTypes: [], instances: [], assertions: [] };
}
const fields = {
  document: ['schemaVersion', 'id', 'title', 'description', 'namespace', 'ontologyVersion', 'language', 'createdAt', 'updatedAt', ...collections],
  concepts: ['id', 'label', 'description', 'aliases', 'tags', 'parentIds'],
  instances: ['id', 'label', 'description', 'aliases', 'tags', 'conceptIds'],
  relationshipTypes: ['id', 'label', 'description', 'sourceKind', 'targetKind'],
  assertions: ['id', 'typeId', 'sourceId', 'targetId', 'description'],
};
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
export function validate(doc) {
  const issues = [];
  const issue = (message, id = '', field = '', severity = 'error') => issues.push({ message, id, field, severity });
  if (!isObject(doc)) return [{ severity: 'error', message: 'The file must contain an ontology object.' }];
  function shape(obj, kind, required, path) {
    if (!isObject(obj)) { issue(`${path} must be an object.`); return false; }
    const id = typeof obj.id === 'string' ? obj.id : '';
    for (const key of Object.keys(obj)) if (!fields[kind].includes(key)) issue(`${path}: unknown field “${key}”.`, id, key);
    for (const key of required) if (typeof obj[key] !== 'string' || !obj[key].trim()) issue(`${path}: ${key} must be nonempty text.`, id, key);
    for (const key of ['description', 'namespace', 'ontologyVersion', 'language']) if (key in obj && typeof obj[key] !== 'string') issue(`${path}: ${key} must be text.`, id, key);
    for (const key of ['aliases', 'tags', 'parentIds', 'conceptIds']) {
      if (key in obj && (!Array.isArray(obj[key]) || obj[key].some(x => typeof x !== 'string' || !x.trim()))) issue(`${path}: ${key} must be an array of nonempty strings.`, id, key);
      else if (Array.isArray(obj[key]) && new Set(obj[key]).size !== obj[key].length) issue(`${path}: ${key} contains duplicate values.`, id, key);
    }
    return true;
  }
  shape(doc, 'document', ['id', 'title', 'createdAt', 'updatedAt'], 'Document');
  if (doc.schemaVersion !== 1) issue('Unsupported schemaVersion. Expected version 1.', doc.id, 'schemaVersion');
  for (const field of ['createdAt', 'updatedAt']) if (typeof doc[field] !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(doc[field]) || !Number.isFinite(Date.parse(doc[field]))) issue(`${field} must be a UTC ISO 8601 date.`, doc.id, field);
  const seen = new Set([doc.id]);
  for (const col of collections) {
    if (!Array.isArray(doc[col])) { issue(`${col} must be an array.`, '', col); continue; }
    doc[col].forEach((r, index) => {
      if (!shape(r, col, col === 'assertions' ? ['id', 'typeId', 'sourceId', 'targetId'] : ['id', 'label'], `${col}[${index}]`)) return;
      if (seen.has(r.id)) issue(`Duplicate ID “${r.id}”.`, r.id, 'id');
      seen.add(r.id);
      const links = col === 'concepts' ? 'parentIds' : col === 'instances' ? 'conceptIds' : null;
      if (links && !Array.isArray(r[links])) issue(`${r.label || r.id}: ${links} is required.`, r.id, links);
      if (col === 'relationshipTypes') for (const key of ['sourceKind', 'targetKind']) if (!['concept', 'instance', 'either'].includes(r[key])) issue(`${r.label}: ${key} must be concept, instance, or either.`, r.id, key);
    });
  }
  if (issues.length) return issues;
  const concepts = new Map(doc.concepts.map(x => [x.id, x]));
  const types = new Map(doc.relationshipTypes.map(x => [x.id, x]));
  const entities = new Map([...doc.concepts.map(x => [x.id, 'concept']), ...doc.instances.map(x => [x.id, 'instance'])]);
  for (const c of doc.concepts) for (const p of c.parentIds) if (!concepts.has(p)) issue(`${c.label}: parent “${p}” does not exist.`, c.id, 'parentIds');
  // Kahn's algorithm avoids call-stack limits in deeply nested imported hierarchies.
  const degrees = new Map(doc.concepts.map(x => [x.id, x.parentIds.length]));
  const children = new Map(doc.concepts.map(x => [x.id, []]));
  for (const c of doc.concepts) for (const p of c.parentIds) children.get(p)?.push(c.id);
  const ready = doc.concepts.filter(x => !x.parentIds.length).map(x => x.id);
  for (let i = 0; i < ready.length; i++) for (const child of children.get(ready[i]) || []) { degrees.set(child, degrees.get(child) - 1); if (degrees.get(child) === 0) ready.push(child); }
  if (ready.length !== doc.concepts.length && !issues.length) {
    const blocked = doc.concepts.filter(x => degrees.get(x.id) > 0);
    issue(`Hierarchy cycle involving ${blocked.slice(0, 6).map(x => x.label).join(', ')}. Remove a parent link.`, blocked[0]?.id, 'parentIds');
  }
  for (const r of doc.instances) {
    if (!r.conceptIds.length) issue(`${r.label} must belong to at least one concept.`, r.id, 'conceptIds');
    for (const id of r.conceptIds) if (!concepts.has(id)) issue(`${r.label}: concept “${id}” does not exist.`, r.id, 'conceptIds');
  }
  const triples = new Set();
  for (const a of doc.assertions) {
    const t = types.get(a.typeId);
    if (!t) issue(`Assertion ${a.id}: relationship type does not exist.`, a.id, 'typeId');
    for (const side of ['source', 'target']) {
      const kind = entities.get(a[`${side}Id`]);
      if (!kind) issue(`Assertion ${a.id}: ${side} does not exist.`, a.id, `${side}Id`);
      else if (t && t[`${side}Kind`] !== 'either' && t[`${side}Kind`] !== kind) issue(`Assertion ${a.id}: ${side} is incompatible with “${t.label}”.`, a.id, `${side}Id`);
    }
    const triple = JSON.stringify([a.typeId, a.sourceId, a.targetId]);
    if (triples.has(triple)) issue(`Assertion ${a.id} duplicates an existing relationship.`, a.id);
    triples.add(triple);
  }
  const labels = new Map();
  for (const col of collections.filter(x => x !== 'assertions')) for (const r of doc[col]) {
    const key = r.label.toLocaleLowerCase();
    if (labels.has(key)) issue(`“${r.label}” is also used by ${labels.get(key)}.`, r.id, 'label', 'warning');
    else labels.set(key, r.id);
    if (!r.description?.trim()) issue(`“${r.label}” has no description.`, r.id, 'description', 'warning');
  }
  return issues;
}
export function assertValid(doc) {
  const errors = validate(doc).filter(x => x.severity === 'error');
  if (errors.length) { const e = new Error(errors.map(x => x.message).join('\n')); e.issues = errors; throw e; }
  return doc;
}
export function parseDocument(text) {
  if (new TextEncoder().encode(text).length > 10 * 1024 * 1024) throw new Error('The import limit is 10 MiB.');
  let doc;
  try { doc = JSON.parse(text); } catch { throw new Error('This file is not valid JSON. Check its syntax and try again.'); }
  return assertValid(doc);
}
export function allRecords(doc) { return collections.flatMap(col => doc[col].map(record => ({ ...record, collection: col, kind: kinds[col] }))); }
export function ancestors(doc, ids) {
  const byId = new Map(doc.concepts.map(x => [x.id, x]));
  const seen = new Set(), queue = [...ids];
  for (let i = 0; i < queue.length; i++) for (const p of byId.get(queue[i])?.parentIds || []) if (!seen.has(p)) { seen.add(p); queue.push(p); }
  return [...seen];
}
export function deletionImpact(doc, collection, id) {
  const assertions = doc.assertions.filter(a => a.sourceId === id || a.targetId === id || a.typeId === id);
  const children = doc.concepts.filter(x => x.parentIds.includes(id));
  const instances = doc.instances.filter(x => x.conceptIds.includes(id));
  const blocked = collection === 'concepts' ? instances.filter(x => x.conceptIds.length === 1) : [];
  return { assertions, children, instances, blocked };
}
export function deleteRecord(doc, collection, id) {
  const impact = deletionImpact(doc, collection, id);
  if (impact.blocked.length) throw new Error(`Reassign or delete these instances first: ${impact.blocked.map(x => x.label).join(', ')}.`);
  doc[collection] = doc[collection].filter(x => x.id !== id);
  doc.assertions = doc.assertions.filter(x => x.sourceId !== id && x.targetId !== id && x.typeId !== id);
  if (collection === 'concepts') {
    for (const c of doc.concepts) c.parentIds = c.parentIds.filter(x => x !== id);
    for (const i of doc.instances) i.conceptIds = i.conceptIds.filter(x => x !== id);
  }
}
export class History {
  constructor(doc) { this.doc = assertValid(clone(doc)); this.past = []; this.future = []; }
  change(fn) {
    const next = clone(this.doc); fn(next); next.updatedAt = new Date().toISOString(); assertValid(next);
    this.past.push(this.doc); if (this.past.length > 100) this.past.shift(); this.doc = next; this.future = [];
  }
  undo() { if (!this.past.length) return; this.future.push(this.doc); this.doc = clone(this.past.pop()); this.doc.updatedAt = new Date().toISOString(); }
  redo() { if (!this.future.length) return; this.past.push(this.doc); this.doc = clone(this.future.pop()); this.doc.updatedAt = new Date().toISOString(); }
}
export function exampleDocument() {
  const d = createDocument('Knowledge ecosystem');
  d.description = 'A fictional map of the people, knowledge, and tools behind a research practice.';
  const defs = [
    ['asset', 'Asset', [], 'A resource with value to the organization.', ['foundation']],
    ['digital', 'Digital asset', ['asset'], 'An asset stored and maintained in digital form.', ['technology']],
    ['knowledge', 'Knowledge resource', ['asset'], 'Recorded information that supports learning and decisions.', ['knowledge']],
    ['dataset', 'Dataset', ['digital', 'knowledge'], 'A structured collection of observations or records.', ['data', 'knowledge']],
    ['publication', 'Publication', ['knowledge'], 'A reviewed work that communicates research findings.', ['knowledge']],
    ['software', 'Software', ['digital'], 'A program used to process information or support work.', ['technology']],
    ['agent', 'Agent', [], 'A person or group capable of carrying out an activity.', ['foundation']],
    ['person', 'Person', ['agent'], 'An individual contributing to the research practice.', ['people']],
    ['team', 'Team', ['agent'], 'A group of people with a shared area of responsibility.', ['people']],
  ];
  d.concepts = defs.map(([id, label, parentIds, description, tags]) => ({ id, label, parentIds, description, tags, aliases: id === 'dataset' ? ['Data collection'] : [] }));
  d.instances = [
    { id: 'atlas', label: 'Atlas survey', conceptIds: ['dataset'], description: 'A fictional survey of neighborhood green spaces.', tags: ['data'], aliases: [] },
    { id: 'mira', label: 'Mira Chen', conceptIds: ['person'], description: 'A fictional researcher responsible for the Atlas survey.', tags: ['people'], aliases: [] },
    { id: 'lab', label: 'Urban research lab', conceptIds: ['team'], description: 'A fictional group studying cities and public space.', tags: ['people'], aliases: [] },
  ];
  d.relationshipTypes = [
    { id: 'uses', label: 'uses', sourceKind: 'concept', targetKind: 'concept', description: 'Uses another class of resource in its work.' },
    { id: 'maintains', label: 'maintains', sourceKind: 'instance', targetKind: 'instance', description: 'Is responsible for keeping a resource current.' },
    { id: 'member', label: 'member of', sourceKind: 'instance', targetKind: 'instance', description: 'Belongs to an organized group.' },
  ];
  d.assertions = [
    { id: 'a1', typeId: 'uses', sourceId: 'person', targetId: 'software', description: 'Researchers use software.' },
    { id: 'a2', typeId: 'uses', sourceId: 'software', targetId: 'dataset', description: 'Software processes datasets.' },
    { id: 'a3', typeId: 'maintains', sourceId: 'mira', targetId: 'atlas', description: 'Mira maintains the survey.' },
    { id: 'a4', typeId: 'member', sourceId: 'mira', targetId: 'lab', description: 'Mira is part of the lab.' },
  ];
  return d;
}
