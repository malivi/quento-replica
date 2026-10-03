import { assertValid } from './model.js';
export const STORAGE_KEY = 'ontology-studio.document.v1';
export class LocalStore {
  constructor(storage) { this.storage = storage; this.revision = null; this.blocked = false; this.raw = null; }
  load() {
    this.raw = this.storage.getItem(STORAGE_KEY);
    if (!this.raw) { this.revision = null; return null; }
    try {
      const value = JSON.parse(this.raw);
      if (!value || typeof value.revision !== 'string' || !value.revision) throw new Error('Invalid storage envelope.');
      assertValid(value.document); this.revision = value.revision; this.blocked = false; return value.document;
    } catch (error) { this.blocked = true; throw new Error(`Saved data could not be restored: ${error.message}`); }
  }
  save(document) {
    if (this.blocked) throw new Error('Saving is paused. Resolve the storage conflict or recovery notice first.');
    const raw = this.storage.getItem(STORAGE_KEY);
    let current;
    try { current = raw ? JSON.parse(raw).revision : null; } catch { this.blocked = true; throw new Error('Saved data changed unexpectedly. Reload or export your work.'); }
    if (current !== this.revision) { this.blocked = true; throw new Error('Another tab changed this document. Export your work or reload the latest version.'); }
    const revision = crypto.randomUUID();
    this.storage.setItem(STORAGE_KEY, JSON.stringify({ revision, document })); this.revision = revision;
  }
  reset() { this.storage.removeItem(STORAGE_KEY); this.revision = null; this.blocked = false; this.raw = null; }
}
