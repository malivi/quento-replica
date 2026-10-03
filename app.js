import { collections, kinds, clone, uid, createDocument, allRecords, validate, parseDocument, ancestors, deletionImpact, deleteRecord, History, exampleDocument } from './model.js';
import { LocalStore, STORAGE_KEY } from './storage.js';

const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths = {
  concept:'<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  instance:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  type:'<path d="M5 7h14m-4-4 4 4-4 4M19 17H5m4-4-4 4 4 4"/>',
  assertion:'<circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><path d="M8 12h8m-4-3 3 3-3 3"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1"/>',
  graph:'<circle cx="5" cy="6" r="3"/><circle cx="18" cy="10" r="3"/><circle cx="8" cy="20" r="3"/><path d="m8 7 7 2M6 9l1 8m4 1 5-6"/>',
  hierarchy:'<path d="M12 3v6M5 15v-5h14v5M9 3h6v4H9zM2 15h6v5H2zM16 15h6v5h-6z"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  export:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v7h16v-7"/>',
  import:'<path d="M12 3v13m-5-5 5 5 5-5M4 15v6h16v-6"/>',
  undo:'<path d="M3 10h11a6 6 0 0 1 0 12M3 10l6-6M3 10l6 6"/>',
  redo:'<path d="M21 10H10a6 6 0 0 0 0 12M21 10l-6-6m6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="10"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
  edit:'<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14v6Z"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
};
const icon = name => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.concept}</svg>`;
const colIcon = col => ({concepts:'concept',instances:'instance',relationshipTypes:'type',assertions:'assertion'})[col];
const colName = col => ({concepts:'Concepts',instances:'Instances',relationshipTypes:'Relationship types',assertions:'Assertions',all:'All entities'})[col];
const button = (action, text, cls = '', attrs = '') => `<button type="button" data-action="${action}" class="${cls}" ${attrs}>${text}</button>`;
let store, initial, recovery = '', banner = '', status = 'Not saved yet';
try { store = new LocalStore(localStorage); initial = store.load(); if (initial) status = 'Saved locally'; }
catch (e) { recovery = store?.raw || ''; banner = e.message; status = 'Save unavailable'; }
let history = new History(initial || createDocument());
let state = { page:0, view:'list', collection:'all', query:'', tag:'', relation:'', selected:null, neighborhood:false };
let issues = validate(history.doc), modalDirty = false, returnFocus = null, dialogAction = null;
let graphState = { x:0, y:0, scale:1 };
const doc = () => history.doc;
let cachedDoc, cachedRecords = [], cachedById = new Map();
function getRecords() { if (cachedDoc !== doc()) { cachedDoc = doc(); cachedRecords = allRecords(doc()); cachedById = new Map(cachedRecords.map(r => [r.id, r])); } return cachedRecords; }
const lookup = id => { getRecords(); return cachedById.get(id); };
const label = id => lookup(id)?.label || id;
const summary = d => `${d.concepts.length} concepts · ${d.instances.length} instances · ${d.relationshipTypes.length} types · ${d.assertions.length} assertions`;
function notice(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(notice.timer); notice.timer = setTimeout(() => $('#toast').classList.remove('visible'), 4000); }
async function persist() {
  status = 'Saving…'; updateStatus();
  const save = () => { if (!store) throw new Error('Browser storage is unavailable. Export a JSON file to keep your work.'); store.save(doc()); };
  try {
    // Cooperative exclusive lock closes the read/write race between tabs.
    if (navigator.locks) await navigator.locks.request(STORAGE_KEY, save); else save();
    status = 'Saved locally';
  } catch (e) { status = 'Save failed'; banner = e.message; }
  updateStatus(); renderBanner();
}
function updateStatus() { const el = $('#save-status'); if (el) el.innerHTML = `<span class="status-dot ${/failed|unavailable/.test(status)?'error':''}"></span>${esc(status)}`; }
function transact(fn, message) {
  try { history.change(fn); issues = validate(doc()); render(); void persist(); if (message) notice(message); return true; }
  catch (e) { const error = $('#form-error'); if (error) { error.textContent = e.message; error.focus(); } else notice(e.message); return false; }
}
function download(content, filename) {
  const url = URL.createObjectURL(new Blob([content], {type:'application/json;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportDocument() { download(JSON.stringify(doc(), null, 2), `${doc().title.replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,80) || 'ontology'}.json`); notice('Ontology exported'); }
function renderBanner() {
  const el = $('#banner'); if (!el) return;
  el.innerHTML = banner ? `<div class="banner" role="alert"><span>${esc(banner)}</span>${button('export','Export current work')}${recovery ? button('recover','Download recovery') + button('reset-storage','Reset saved data','danger') : button('reload','Reload saved version')}</div>` : '';
}
function render() {
  if (state.selected && !lookup(state.selected)) state.selected = null;
  const warnings = issues.filter(x=>x.severity==='warning').length;
  $('#app').innerHTML = `<header class="brandbar"><div class="brand"><img src="./favicon.svg" alt="">Ontology <span>Studio</span></div><div class="privacy">${icon('lock')} Your workspace. Your data.</div><div class="top-actions">${button('new',icon('plus')+'New','icon')}${button('import',icon('import')+'Import','icon')}${button('export',icon('export')+'Export JSON','icon')}</div></header>
+  <main class="page"><div id="banner"></div><section class="document-head" aria-label="Ontology document"><div class="document-heading"><div class="eyebrow" style="margin-bottom:9px">Ontology workspace</div><h1>${esc(doc().title)}</h1><div class="doc-meta"><span id="save-status"></span><span>·</span><span>Version ${esc(doc().ontologyVersion || '1.0')}</span>${button('metadata',icon('settings')+'Document settings','quiet small icon')}</div></div><div class="document-actions">${button('undo',icon('undo'),'icon','aria-label="Undo" title="Undo" '+(!history.past.length?'disabled':''))}${button('redo',icon('redo'),'icon','aria-label="Redo" title="Redo" '+(!history.future.length?'disabled':''))}<span class="separator"></span>${button('validate',icon('check')+(warnings ? `${warnings} warnings` : 'Validate'),'icon')}${button('add',icon('plus')+'Add entity','primary icon')}</div></section>
+  <section class="stats" aria-label="Ontology counts">${collections.map(col=>button('collection',`<span class="stat-mark">${icon(colIcon(col))}</span><span><strong>${doc()[col].length}</strong><span class="muted">${colName(col)}</span></span>`,'stat',`data-value="${col}"`)).join('')}</section>
+  <section class="workbench" aria-label="Ontology editor"><nav class="sidebar" aria-label="Entity navigation"><div class="eyebrow">Explore</div>${['all',...collections].map(col=>button('collection',icon(col==='all'?'list':colIcon(col))+colName(col)+`<span class="count">${col==='all'?getRecords().length:doc()[col].length}</span>`,`nav-item ${state.collection===col?'active':''}`,`data-value="${col}" aria-pressed="${state.collection===col}"`)).join('')}<div class="sidebar-section"><div class="eyebrow">Refine view</div><label for="tag-filter">Tag</label><select id="tag-filter"><option value="">All tags</option>${[...new Set([...doc().concepts,...doc().instances].flatMap(r=>r.tags||[]))].sort().map(t=>`<option ${state.tag===t?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select><label for="relation-filter">Relationship</label><select id="relation-filter"><option value="">All relationships</option>${doc().relationshipTypes.map(t=>`<option ${state.relation===t.id?'selected':''} value="${esc(t.id)}">${esc(t.label)}</option>`).join('')}</select>${button('clear-filters','Reset filters','quiet small','style="margin:10px"')}</div><div class="sidebar-section"><div class="eyebrow">Workspace</div>${button('example',icon('graph')+'Load example','nav-item')}<p class="side-note">Changes stay in this browser. Export a copy to back up or share your ontology.</p></div></nav>
+  <div id="workspace" class="workspace" tabindex="-1"><div class="workspace-toolbar"><div class="tabs" role="group" aria-label="View">${['list','hierarchy','graph'].map(v=>button('view',icon(v)+v[0].toUpperCase()+v.slice(1),`icon ${state.view===v?'active':''}`,`data-value="${v}" aria-pressed="${state.view===v}"`)).join('')}</div><div class="search">${icon('search')}<input id="search" type="search" aria-label="Search ontology" placeholder="Search ontology…" value="${esc(state.query)}"></div></div><div id="main-view" style="display:flex;flex-direction:column;flex:1;min-width:0"></div></div><aside id="details" class="details" aria-label="Selected entity"></aside></section><footer class="footer"><span>Local-first · No account needed · JSON schema v1</span>${button('help','About this workspace','quiet')}</footer></main>`.replace(/^\+  /gm,'');
  updateStatus(); renderBanner(); renderMain(); renderDetails();
}
let relatedIds = new Set();
function matches(r) {
  const text = [r.label,r.description,...r.aliases||[],...r.tags||[],r.collection==='assertions'?`${label(r.sourceId)} ${label(r.typeId)} ${label(r.targetId)}`:''].join(' ').toLocaleLowerCase();
  if (state.query && !text.includes(state.query.toLocaleLowerCase())) return false;
  if (state.tag && !(r.tags||[]).includes(state.tag)) return false;
  if (state.relation && !relatedIds.has(r.id)) return false;
  return state.collection==='all'||r.collection===state.collection;
}
function filtered() { relatedIds = new Set([state.relation]); if (state.relation) for (const a of doc().assertions) if (a.typeId === state.relation) for (const id of [a.id, a.sourceId, a.targetId]) relatedIds.add(id); return getRecords().filter(matches); }
const graphic = `<svg class="empty-graphic" viewBox="0 0 150 110" fill="none" aria-hidden="true"><path d="M38 33 108 25 79 83 38 33" stroke="#b7caaa" stroke-width="1.5"/><circle cx="38" cy="33" r="21" fill="#e8f0df" stroke="#b9cfa7"/><circle cx="108" cy="25" r="16" fill="#edf2e7" stroke="#c9d5be"/><circle cx="79" cy="83" r="21" fill="#e9eff5" stroke="#bfcedb"/><path d="m30 29 8-5 8 5v9l-8 5-8-5v-9Zm0 0 8 5 8-5m-8 5v9" stroke="#648452" stroke-width="1.5"/><circle cx="79" cy="78" r="5" stroke="#718ba3"/><path d="M71 93v-2a8 8 0 0 1 16 0v2" stroke="#718ba3"/><path d="M102 25h12m-4-4 4 4-4 4" stroke="#7b956b"/></svg>`;
function renderMain() {
  const container = $('#main-view');
  if (!getRecords().length) {
    container.innerHTML = `<div class="empty">${graphic}<div class="eyebrow" style="margin-bottom:12px">A space for connected knowledge</div><h2>Start with a single concept.</h2><p>Define the things in your world, then connect them. Build your own ontology or explore a small example.</p><div class="empty-actions">${button('create',icon('plus')+'Create a concept','primary icon','data-value="concepts"')}${button('example','Explore example')}</div></div>`; return;
  }
  const resultRecords = filtered();
  const pageCount = Math.max(1, Math.ceil(resultRecords.length / 100)); state.page = Math.min(state.page || 0, pageCount - 1);
  const records = state.view === 'list' ? resultRecords.slice(state.page * 100, (state.page + 1) * 100) : resultRecords;
  container.innerHTML = `<div class="view-label"><h2>${state.view==='hierarchy'?'Concept hierarchy':state.view==='graph'?'Knowledge graph':colName(state.collection)}</h2><span class="muted">${resultRecords.length} ${resultRecords.length===1?'result':'results'}</span></div>`;
  if (!records.length) { container.innerHTML += `<div class="empty"><h2>No matching entities</h2><p>Try a different search or clear the filters.</p>${button('clear-filters','Reset filters')}</div>`; return; }
  if (state.view==='graph') renderGraph(container,records);
  else if (state.view==='hierarchy') renderHierarchy(container,records);
  else container.innerHTML += `<div class="table-wrap"><table class="entity-table"><thead><tr><th scope="col">Name</th><th scope="col">Kind</th><th scope="col" class="description-col">Definition</th></tr></thead><tbody>${records.map(r=>`<tr class="${state.selected===r.id?'selected':''}"><td><button type="button" data-action="select" data-id="${esc(r.id)}" aria-label="Inspect ${esc(recordName(r))}"><span class="record-title">${icon(colIcon(r.collection))}<span>${esc(recordName(r))}${r.collection==='concepts'?`<span class="subtext">${r.parentIds.length? r.parentIds.map(label).map(esc).join(' · '):'Root concept'}</span>`:r.collection==='instances'?`<span class="subtext">${r.conceptIds.map(label).map(esc).join(' · ')}</span>`:''}</span></span></button></td><td><span class="badge ${colIcon(r.collection)}">${esc(r.kind)}</span></td><td class="description-col muted">${esc((r.description||'No description yet').slice(0,100))}${(r.description||'').length>100?'…':''}</td></tr>`).join('')}</tbody></table></div>${pageCount > 1 ? `<div class="pagination">${button('prev-page','Previous','',state.page === 0 ? 'disabled' : '')}<span>Page ${state.page + 1} of ${pageCount} · 100 per page</span>${button('next-page','Next','',state.page >= pageCount - 1 ? 'disabled' : '')}</div>` : ''}`;
}
function recordName(r) { return r.collection==='assertions'?`${label(r.sourceId)} → ${label(r.typeId)} → ${label(r.targetId)}`:r.label; }
function renderHierarchy(container,records) {
  const matching = new Set(records.filter(r=>r.collection==='concepts').map(r=>r.id));
  const visible = new Set([...matching,...ancestors(doc(), [...matching])]);
  const byParent = new Map(); for (const c of doc().concepts) for (const p of c.parentIds.length?c.parentIds:['']) { if(!byParent.has(p))byParent.set(p,[]); byParent.get(p).push(c); }
  let budget=500;
  const branch=(parent,depth=0)=> (byParent.get(parent)||[]).filter(c=>visible.has(c.id)).map(c=>{
    if (--budget<0||depth>40)return '';
    const b=button('select',icon('concept')+esc(c.label),`icon ${state.selected===c.id?'selected':''}`,`data-id="${esc(c.id)}"`);
    const hasChildren=(byParent.get(c.id)||[]).some(c=>visible.has(c.id));
    return hasChildren?`<details open><summary>${b}</summary><div class="tree-children">${branch(c.id,depth+1)}</div></details>`:`<div class="leaf">${b}</div>`;
  }).join('');
  container.innerHTML += matching.size?`<div class="tree">${branch('')}</div><div class="graph-note">${budget<0?'Showing the first 500 hierarchy entries. Search to narrow the view.':'Concepts with multiple parents appear in each branch. Ancestors are included for context.'}</div>`:`<div class="empty"><h2>No concepts in this view</h2><p>The hierarchy shows concepts and their parents.</p>${button('collection','Show concepts','','data-value="concepts"')}</div>`;
}
function relationLinks(ids) { return ids.length?`<div class="link-list">${ids.map(id=>button('select',esc(label(id)),'',`data-id="${esc(id)}"`)).join('')}</div>`:'<span class="muted" style="font-size:.8125rem">None</span>'; }
function renderDetails() {
  const r=lookup(state.selected), el=$('#details');
  if(!r){el.innerHTML=`<div class="eyebrow">Entity details</div><div class="detail-empty">${icon('concept')}<p>Select an entity to explore<br>its definition and connections.</p></div>`;return;}
  const section=(title,body)=>`<section class="detail-section"><h3>${title}</h3>${body}</section>`;
  let content='';
  if(r.collection==='concepts') {
    content+=section('Parent concepts',relationLinks(r.parentIds));
    const inherited=ancestors(doc(),[r.id]).filter(id=>!r.parentIds.includes(id)); if(inherited.length)content+=section('Other ancestors',relationLinks(inherited));
    content+=section('Direct children',relationLinks(doc().concepts.filter(c=>c.parentIds.includes(r.id)).map(c=>c.id)));
    content+=section('Direct instances',relationLinks(doc().instances.filter(c=>c.conceptIds.includes(r.id)).map(c=>c.id)));
  }
  if(r.collection==='instances') {content+=section('Explicit membership',relationLinks(r.conceptIds));const inherited=ancestors(doc(),r.conceptIds).filter(id=>!r.conceptIds.includes(id));if(inherited.length)content+=section('Inherited membership',relationLinks(inherited));}
  if(r.collection==='relationshipTypes')content+=section('Endpoint kinds',`<span class="badge">${esc(r.sourceKind)} → ${esc(r.targetKind)}</span>`);
  if(r.collection==='assertions')content+=section('Directed relationship',`<div class="detail-relation">${relationLinks([r.sourceId])}<p style="margin:8px 0">↓ ${button('select',esc(label(r.typeId)),'',`data-id="${esc(r.typeId)}"`)}</p>${relationLinks([r.targetId])}</div>`);
  const assertions=doc().assertions.filter(a=>a.sourceId===r.id||a.targetId===r.id||a.typeId===r.id);
  if(r.collection!=='assertions')content+=section(`Relationships (${assertions.length})`,assertions.length?assertions.map(a=>`<div class="detail-relation">${button('select',esc(label(a.sourceId)),'',`data-id="${esc(a.sourceId)}"`)}<br><span class="muted">${a.targetId===r.id?'← incoming':'→ outgoing'} · </span>${button('select',esc(label(a.typeId)),'',`data-id="${esc(a.id)}"`)}<br>${button('select',esc(label(a.targetId)),'',`data-id="${esc(a.targetId)}"`)}</div>`).join(''):'<span class="muted" style="font-size:.8125rem">No assertions yet</span>');
  if(r.aliases?.length)content+=section('Also known as',`<p class="description">${r.aliases.map(esc).join(', ')}</p>`);
  if(r.tags?.length)content+=section('Tags',`<div class="link-list">${r.tags.map(t=>`<span class="badge">${esc(t)}</span>`).join('')}</div>`);
  el.innerHTML=`<div class="detail-top"><span class="eyebrow">Entity details</span>${button('close-detail',icon('close'),'quiet small icon','aria-label="Close details"')}</div><div class="detail-symbol">${icon(colIcon(r.collection))}</div><span class="badge ${colIcon(r.collection)}" style="margin-bottom:12px">${esc(r.kind)}</span><h2>${esc(recordName(r))}</h2><p class="description">${esc(r.description||'Add a description to make this entity easier to understand.')}</p><div class="detail-actions">${button('edit',icon('edit')+'Edit','icon small')}${['concepts','instances'].includes(r.collection)?button('connect','+ Connect','small'):''}${button('delete','Delete','small danger')}</div>${content}${section('Stable identifier',`<span class="detail-id">${esc(r.id)}</span>`)}`;
}
function renderGraph(container,records) {
  let entities=records.filter(r=>['concepts','instances'].includes(r.collection));
  if(state.collection==='relationshipTypes'||state.collection==='assertions') {
    const ids=new Set(records.flatMap(r=>r.collection==='assertions'?[r.sourceId,r.targetId]:doc().assertions.filter(a=>a.typeId===r.id).flatMap(a=>[a.sourceId,a.targetId])));
    entities=getRecords().filter(r=>ids.has(r.id));
  }
  const edges=[...doc().concepts.flatMap(c=>c.parentIds.map(p=>({source:p,target:c.id,label:'parent of',kind:'parent'}))),...doc().instances.flatMap(i=>i.conceptIds.map(c=>({source:i.id,target:c,label:'instance of',kind:'member'}))),...doc().assertions.filter(a=>!state.relation||a.typeId===state.relation).map(a=>({source:a.sourceId,target:a.targetId,label:label(a.typeId),kind:'assertion'}))];
  if(state.neighborhood&&state.selected){const ids=new Set([state.selected]);for(const e of edges)if(e.source===state.selected||e.target===state.selected){ids.add(e.source);ids.add(e.target);}entities=entities.filter(e=>ids.has(e.id));}
  const total=entities.length;entities=entities.slice(0,60);
  if(!entities.length){container.innerHTML+=`<div class="empty"><h2>No connected entities here</h2><p>Choose concepts or instances, or clear the neighborhood filter.</p>${button('clear-filters','Reset view')}</div>`;return;}
  const positions=new Map();
  const layers=new Map();
  for(const e of entities){const depth=e.collection==='instances'?4:Math.min(3,ancestors(doc(),[e.id]).length);if(!layers.has(depth))layers.set(depth,[]);layers.get(depth).push(e);}
  const ordered=[...layers.keys()].sort((a,b)=>a-b), width=820,height=Math.max(450,...[...layers.values()].map(x=>x.length*85+90));
  ordered.forEach((depth,index)=>layers.get(depth).forEach((e,row)=>positions.set(e.id,{x:100+index*(620/Math.max(1,ordered.length-1)),y:65+(row+.5)*(height-110)/layers.get(depth).length})));
  const visibleEdges=edges.filter(e=>positions.has(e.source)&&positions.has(e.target));
  container.innerHTML+=`<div class="graph-wrap"><div class="graph-caption"><span>─ Parent of</span><span>··· Instance of</span><span>╌ Assertion →</span></div><svg id="graph" viewBox="0 0 ${width} ${height}" role="img" aria-label="Directed ontology graph. Use the list view for a complete accessible alternative."><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#859876"/></marker></defs><g id="graph-transform">${visibleEdges.map((e,i)=>{const a=positions.get(e.source),b=positions.get(e.target);const self=e.source===e.target;const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;const sx=a.x+dx/len*35,sy=a.y+dy/len*22,tx=b.x-dx/len*45,ty=b.y-dy/len*23;return `<path class="graph-edge ${e.kind}" d="${self?`M${a.x-25} ${a.y-20} C${a.x-70} ${a.y-100} ${a.x+70} ${a.y-100} ${a.x+25} ${a.y-20}`:`M${sx} ${sy} Q${(sx+tx)/2} ${(sy+ty)/2+(i%2?15:-15)} ${tx} ${ty}`}" marker-end="url(#arrow)"/><text class="graph-edge-label" x="${self?a.x:(a.x+b.x)/2}" y="${self?a.y-65:(a.y+b.y)/2-7}" text-anchor="middle">${esc(e.label)}</text>`;}).join('')}${entities.map(e=>{const p=positions.get(e.id);return `<g class="graph-node ${e.collection==='instances'?'instance':''} ${state.selected===e.id?'selected':''}" data-action="select" data-id="${esc(e.id)}" tabindex="0" role="button" aria-label="Inspect ${esc(e.label)}" transform="translate(${p.x},${p.y})"><title>${esc(e.label)} (${esc(e.kind)})</title><rect x="-76" y="-23" width="152" height="46" rx="9"/><circle cx="-61" cy="0" r="3" fill="${e.collection==='instances'?'#7198b4':'#83a565'}"/><text x="4" y="4" text-anchor="middle">${esc(e.label.length>19?e.label.slice(0,18)+'…':e.label)}</text></g>`;}).join('')}</g></svg><div class="graph-controls">${button('zoom-out','−','','aria-label="Zoom out"')}${button('zoom-in','+','','aria-label="Zoom in"')}${button('fit','Fit view')}${button('neighborhood',state.neighborhood?'Show all':'Neighborhood','',!state.selected?'disabled':'')}</div></div><div class="graph-note">${total>60?`Showing 60 of ${total} entities. Search or select a neighborhood to narrow the graph.`:`${entities.length} entities · ${visibleEdges.length} links · Drag to pan, use + / − to zoom.`}</div>`;
  applyGraphTransform();bindGraphPan();
}
function applyGraphTransform(){const g=$('#graph-transform');if(g)g.setAttribute('transform',`translate(${graphState.x},${graphState.y}) scale(${graphState.scale})`);}
function bindGraphPan(){const svg=$('#graph');let start=null;svg.addEventListener('pointerdown',e=>{if(e.target.closest('.graph-node'))return;const box=svg.getBoundingClientRect();start={x:e.clientX,y:e.clientY,gx:graphState.x,gy:graphState.y,ratio:svg.viewBox.baseVal.width/box.width};svg.setPointerCapture(e.pointerId);});svg.addEventListener('pointermove',e=>{if(!start)return;graphState.x=start.gx+(e.clientX-start.x)*start.ratio;graphState.y=start.gy+(e.clientY-start.y)*start.ratio;applyGraphTransform();});for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,()=>start=null);}
function openModal(title,body,footer='',onSubmit=null){
  const modal=$('#modal');if(!modal.open)returnFocus=document.activeElement;modalDirty=false;dialogAction=onSubmit;
  modal.innerHTML=`<form id="modal-form"><div class="modal-head"><h2 id="modal-title">${esc(title)}</h2>${button('cancel',icon('close'),'quiet icon','aria-label="Close dialog"')}</div><div class="modal-body"><div id="form-error" class="error-box" role="alert" tabindex="-1"></div>${body}</div><div class="modal-foot">${footer||button('cancel','Cancel')+'<button type="submit" class="primary">Save changes</button>'}</div></form>`;
  if(!modal.open)modal.showModal();
  $('#modal-form').addEventListener('submit',e=>{e.preventDefault();if(dialogAction)dialogAction(new FormData(e.target));});
}
function closeModal(force=false){if(!force&&modalDirty&&!confirm('Discard the changes in this form?'))return;$('#modal').close();modalDirty=false;if(returnFocus?.isConnected)returnFocus.focus();else $('#workspace')?.focus();}
const field=(name,title,value='',type='text',required=false)=>`<div class="form-field"><label for="f-${name}">${title}${required?' <span aria-hidden="true">*</span>':''}</label>${type==='textarea'?`<textarea id="f-${name}" name="${name}" ${required?'required':''}>${esc(value)}</textarea>`:`<input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}>`}</div>`;
function picker(name,title,options,selected=[],multi=true){return `<div class="form-field"><span class="form-label" id="label-${name}">${title}</span><div class="picker" role="group" aria-labelledby="label-${name}"><input type="search" data-picker-search aria-label="Search ${title.toLowerCase()}" placeholder="Search ${title.toLowerCase()}…"><div class="picker-options">${options.length?options.map(r=>`<label class="pick-option" data-search="${esc(`${r.label} ${r.id}`.toLowerCase())}"><input type="${multi?'checkbox':'radio'}" name="${name}" value="${esc(r.id)}" ${selected.includes(r.id)?'checked':''}><span>${esc(r.label)}<small>${esc(r.kind||kinds[r.collection]||'concept')} · ${esc(r.id)}</small></span></label>`).join(''):'<p class="hint" style="padding:6px">No compatible records. Create one first.</p>'}</div></div></div>`;}
function endpointOptions(kind){return getRecords().filter(r=>['concepts','instances'].includes(r.collection)&&(kind==='either'||r.kind===kind));}
function formRecord(collection,record=null){
  const r=record||{id:uid(),label:'',description:'',aliases:[],tags:[],parentIds:[],conceptIds:[],sourceKind:'either',targetKind:'either'};
  let body='';
  if(collection!=='assertions')body+=field('label','Label',r.label,'text',true);
  body+=field('description','Description',r.description,'textarea');
  if(collection==='concepts'||collection==='instances'){
    body+=`<div class="form-row">${field('aliases','Aliases · comma-separated',(r.aliases||[]).join(', '))}${field('tags','Tags · comma-separated',(r.tags||[]).join(', '))}</div>`;
    body+=picker(collection==='concepts'?'parentIds':'conceptIds',collection==='concepts'?'Parent concepts':'Concept memberships (at least one)',doc().concepts.filter(c=>c.id!==r.id),collection==='concepts'?r.parentIds:r.conceptIds);
  }
  if(collection==='relationshipTypes')body+=`<div class="form-row">${['source','target'].map(side=>`<div class="form-field"><label for="f-${side}Kind">${side==='source'?'Source':'Target'} kind</label><select name="${side}Kind" id="f-${side}Kind">${['either','concept','instance'].map(k=>`<option ${r[`${side}Kind`]===k?'selected':''} value="${k}">${k[0].toUpperCase()+k.slice(1)}</option>`).join('')}</select></div>`).join('')}</div>`;
  if(collection==='assertions'){
    const type=doc().relationshipTypes.find(t=>t.id===r.typeId)||doc().relationshipTypes[0];
    body=`<div class="form-field"><label for="f-typeId">Relationship type *</label><select id="f-typeId" name="typeId" required><option value="">Select a relationship type</option>${doc().relationshipTypes.map(t=>`<option value="${esc(t.id)}" ${t.id===type?.id?'selected':''}>${esc(t.label)} · ${esc(t.id)}</option>`).join('')}</select></div><div id="endpoints">${type?picker('sourceId','Source',endpointOptions(type.sourceKind),[r.sourceId||state.selected],false)+picker('targetId','Target',endpointOptions(type.targetKind),[r.targetId],false):'<p class="hint">Create a relationship type and compatible entities before adding an assertion.</p>'}</div>${body}`;
  }
  openModal(`${record?'Edit':'New'} ${kinds[collection]}`,body,'',data=>{
    const next={id:r.id,description:String(data.get('description')||'').trim()};
    if(collection!=='assertions')next.label=String(data.get('label')||'').trim();
    if(['concepts','instances'].includes(collection)){for(const key of ['aliases','tags'])next[key]=[...new Set(String(data.get(key)||'').split(',').map(s=>s.trim()).filter(Boolean))];const key=collection==='concepts'?'parentIds':'conceptIds';next[key]=data.getAll(key);}
    if(collection==='relationshipTypes')for(const key of ['sourceKind','targetKind'])next[key]=data.get(key);
    if(collection==='assertions')for(const key of ['typeId','sourceId','targetId'])next[key]=data.get(key)||'';
    if(transact(d=>{const i=d[collection].findIndex(x=>x.id===r.id);if(i<0)d[collection].push(next);else d[collection][i]=next;},`${kinds[collection]} ${record?'updated':'created'}`)){state.selected=r.id;closeModal(true);render();}
  });
  const typeSelect=$('#f-typeId');if(typeSelect)typeSelect.addEventListener('change',()=>{const t=doc().relationshipTypes.find(x=>x.id===typeSelect.value);$('#endpoints').innerHTML=t?picker('sourceId','Source',endpointOptions(t.sourceKind),[],false)+picker('targetId','Target',endpointOptions(t.targetKind),[],false):'';});
}
function metadataForm(isNew=false){const d=isNew?createDocument(''):doc();openModal(isNew?'New ontology':'Document settings',`${field('title','Ontology title',d.title,'text',true)}${field('description','Description',d.description,'textarea')}<div class="form-row">${field('ontologyVersion','Version',d.ontologyVersion)}${field('language','Language',d.language)}</div>${field('namespace','Namespace (optional)',d.namespace)}<p class="hint">Your ontology is stored in this browser. Clearing site data removes it. Export JSON regularly to keep a backup.</p>${isNew?'<p class="hint">Creating a document replaces the open ontology. Export it first if you want to keep a separate copy.</p>':''}`,isNew?button('export','Export current')+button('cancel','Cancel')+'<button type="submit" class="primary">Create & replace</button>':'',data=>{
  const metadata=Object.fromEntries(['title','description','namespace','ontologyVersion','language'].map(k=>[k,String(data.get(k)||'').trim()]));
  if(isNew){if(!metadata.title){$('#form-error').textContent='A title is required.';return;}replaceDocument({...d,...metadata});closeModal(true);}else if(transact(d=>Object.assign(d,metadata),'Document updated'))closeModal(true);
});}
function replaceDocument(next){history=new History(next);state={page:0,view:'list',collection:'all',query:'',tag:'',relation:'',selected:null,neighborhood:false};graphState={x:0,y:0,scale:1};issues=validate(doc());render();void persist();}
function replacementDialog(next,source){openModal(source==='example'?'Explore the example':'Import ontology',`<p><strong>${esc(next.title)}</strong></p><p>${esc(summary(next))}</p><p>${source==='example'?'This fictional example includes a multi-parent hierarchy, instances, and directed relationships.':'The file has passed validation.'}</p><p>This will replace the open ontology. Export your current work to keep a separate copy.</p>`,button('export','Export current')+button('cancel','Cancel')+'<button type="submit" class="primary">Replace & open</button>',()=>{replaceDocument(next);closeModal(true);notice('Ontology opened');});}
function confirmDelete(){const r=lookup(state.selected);if(!r)return;const impact=deletionImpact(doc(),r.collection,r.id);const blocked=impact.blocked.length;
  openModal(`Delete ${kinds[r.collection]}`,`<p>Delete <strong>${esc(recordName(r))}</strong>?</p>${blocked?`<div class="error-box">These instances would lose their last concept membership: ${impact.blocked.map(x=>esc(x.label)).join(', ')}. Reassign or explicitly delete them first.</div>`:`<p>This removes ${impact.assertions.length} attached assertions, ${impact.children.length} child-parent links, and ${impact.instances.length} instance memberships.</p>${impact.assertions.length?`<p class="hint">Assertions: ${impact.assertions.map(a=>esc(recordName({...a,collection:'assertions'}))).join('; ')}</p>`:''}${impact.children.length?`<p class="hint">Children kept: ${impact.children.map(x=>esc(x.label)).join(', ')}</p>`:''}${impact.instances.length?`<p class="hint">Instances kept: ${impact.instances.map(x=>esc(x.label)).join(', ')}</p>`:''}<p>You can undo this deletion during this session.</p>`}`,button('cancel',blocked?'Close':'Cancel')+(!blocked?'<button type="submit" class="danger">Delete & remove links</button>':''),()=>{if(!blocked&&transact(d=>deleteRecord(d,r.collection,r.id),'Entity deleted'))closeModal(true);});
}
function validationDialog(){issues=validate(doc());openModal('Ontology validation',`<p>${issues.length?`${issues.length} warnings to review. Your ontology is structurally valid.`:'All checks passed. There are no errors or warnings.'}</p><div class="issues">${issues.map(i=>button('issue',`<strong>${esc(i.severity)} · ${esc(i.field||'record')}</strong>${esc(i.message)}`,`issue ${i.severity}`,`data-id="${esc(i.id)}"`)).join('')}</div>`,button('cancel','Close'));}
const actions={
  'prev-page':()=>{state.page=Math.max(0,state.page-1);renderMain();},'next-page':()=>{state.page++;renderMain();},
  new:()=>metadataForm(true),metadata:()=>metadataForm(),export:exportDocument,import:()=>$('#import-file').click(),example:()=>replacementDialog(exampleDocument(),'example'),validate:validationDialog,
  add:()=>openModal('Add an entity',`<p>Choose what you want to add to your ontology.</p><div class="issues">${collections.map(c=>button('create',`${icon(colIcon(c))} <strong>${colName(c)}</strong><span class="hint">${({concepts:'A class or category in your vocabulary.',instances:'An individual belonging to one or more concepts.',relationshipTypes:'A named relationship with endpoint rules.',assertions:'A directed connection between two entities.'})[c]}</span>`,'issue',`data-value="${c}"`)).join('')}</div>`,button('cancel','Cancel')),
  create:el=>formRecord(el.dataset.value),edit:()=>{const r=lookup(state.selected);if(r)formRecord(r.collection,r);},connect:()=>formRecord('assertions'),delete:confirmDelete,
  select:el=>{state.selected=el.dataset.id;renderMain();renderDetails();if(innerWidth<1150)$('#details').scrollIntoView({block:'nearest',behavior:'auto'});},
  'close-detail':()=>{state.selected=null;renderMain();renderDetails();},
  collection:el=>{state.collection=el.dataset.value;state.page=0;render();},view:el=>{state.view=el.dataset.value;graphState={x:0,y:0,scale:1};render();},
  'clear-filters':()=>{Object.assign(state,{collection:'all',query:'',tag:'',relation:'',neighborhood:false});render();},
  undo:()=>{history.undo();issues=validate(doc());render();void persist();},redo:()=>{history.redo();issues=validate(doc());render();void persist();},
  cancel:()=>closeModal(),issue:el=>{closeModal(true);state.selected=el.dataset.id;renderMain();renderDetails();$('#details').scrollIntoView({block:'nearest'});},
  'zoom-in':()=>{graphState.scale=Math.min(3,graphState.scale*1.2);applyGraphTransform();},'zoom-out':()=>{graphState.scale=Math.max(.25,graphState.scale/1.2);applyGraphTransform();},fit:()=>{graphState={x:0,y:0,scale:1};applyGraphTransform();},neighborhood:()=>{state.neighborhood=!state.neighborhood;renderMain();},
  recover:()=>download(recovery,'ontology-recovery.json'),
  'reset-storage':()=>{if(!confirm('Remove the corrupt saved data? Download recovery first if you need to keep it. Your current in-memory ontology will be saved.'))return;try{store.reset();recovery='';banner='';void persist();}catch(e){notice(e.message);}},
  reload:()=>{if(!confirm('Replace this tab’s document with the latest saved version? Export current work first if you need to keep it.'))return;try{const latest=store.load();if(latest){history=new History(latest);issues=validate(doc());state.selected=null;banner='';recovery='';status='Saved locally';render();}else{store.blocked=false;banner='';status='Not saved yet';render();}}catch(e){banner=e.message;recovery=store?.raw||'';renderBanner();}},
  help:()=>openModal('About Ontology Studio','<p>A local workspace for concepts, relationships, and instances. An ontology describes the categories in a domain and how they connect.</p><p>Start with concepts, organize parent relationships, then define relationship types and add assertions. Instances belong to one or more concepts.</p><p><strong>Keep a backup.</strong> Changes are saved in this browser, not on GitHub. Export JSON to share or keep a permanent copy. Clearing browser site data removes the local document.</p><p>Undo and redo work during this session. Use Ctrl/Cmd + Z to undo and Ctrl/Cmd + Shift + Z to redo outside text fields.</p><p class="hint">JSON schema version 1 · No RDF/OWL reasoning · No telemetry or accounts.</p>',button('cancel','Close')),
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(el&&!el.disabled)actions[el.dataset.action]?.(el);});
document.addEventListener('keydown',e=>{if(e.target.matches('.graph-node')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();actions.select(e.target);return;}if($('#modal').open||e.target.closest('input,textarea,select,[contenteditable]'))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();actions[e.shiftKey?'redo':'undo']();}});
document.addEventListener('input',e=>{
  if(e.target.id==='search'){state.query=e.target.value;state.page=0;renderMain();}
  if(e.target.hasAttribute('data-picker-search')){const q=e.target.value.toLowerCase();e.target.closest('.picker').querySelectorAll('.pick-option').forEach(el=>el.hidden=!el.dataset.search.includes(q));}
  if(e.target.closest('#modal-form')&&!e.target.hasAttribute('data-picker-search'))modalDirty=true;
});
document.addEventListener('change',e=>{if(e.target.id==='tag-filter'){state.tag=e.target.value;state.page=0;renderMain();}if(e.target.id==='relation-filter'){state.relation=e.target.value;state.page=0;renderMain();}});
$('#modal').addEventListener('cancel',e=>{e.preventDefault();closeModal();});
window.addEventListener('beforeunload',e=>{if(modalDirty||status==='Saving…'||status==='Save failed'){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY&&e.key!==null)return;if(store){store.blocked=true;banner='Another tab changed the saved ontology. Saving in this tab is paused. Export your current work or reload the saved version.';status='Save paused';updateStatus();renderBanner();}});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;try{if(file.size>10*1024*1024)throw new Error('The import limit is 10 MiB.');notice('Reading and validating file…');const next=parseDocument(await file.text());replacementDialog(next,'import');}catch(error){openModal('Import could not be completed',`<div class="error-box">${esc(error.message)}</div><p>Your current ontology has not changed.</p>`,button('cancel','Close'));}});
render();
