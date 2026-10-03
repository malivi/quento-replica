import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
console.log('Launching browser');
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'chrome', headless: true });
console.log('Browser launched');
const context = await browser.newContext({ viewport: {width:1440,height:1100}, acceptDownloads:true });
const page = await context.newPage();page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base=process.env.BASE_URL||'http://127.0.0.1:4173/';
const act=(action)=>page.locator(`[data-action="${action}"]`);
async function example(){await act('example').first().click();await page.getByRole('button',{name:'Replace & open'}).click();await page.getByRole('heading',{name:'Knowledge ecosystem'}).waitFor();}
async function select(name){await page.getByRole('button',{name:`Inspect ${name}`,exact:true}).click();}
try {
  console.log('Loading',base);await page.goto(base);await page.getByRole('heading',{name:'Start with a single concept.'}).waitFor();
  await example();console.log('Example loaded');
  assert.equal(await page.locator('.entity-table tbody tr').count(),19);
  await select('Dataset');assert.match(await page.locator('#details').innerText(),/Digital asset/);assert.match(await page.locator('#details').innerText(),/Knowledge resource/);
  await act('edit').click();await page.locator('#f-label').fill('Research dataset');await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await page.getByRole('heading',{name:'Research dataset',exact:true}).waitFor();
  await act('undo').click();await page.getByRole('heading',{name:'Dataset',exact:true}).waitFor();await act('redo').click();await page.getByRole('heading',{name:'Research dataset',exact:true}).waitFor();
  console.log('Rename and undo verified');
  // Cycle errors leave the active document untouched.
  await select('Asset');await act('edit').click();await page.locator('input[name="parentIds"][value="dataset"]').check();await page.getByRole('button',{name:'Save changes',exact:true}).click();assert.match(await page.locator('#form-error').innerText(),/cycle/);
  page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Cancel',exact:true}).click();
  // Blocking deletion of a concept with its last membership.
  await select('Research dataset');await act('delete').click();assert.match(await page.locator('#modal').innerText(),/last concept membership/);await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.getByLabel('Search ontology',{exact:true}).fill('Data collection');assert.equal(await page.locator('.entity-table tbody tr').count(),1);await page.getByLabel('Search ontology',{exact:true}).fill('');
  await page.locator('[data-action="view"][data-value="hierarchy"]').click();assert.equal(await page.locator('.tree [data-id="dataset"]').count(),2);
  await page.locator('[data-action="view"][data-value="graph"]').click();await page.locator('#graph').waitFor();assert.equal(await page.locator('.graph-node').count(),12);await act('zoom-in').click();await act('fit').click();
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/desktop.png',fullPage:true});
  console.log('Hierarchy and graph verified');
  // Reload uses the successfully persisted revision.
  await page.reload();await page.getByRole('heading',{name:'Knowledge ecosystem'}).waitFor();await select('Research dataset');
  // Create concept, instance, type, then an assertion through the UI.
  async function create(kind){await act('add').click();await page.locator(`[data-action="create"][data-value="${kind}"]`).click();}
  await create('concepts');await page.locator('#f-label').fill('Place');await page.getByLabel('Description',{exact:true}).fill('A physical location.');await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await create('instances');await page.locator('#f-label').fill('Athens');await page.getByLabel('Description',{exact:true}).fill('A city.');await page.locator('.pick-option').filter({hasText:'Place'}).locator('input').check();await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await create('relationshipTypes');await page.locator('#f-label').fill('located in');await page.getByLabel('Description',{exact:true}).fill('Has a location.');await page.getByLabel('Source kind',{exact:true}).selectOption('instance');await page.getByLabel('Target kind',{exact:true}).selectOption('instance');await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await create('assertions');await page.locator('#f-typeId').selectOption({label:await page.locator('#f-typeId option').filter({hasText:'located in'}).innerText()});
  await page.locator('input[name="sourceId"][value="mira"]').check();await page.locator('.pick-option').filter({hasText:'Athens'}).locator('input[name="targetId"]').check();await page.getByRole('button',{name:'Save changes',exact:true}).click();
  assert.match(await page.locator('#details').innerText(),/located in/);
  console.log('CRUD verified');
  // Invalid import must not replace the current ontology.
  await page.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":99}')});await page.getByRole('heading',{name:'Import could not be completed'}).waitFor();await page.getByRole('button',{name:'Close',exact:true}).click();assert.equal(await page.locator('h1').innerText(),'Knowledge ecosystem');
  // Export/import exact round trip.
  const pendingDownload=page.waitForEvent('download');await act('export').first().click();const download=await pendingDownload;const path=await download.path();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontology-studio.document.v1')).document);
  await page.locator('#import-file').setInputFiles(path);await page.getByRole('heading',{name:'Import ontology',exact:true}).waitFor();await page.getByRole('button',{name:'Replace & open'}).click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent.includes('Saved locally'));
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('ontology-studio.document.v1')).document);assert.deepEqual(after,before);
  console.log('Round trip verified');
  // Multi-tab revision conflicts pause stale writes.
  const second=await context.newPage();await second.goto(base);await act('metadata').click();await page.locator('#f-title').fill('Updated in first tab');await page.getByRole('button',{name:'Save changes',exact:true}).click();await second.getByRole('alert').filter({hasText:'Another tab'}).waitFor();await second.close();
  // Text remains inert.
  await create('concepts');await page.locator('#f-label').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Save changes',exact:true}).click();assert.equal(await page.locator('#details img').count(),0);
  // Phone layout has no document overflow; entity actions remain reachable.
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.setViewportSize({width:360,height:800});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:await browser.version(),checks:'CRUD, hierarchy, cycle rejection, deletion protection, undo/redo, graph, alias search, persistence, import failure, exact JSON round trip, multi-tab conflict, XSS, 360px/390px layouts',consoleErrors:errors},null,2));
} catch(error) { await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/failure.png',fullPage:true});console.log('Page errors',errors);throw error; } finally { await browser.close(); }
