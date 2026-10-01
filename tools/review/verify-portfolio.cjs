/* Run with Node + Playwright available; no dependency or build step is added to the site.
   NODE_PATH=/path/to/node_modules node tools/review/verify-portfolio.cjs
   Optional: PORTFOLIO_BROWSER_PATH=/path/to/chromium PORTFOLIO_SCREENSHOTS=/tmp/review
*/
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
const root=path.resolve(__dirname,'../..');
const files=execFileSync('git',['ls-files'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const pages=files.filter(f=>f.endsWith('.html'));
const baseline=process.env.PORTFOLIO_BASE_REF||'origin/main';
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.pdf':'application/pdf','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
 const file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.PORTFOLIO_BROWSER_PATH?{executablePath:process.env.PORTFOLIO_BROWSER_PATH,args:['--use-gl=angle','--use-angle=swiftshader','--no-zygote']}:{})});
 const errors=[]; const links=new Set(); const overflow=[]; let scans=0;
 const page=await browser.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
 try{
  // The paper, all PDFs, resume generator, and numerical source blocks are immutable.
  for(const f of files.filter(f=>f.endsWith('.pdf')||f==='tools/build_public_resumes.py')){
   const old=execFileSync('git',['show',baseline+':'+f],{cwd:root,maxBuffer:64*1024*1024});
   assert.ok(old.equals(fs.readFileSync(path.join(root,f))),f+' changed');
  }
  const oldJS=execFileSync('git',['show',baseline+':assets/site.js'],{cwd:root,encoding:'utf8'});
  const newJS=fs.readFileSync(path.join(root,'assets/site.js'),'utf8');
  for(const [start,end] of [['const rows=[','const incomeButtons='],['const scenarios={','const buttons='],['const avg={','const b=root'],['const modes={','const buttons=']]){
   const block=s=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start)));
   assert.equal(block(newJS),block(oldJS),'Model constants changed: '+start);
  }
  // Preserve every original text token in order, allowing only added navigation/help.
  const tokens=s=>s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean);
  for(const file of pages){
   const old=tokens(execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}));
   const next=tokens(fs.readFileSync(path.join(root,file),'utf8'));
   let i=0; for(const word of next) if(word===old[i]) i++;
   assert.equal(i,old.length,'Original text removed or changed: '+file+' near '+old[i]);
  }
  for(const width of [1440,1024,768,390,320]){
   await page.setViewportSize({width,height:900});
   for(const file of pages){
    await page.goto(origin+'/'+file);
    scans++;
    const dims=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
    if(dims.scroll>dims.width+1) overflow.push({file,width,scroll:dims.scroll});
    assert.equal(await page.locator('[data-global-search-trigger]').count(),1,file+' missing search');
    await page.locator('[data-global-search-trigger]').click();
    await page.locator('[aria-label="Search portfolio"][type="search"]').fill('monte carlo');
    await page.waitForFunction(()=>document.querySelector('.global-search-result strong')?.textContent.includes('Modeling International'));
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#global-search-dropdown').isHidden());
    for(const href of await page.locator('a[href],link[href],script[src]').evaluateAll(els=>els.map(e=>e.href||e.src))) if(href.startsWith(origin)) links.add(href);
    if(process.env.PORTFOLIO_SCREENSHOTS && [1440,390].includes(width)){
     fs.mkdirSync(process.env.PORTFOLIO_SCREENSHOTS,{recursive:true});
     await page.screenshot({path:path.join(process.env.PORTFOLIO_SCREENSHOTS,file.replaceAll('/','-').replace('.html','')+'-'+width+'.png'),fullPage:true});
    }
   }
  }
  assert.deepEqual(overflow,[],'Horizontal page overflow');
  // Every internal file/fragment, including JS section indexes and search results.
  for(const href of links){
   const url=new URL(href); const rel=decodeURIComponent(url.pathname).slice(1)||'index.html';
   assert.ok(fs.existsSync(path.join(root,rel)),'Missing internal target: '+href);
   if(url.hash){
    await page.goto(url.href);
    assert.ok(await page.evaluate(id=>!!document.getElementById(id),decodeURIComponent(url.hash.slice(1))),'Missing fragment: '+href);
   }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+'/about.html');
  for(const chip of await page.locator('[data-global-search-query]').all()){
   const query=await chip.getAttribute('data-global-search-query');
   await chip.click();
   await page.waitForFunction(()=>!document.querySelector('#global-search-dropdown').hidden);
   assert.ok(await page.locator('.global-search-result').count()>0,'Empty capability: '+query);
   await page.keyboard.press('Escape');
   assert.ok(await chip.evaluate(el=>document.activeElement===el),'Search did not return focus: '+query);
  }
  await page.locator('.nav-toggle').click();
  assert.ok(await page.locator('.nav-pages a').first().isVisible());
  await page.locator('[data-global-search-trigger]').click();
  assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');
  const input=page.locator('input[aria-label="Search portfolio"]');
  await input.fill('finance');
  await page.waitForFunction(()=>document.querySelector('.global-search-status').textContent.includes('results'));
  await input.press('ArrowDown');
  assert.ok(await page.locator('.global-search-result').first().evaluate(el=>el===document.activeElement));
  await page.keyboard.press('ArrowUp');
  assert.ok(await input.evaluate(el=>el===document.activeElement));
  await input.fill('zzzznonexistent');
  await page.waitForFunction(()=>!document.querySelector('.global-search-empty').hidden);
  await input.fill('system');
  await page.waitForFunction(()=>document.querySelector('.global-search-result strong')?.textContent.startsWith('System'));
  await input.press('Enter');
  await page.waitForURL('**/projects/system.html');
  // Search covers archive-only projects, punctuation-bearing chips and type filters.
  await page.locator('[data-global-search-trigger]').click();
  for(const query of ['CommuteWise','Database Systems','Tableau Data Visualization']){
   await input.fill(query);
   await page.waitForFunction(q=>document.querySelector('.global-search-result strong')?.textContent===q,query);
   const href=await page.locator('.global-search-result').first().getAttribute('href');
   links.add(origin+href);
   const [file,fragment]=href.slice(1).split('#');
   assert.ok(fs.readFileSync(path.join(root,file),'utf8').includes('id="'+fragment+'"'));
  }
  await input.fill('finance');
  await page.locator('[data-global-search-type="article"]').click();
  assert.ok((await page.locator('.global-search-result-type').allTextContents()).every(t=>t==='Article'));
  await page.keyboard.press('Escape');
  await page.locator('.nav-toggle').click();
  await page.locator('.nav-pages a[href="../projects.html"]').click();
  await page.waitForURL('**/projects.html');
  for(const filter of await page.locator('[data-filter]').all()){
   const kind=await filter.getAttribute('data-filter');await filter.click();
   const kinds=await page.locator('[data-kind]:visible').evaluateAll(els=>els.map(e=>e.dataset.kind));
   assert.ok(kinds.length>0);assert.ok(kind==='all'||kinds.every(k=>k.split(' ').includes(kind)));
   assert.equal(await filter.getAttribute('aria-pressed'),'true');
  }
  await page.goto(origin+'/projects/monte-carlo.html');
  const rowsLiteral=newJS.slice(newJS.indexOf('const rows=[')+11,newJS.indexOf('const incomeButtons=')).trim().replace(/;$/,'');
  const rows=Function('return '+rowsLiteral)();
  for(const income of ['All','Low','Lower-middle','Upper-middle','High']) for(const strategy of ['All','Aggressive','Moderate','Organic']){
   await page.locator('[data-mc-income-filter="'+income+'"]').click();
   await page.locator('[data-mc-strategy-filter="'+strategy+'"]').click();
   const expected=rows.filter(r=>(income==='All'||r.income===income)&&(strategy==='All'||r.strategy===strategy));
   assert.equal(await page.locator('.mc-scenario-mark').count(),expected.length);
   const texts=await page.locator('.mc-scenario-mark title').allTextContents();
   for(let i=0;i<expected.length;i++) for(const v of [expected[i].p10,expected[i].median,expected[i].p90]) assert.ok(texts[i].includes(Math.abs(v).toFixed(1)+'M'));
  }
  await page.goto(origin+'/projects/costco-capital-budgeting.html');
  for(const [key,npv] of [['pessimistic','$4.0M'],['base','$141.0M'],['optimistic','$326.1M']]){
   await page.locator('[data-cb-scenario="'+key+'"]').click();assert.equal(await page.locator('[data-cb-npv]').textContent(),npv);
  }
  for(const driver of ['revenue','variable','capex']){await page.locator('[data-cb-driver]').selectOption(driver);assert.equal(await page.locator('[data-cb-bars] .lab-bar-row').count(),3);}
  await page.goto(origin+'/projects/costco-singapore.html');
  await page.locator('[data-weight-benefits]').fill('70');await page.locator('[data-weight-benefits]').dispatchEvent('input');
  assert.equal(await page.locator('[data-weight-total]').textContent(),'120%');
  await page.locator('[data-weight-reset]').click();assert.equal(await page.locator('[data-weight-total]').textContent(),'100%');
  await page.goto(origin+'/projects/unipath.html');
  await page.locator('[data-up-ai]').uncheck();assert.equal(await page.locator('[data-up-mode]').textContent(),'Suggested for you');
  await page.locator('[data-up-completeness]').fill('80');await page.locator('[data-up-completeness]').dispatchEvent('input');
  await page.locator('[data-up-words]').fill('60');await page.locator('[data-up-words]').dispatchEvent('input');
  await page.locator('[data-up-ai]').check();await page.locator('[data-up-optin]').check();assert.equal(await page.locator('[data-up-mode]').textContent(),'AI matched');
  await page.goto(origin+'/experience/united-indians.html');
  for(const key of ['complete','missing','fallback']){await page.locator('[data-report-mode="'+key+'"]').click();assert.equal(await page.locator('[data-report-mode="'+key+'"]').getAttribute('aria-pressed'),'true');assert.ok((await page.locator('[data-report-record]').textContent()).length>20);}
  await page.goto(origin+'/resume.html');
  assert.equal(await page.locator('.resume-choice').count(),6);
  for(const card of await page.locator('.resume-choice').all()){
   const open=card.locator('.resume-actions a').first();const download=card.locator('.resume-actions a').last();
   assert.equal(await open.getAttribute('target'),'_blank');assert.equal(await open.getAttribute('href'),await download.getAttribute('href'));
   const response=await page.request.get(await open.getAttribute('href').then(h=>new URL(h,page.url()).href));
   assert.equal(response.status(),200);assert.ok((await response.body()).subarray(0,5).toString()==='%PDF-');
   // Headless Chromium may download a PDF rather than navigate its viewer. Verify
   // activation requests the intended PDF and creates the requested new window.
   const expectedURL=new URL(await open.getAttribute('href'),page.url()).href;
   const opened=page.waitForEvent('popup');
   const requested=page.context().waitForEvent('request',req=>req.url()===expectedURL);
   await open.click();const popup=await opened;assert.equal((await requested).url(),expectedURL);await popup.close();
   const event=page.waitForEvent('download');await download.click();const dl=await event;assert.ok(dl.suggestedFilename().endsWith('.pdf'));assert.equal(await dl.failure(),null);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
  // Navigation remains reachable when JS is unavailable.
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:320,height:844}});
  const fallback=await noJS.newPage();await fallback.goto(origin+'/index.html');
  for(const link of await fallback.locator('.nav-links a').all()) assert.ok(await link.isVisible());
  await noJS.close();
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(JSON.stringify({pages:pages.length,responsiveScans:scans,widths:[1440,1024,768,390,320],internalTargets:links.size,monteCarloFilterStates:20,preserved:'All original HTML text, numerical constants, PDFs and resume generator',errors,overflow},null,2));
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
