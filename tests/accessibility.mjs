import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const reports=[];
async function scan(name){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();reports.push({name,violations:result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
try{
  await page.goto('http://127.0.0.1:4173/');await scan('empty');
  await page.locator('[data-action="example"]').first().click();await page.getByRole('button',{name:'Replace & open'}).click();await scan('list');
  await page.getByRole('button',{name:'Inspect Dataset',exact:true}).click();await scan('details');
  await page.locator('[data-action="edit"]').click();await scan('form');await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.locator('[data-action="view"][data-value="graph"]').click();await scan('graph');
  await page.setViewportSize({width:360,height:800});await scan('mobile');
  console.log(JSON.stringify(reports,null,2));assert.equal(reports.flatMap(r=>r.violations).length,0);
}finally{await browser.close();}
