import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocument, exampleDocument, validate, parseDocument, clone, deleteRecord, History, ancestors } from '../model.js';
import { LocalStore, STORAGE_KEY } from '../storage.js';

test('example, empty documents, and Unicode round trip preserve all data', () => {
  for (const d of [createDocument('Κόσμος 世界'), exampleDocument()]) {
    assert.deepEqual(validate(d).filter(i=>i.severity==='error'), []);
    assert.deepEqual(parseDocument(JSON.stringify(d)), d);
  }
});
test('invalid schemas, unknown fields, dates and malformed JSON are rejected', () => {
  for (const edit of [d=>d.schemaVersion=2,d=>d.extra=true,d=>d.concepts[0].extra='lost',d=>d.createdAt='yesterday',d=>d.concepts[0].tags=[null],d=>d.instances[0].conceptIds=null]) {
    const d=exampleDocument();edit(d);assert.throws(()=>parseDocument(JSON.stringify(d)));
  }
  for(const text of ['null','[]','{}','{',' '.repeat(10*1024*1024+1)])assert.throws(()=>parseDocument(text));
});
test('cycles, duplicate IDs, dangling references, endpoint kinds and duplicate assertions fail atomically', () => {
  const edits = [
    d=>d.concepts[0].parentIds.push('dataset'),
    d=>d.concepts[0].id=d.instances[0].id,
    d=>d.concepts[0].parentIds.push('missing'),
    d=>d.instances[0].conceptIds=[],
    d=>d.assertions[0].targetId='missing',
    d=>d.relationshipTypes[0].sourceKind='instance',
    d=>d.assertions.push({...d.assertions[0],id:'duplicate'}),
  ];
  for(const edit of edits){const h=new History(exampleDocument());const before=clone(h.doc);assert.throws(()=>h.change(edit));assert.deepEqual(h.doc,before);assert.equal(h.past.length,0);}
});
test('multiple inheritance and rename preserve identity', () => {
  const h=new History(exampleDocument());h.change(d=>d.concepts.find(c=>c.id==='dataset').label='Research data');
  assert.deepEqual(new Set(ancestors(h.doc,['dataset'])),new Set(['digital','knowledge','asset']));
  assert.equal(h.doc.instances[0].conceptIds[0],'dataset');
  assert.equal(h.doc.assertions[1].targetId,'dataset');
});
test('last-membership deletion is blocked; dependent deletion is a single undoable transaction', () => {
  const h=new History(exampleDocument());assert.throws(()=>h.change(d=>deleteRecord(d,'concepts','dataset')),/Reassign/);
  const before=clone(h.doc);h.change(d=>deleteRecord(d,'concepts','digital'));
  assert.deepEqual(h.doc.concepts.find(c=>c.id==='dataset').parentIds,['knowledge']);
  assert.deepEqual(h.doc.concepts.find(c=>c.id==='software').parentIds,[]);
  h.undo();assert.deepEqual(h.doc.concepts,before.concepts);h.redo();assert.ok(!h.doc.concepts.some(c=>c.id==='digital'));
  h.change(d=>deleteRecord(d,'instances','mira'));assert.equal(h.doc.assertions.length,2);h.undo();assert.equal(h.doc.assertions.length,4);
  h.change(d=>deleteRecord(d,'relationshipTypes','uses'));assert.equal(h.doc.assertions.length,2);
});
test('history retains at least 50 edits, clears redo after a new edit, and resets between documents', () => {
  const h=new History(createDocument());for(let i=0;i<60;i++)h.change(d=>d.title=`Edit ${i}`);
  for(let i=0;i<50;i++)h.undo();assert.equal(h.doc.title,'Edit 9');h.redo();assert.equal(h.doc.title,'Edit 10');
  h.change(d=>d.title='Branch');assert.equal(h.future.length,0);assert.equal(new History(h.doc).past.length,0);
});
test('duplicate labels and missing descriptions are warnings, not errors',()=>{
  const d=exampleDocument();d.concepts[0].label='Dataset';d.concepts[0].description='';
  assert.equal(validate(d).filter(i=>i.severity==='warning').length,2);assert.doesNotThrow(()=>parseDocument(JSON.stringify(d)));
});
class MemoryStorage {
  constructor(){this.items=new Map();}
  getItem(key){return this.items.get(key)??null;}
  setItem(key,value){this.items.set(key,value);}
  removeItem(key){this.items.delete(key);}
}
test('persistence restores the document and rejects writes from stale tabs',()=>{
  const memory=new MemoryStorage();const first=new LocalStore(memory),second=new LocalStore(memory);const d=exampleDocument();
  assert.equal(first.load(),null);first.save(d);assert.deepEqual(second.load(),d);
  first.save({...d,title:'New revision'});assert.throws(()=>second.save(d),/Another tab/);assert.equal(second.blocked,true);
  assert.equal(second.load().title,'New revision');second.save(d);assert.deepEqual(new LocalStore(memory).load(),d);
});
test('quota errors leave the previous successful save intact',()=>{
  const memory=new MemoryStorage(),store=new LocalStore(memory),d=exampleDocument();store.load();store.save(d);
  const revision=store.revision;memory.setItem=()=>{throw new Error('Quota exceeded');};
  assert.throws(()=>store.save({...d,title:'Unsaved'}),/Quota/);assert.equal(store.revision,revision);assert.equal(new LocalStore(memory).load().title,d.title);
});
test('corrupt saved content is preserved until explicit reset',()=>{
  const memory=new MemoryStorage();memory.setItem(STORAGE_KEY,'{broken');const store=new LocalStore(memory);
  assert.throws(()=>store.load(),/could not be restored/);assert.equal(store.raw,'{broken');assert.throws(()=>store.save(createDocument()),/paused/);
  assert.equal(memory.getItem(STORAGE_KEY),'{broken');store.reset();store.save(createDocument('Recovered'));assert.equal(store.load().title,'Recovered');
});
test('reference dataset validation stays below the two-second target',()=>{
  const d=createDocument('Performance fixture');
  for(let i=0;i<1000;i++)d.concepts.push({id:`c${i}`,label:`Concept ${i}`,description:'Fixture',parentIds:i?[`c${Math.floor((i-1)/2)}`]:[]});
  for(let i=0;i<2000;i++)d.instances.push({id:`i${i}`,label:`Instance ${i}`,description:'Fixture',conceptIds:[`c${i%1000}`]});
  d.relationshipTypes.push({id:'type',label:'relates to',description:'Fixture',sourceKind:'either',targetKind:'either'});
  for(let i=0;i<5000;i++)d.assertions.push({id:`a${i}`,typeId:'type',sourceId:`i${i%2000}`,targetId:`c${Math.floor(i/2000)}`});
  const start=performance.now();assert.deepEqual(parseDocument(JSON.stringify(d)),d);const ms=performance.now()-start;
  console.log(`Reference dataset: 1,000 concepts / 2,000 instances / 5,000 assertions; JSON validation and round trip ${ms.toFixed(1)} ms`);assert.ok(ms<2000);
});
