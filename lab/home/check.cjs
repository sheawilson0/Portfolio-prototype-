const {chromium}=require('/Users/sheawilson/Developer/device-shots/node_modules/playwright');
const path=require('path');
(async()=>{
const browser=await chromium.launch({headless:true});
const results=[];
// Reference study, as requested: actual browser rendering, not source scraping.
const reference=await browser.newPage({viewport:{width:1440,height:1000}});
await reference.goto('https://www.pengzhe.ng/',{waitUntil:'networkidle'});
console.error('Peng reference:',await reference.title(),await reference.locator('main').boundingBox());
await reference.screenshot({path:path.join(__dirname,'peng-reference.png')});await reference.close();
for(const direction of ['a','b','c']) for(const width of [1440,390]) for(const mode of ['light','dark']){
const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
await context.addInitScript(mode=>localStorage.setItem('sky-mode',mode),mode);
const page=await context.newPage(), errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(`http://127.0.0.1:4431/lab/home/${direction}.html`,{waitUntil:'networkidle'});
await page.evaluate(()=>document.fonts.ready);
// Force lazy images into view before returning to the overview.
for(const image of await page.locator('.selected img').all()) await image.scrollIntoViewIfNeeded().catch(()=>{});
await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(400);
const state=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),latest:!!document.querySelector('[data-latest] img'),projects:[...document.querySelectorAll('#work a')].map(a=>a.getAttribute('href'))}));
if(direction==='a'){await page.locator('[data-project="quit28"]').focus();if(await page.locator('[data-image="quit28"]').getAttribute('class')!=='index-image active')errors.push('Hover/focus reveal failed');await page.locator('[data-project="snapshot"]').focus();}
if(direction==='c'){const b=page.locator('.case-toggle').nth(1);await b.click();if(await b.getAttribute('aria-expanded')!=='true')errors.push('Accordion failed');await page.locator('.case-toggle').first().click();}
await page.evaluate(()=>{document.activeElement?.blur();scrollTo(0,0)});await page.waitForTimeout(350);
await page.screenshot({path:path.join(__dirname,`${direction}-${width}-${mode}.png`),fullPage:true});
results.push({direction,width,mode,...state,errors});await context.close();
}
require('fs').writeFileSync(path.join(__dirname,'check-results.json'),JSON.stringify(results,null,2)+'\n'); const failed=results.filter(r=>r.scrollWidth>r.width||r.broken.length||r.errors.length||!r.latest||(r.mode==='dark'&&r.theme!=='dark')); console.log(`${results.length} checks, ${failed.length} failures`); await browser.close();if(failed.length)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
