const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const debuggingPort = 20000 + Math.floor(Math.random() * 30000);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "dcorhome-browser-"));
const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--remote-debugging-port=${debuggingPort}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);
const keepAlive = setInterval(() => {}, 1000);
const deadline = setTimeout(() => {
  console.error("Browser check timed out");
  chrome.kill();
  process.exit(1);
}, 360000);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  let ws, closeBrowser;
  try {
    let tabs;
    for (let i = 0; i < 40; i++) {
      try {
        tabs = await (
          await fetch(`http://127.0.0.1:${debuggingPort}/json`)
        ).json();
        break;
      } catch {
        await delay(250);
      }
    }
    if (!tabs) throw Error("Chrome debugging unavailable");
    ws = new WebSocket(
      tabs.find((t) => t.type === "page").webSocketDebuggerUrl,
    );
    await new Promise((r) => (ws.onopen = r));
    let id = 0;
    const pending = new Map();
    let errors = [];
    ws.onmessage = (e) => {
      const m = JSON.parse(e.data);
      if (m.id) {
        const p = pending.get(m.id);
        pending.delete(m.id);
        if(!p)return;
        m.error ? p.reject(Error(m.error.message)) : p.resolve(m.result);
      } else if (m.method === "Runtime.exceptionThrown")
        errors.push(m.params.exceptionDetails.text);
    };
    let sessionId, activeTarget;
    const call = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const requestId=++id;
        const timer=setTimeout(()=>{pending.delete(requestId);reject(Error('Browser command timed out: '+method));},20000);
        pending.set(requestId, { resolve:value=>{clearTimeout(timer);resolve(value);}, reject:error=>{clearTimeout(timer);reject(error);} });
        ws.send(
          JSON.stringify({
            id,
            method,
            params,
            ...(sessionId ? { sessionId } : {}),
          }),
        );
      });
    closeBrowser = () => {
      sessionId = undefined;
      return call("Browser.close");
    };
    const evaluate = async (expression) =>
      (
        await call("Runtime.evaluate", {
          expression,
          returnByValue: true,
          awaitPromise: true,
        })
      ).result.value;
    await call("Runtime.enable");
    await call("Page.enable");

    async function go(route, width) {
      sessionId = undefined;
      if (activeTarget)
        await call("Target.closeTarget", { targetId: activeTarget });
      activeTarget = (await call("Target.createTarget", { url: "about:blank" }))
        .targetId;
      sessionId = (
        await call("Target.attachToTarget", {
          targetId: activeTarget,
          flatten: true,
        })
      ).sessionId;
      await call("Runtime.enable");
      await call("Page.enable");
      await call("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: width < 500,
        screenWidth: width,
        screenHeight: 1000,
      });
      await call("Page.navigate", { url: (process.env.DCORHOME_TEST_BASE_URL || "http://localhost:3100") + route });
      await delay(350);
      await evaluate(
        `(()=>{for(const i of document.images)i.loading='eager';return true})()`,
      );
      await delay(500);
      // Restored client selections can replace SSR images after hydration.
      // Require the image set and its load state to settle before inspecting it.
      let previousImages='',stableImages=0;
      for (let i = 0; i < 40; i++) {
        const state=await evaluate(`({sources:[...document.images].map(i=>i.currentSrc||i.src).join('|'),complete:[...document.images].every(i=>i.complete)})`);
        stableImages=state.complete&&state.sources===previousImages?stableImages+1:0;
        previousImages=state.sources;
        if(stableImages>=2)break;
        await delay(100);
      }
      const layout = await evaluate(
        `({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>!i.naturalWidth).map(i=>i.src),vectors:[...document.images].some(i=>i.src.includes('demo-rooms'))})`,
      );
      if (layout.overflow || layout.broken.length || layout.vectors)
        throw Error(JSON.stringify({ route, width, ...layout }));
    }
    if(process.env.DCORHOME_HOME_REDESIGN){await require('./homepage-redesign-browser.cjs')({go,evaluate,call,delay});if(errors.length)throw Error(errors.join(';'));return;}
    if(process.env.DCORHOME_FABRIC_IMAGES_ONLY){await require('./fabric-image-browser-scenarios.cjs')({go,evaluate,call,delay});if(errors.length)throw Error(errors.join(';'));return;}
    if(process.env.DCORHOME_CATALOGUE_ONLY==='true'){await require('./catalogue-browser-scenarios.cjs')({go,evaluate,call,delay});if(errors.length)throw Error(errors.join(';'));return;}
    if(process.env.DCORHOME_MANUAL_ONLY==='true'){await require('./manual-browser-scenarios.cjs')({go,evaluate,call,delay});if(errors.length)throw Error(errors.join(';'));return;}
    if(process.env.DCORHOME_HOME_ONLY==='true'){
      for(const width of [390,1440]){await go('/',width);const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-review-home-${width}.png`),Buffer.from(shot.data,'base64'));console.log('Final homepage',width,'layout/assets PASS');}
      await evaluate(`document.querySelector('[data-testid="curtain-configurator"]').scrollIntoView({block:'center',behavior:'instant'})`);await delay(100);const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-review-green-1440.png'),Buffer.from(shot.data,'base64'));return;
    }
    if(process.env.DCORHOME_LARGE_ONLY==='true'){
      for(const route of ['/','/collections','/studio','/measure','/contact']){await go(route,1920);console.log(route,'1920 layout/assets PASS');}
      return;
    }
    if(process.env.DCORHOME_TEST_UI==='true'){
      const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(150);}throw Error('UI fixture wait failed: '+expression);};
      await go('/studio?fabric=clay&configuratorFabric=Velvet&configuratorStyle=Pinch%20Pleat&heading=Pinch%20Pleat&color=%23747a50&sheerColor=%23eee3c9&roomType=Bedroom&layers=Layered%20sheer%20and%20drape&pattern=Solid&mode=upload',1440);
      await waitFor(`![...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate AI design'))?.disabled && false`.replace(" && false"," || document.body.textContent.includes('Upload your own photograph to begin')"));
      await evaluate(`(async()=>{const blob=await fetch('/images/hero-room-before.webp').then(r=>r.blob());const transfer=new DataTransfer();transfer.items.add(new File([blob],'test-room.webp',{type:'image/webp'}));const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await waitFor(`!!document.querySelector('img[alt="Your uploaded room"]')`);
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate AI design')).click()`);
      await waitFor(`!!document.querySelector('[data-testid=curtain-comparison]') && [...document.images].some(i=>i.src.startsWith('data:image/webp'))`);
      await evaluate(`document.querySelector('[data-testid=curtain-comparison]').scrollIntoView({block:'center',behavior:'instant'})`);
      const resultShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-review-fixture-result-1440.png'),Buffer.from(resultShot.data,'base64'));
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Save design').click()`);
      await waitFor(`document.body.textContent.includes('Saved privately')`);
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Create public result link').click()`);
      await waitFor(`!!document.querySelector('[aria-label="Public result link"]')`);
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Revoke public links').click()`);
      await waitFor(`document.body.textContent.includes('were revoked')`);
      await go('/designs',390);await waitFor(`document.querySelectorAll('article').length>0`);
      const remoteQuery=await evaluate(`new URL([...document.querySelectorAll('article a')].find(a=>a.textContent==='Reopen').href).search`);
      await go('/studio'+remoteQuery,1440);await waitFor(`!!document.querySelector('[data-testid=curtain-comparison]')`);
      if(!(await evaluate(`document.querySelectorAll('[data-testid=curtain-comparison] img')[0].src.includes('/api/designs/')`)))throw Error('Private result restore failed');
      const enquiryPath=await evaluate(`(()=>{const a=[...document.querySelectorAll('a')].find(a=>a.textContent==='Enquire about this design');const u=new URL(a.href);return u.pathname+u.search})()`);
      await go(enquiryPath,390);
      await delay(200);
      if(!(await evaluate(`document.querySelectorAll('select')[1].selectedOptions[0]?.textContent==='Velvet, softly'`)))throw Error('Consultation fabric handoff failed');
      await evaluate(`(async()=>{const inputs=document.querySelectorAll('form input');for(const [i,value] of [[0,'Fixture UI enquiry'],[1,'fixture-ui@example.com']]){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[i],value);inputs[i].dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,20));}document.querySelector('input[type=checkbox]').click();})()`);
      await evaluate(`document.querySelector('form').requestSubmit()`);
      await waitFor(`document.body.textContent.includes('Your consultation request was saved')`);
      await go('/admin',1440);
      await evaluate(`(()=>{const i=document.querySelector('input[type=password]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(i,${JSON.stringify(process.env.DCORHOME_TEST_ADMIN_PASSWORD)});i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await delay(80);await evaluate(`document.querySelector('form').requestSubmit()`);
      await waitFor(`document.body.textContent.includes('Catalogue & editorial')`);
      const adminShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-review-fixture-admin-1440.png'),Buffer.from(adminShot.data,'base64'));
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Manage design options').click()`);
      if(!(await evaluate(`document.querySelector('textarea').value.includes('patterns')`)))throw Error('Admin editor failed');
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Sign out').click()`);
      await waitFor(`!!document.querySelector('input[type=password]')`);
      if(errors.length)throw Error(errors.join(';'));
      console.log('Fixture UI generation/result, private save/history/reopen, share/revoke, admin sign-in/editor/sign-out PASS (mock provider)');return;
    }
    for (const route of [
      "/",
      "/collections",
      "/studio",
      "/studio?mode=sample",
      "/measure",
      "/contact",
      "/designs", "/faq", "/how-it-works", "/inspiration", "/inspiration/choosing-living-room-curtains", "/collections/sienna", "/privacy", "/terms", "/admin",
    ])
      for (const width of [360, 390, 768, 1024, 1440]) {
        await go(route, width);
        console.log(route, width, "layout/assets PASS");
        if (
          (route === "/" && [390, 1440].includes(width)) ||
          ([390, 1440].includes(width) && route !== "/")
        ) {
          const screenshot = await call("Page.captureScreenshot", {
            format: "png",
          });
          const name = route === "/" ? "home" : route.slice(1).replace(/[^a-zA-Z0-9-]/g, "-");
          fs.writeFileSync(
            path.join(os.tmpdir(), `dcorhome-review-${name}-${width}.png`),
            Buffer.from(screenshot.data, "base64"),
          );
        }
      }
    await go("/", 1440);
    const reveal = () => evaluate(`parseFloat(document.querySelector('[data-testid=curtain-comparison]').style.getPropertyValue('--reveal'))`);
    const initial = await reveal();
    await delay(500);
    if ((await reveal()) <= initial) throw Error("Autoplay did not start rightward");
    await delay(2000);
    const nearRight = await reveal();
    await delay(3000);
    if (nearRight < 80 || (await reveal()) >= nearRight) throw Error("Autoplay did not reverse");
    await evaluate(`document.querySelector('[aria-label="Pause automatic comparison"]').click()`);
    const pausedAt = await reveal();
    await delay(500);
    if (Math.abs((await reveal())-pausedAt)>.01) throw Error("Explicit pause failed");
    const autoRect=await evaluate(`(()=>{const r=document.querySelector('[data-testid=curtain-comparison]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
    const dragAuto = async (f) => {
      for (const type of ["mousePressed","mouseMoved","mouseReleased"]) await call("Input.dispatchMouseEvent",{type,x:autoRect.x+autoRect.w*f,y:autoRect.y+autoRect.h*.5,button:"left",buttons:type==="mouseReleased"?0:1,clickCount:1});
    };
    await dragAuto(.25);
    await delay(5000);
    if (Math.abs((await reveal())-25)>.2) throw Error("Manual input overrode explicit paused state");
    await evaluate(`document.querySelector('[aria-label="Play automatic comparison"]').click()`);
    await delay(300);
    await dragAuto(.4);
    await delay(4200);
    if (Math.abs((await reveal())-40)>.2) throw Error("Idle delay or direct drag failed");
    await delay(400);
    if (Math.abs((await reveal())-40)>1) throw Error("Resume jumped");
    await delay(900);
    if (Math.abs((await reveal())-40)<1) throw Error("Autoplay failed to resume");
    await evaluate(`document.querySelector('[role=slider]').focus()`);
    const focusedAt=await reveal();
    await delay(5000);
    if (Math.abs((await reveal())-focusedAt)>.01) throw Error("Keyboard focus failed to stop autoplay");
    await evaluate(`document.querySelector('[role=slider]').blur()`);
    await call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
    const reducedAt=await reveal();
    await delay(600);
    if (Math.abs((await reveal())-reducedAt)>.01) throw Error("Reduced motion autoplay failed");
    await call("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
    await delay(4500);
    await evaluate(`window.scrollTo({top:document.body.scrollHeight,behavior:'instant'})`);
    await delay(200);
    const offscreenAt=await reveal();
    await delay(500);
    if (Math.abs((await reveal())-offscreenAt)>.01) throw Error("Offscreen playback continued");
    await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);
    await delay(300);
    await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))`);
    const hiddenAt=await reveal();
    await delay(500);
    if (Math.abs((await reveal())-hiddenAt)>.01) throw Error("Hidden-tab signal did not stop playback");
    await evaluate(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))`);
    console.log("Autoplay start/reverse, explicit pause, manual idle/resume continuity, focus, reduced motion, offscreen and visibility-signal checks PASS");
    if (!(await evaluate(`(()=>{const frames=[...document.querySelectorAll('[data-testid=curtain-comparison]')];return frames.length===1 && frames.every(f=>{const i=[...f.querySelectorAll('img')];return i.length===2 && i[0].currentSrc!==i[1].currentSrc && i[0].naturalWidth===i[1].naturalWidth && i[0].naturalHeight===i[1].naturalHeight}) && [...document.querySelectorAll('h1,h2')].every(h=>getComputedStyle(h).fontFamily.includes('DM Sans')) && !document.body.innerText.includes('matched before/after edit is pending')})()`))) throw Error("Comparison sources or typography failed");
    await evaluate(`document.querySelector('[data-testid="curtain-configurator"]').scrollIntoView({block:'start',behavior:'instant'})`);
    console.log('Manual configurator: run DCORHOME_MANUAL_ONLY=true for pixel isolation and handoff coverage');
    await evaluate(
      `document.querySelector('[data-testid=curtain-comparison]').scrollIntoView({block:'center',behavior:'instant'})`,
    );
    await delay(100);
    const rect = await evaluate(
      `(()=>{const r=document.querySelector('[data-testid=curtain-comparison]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`,
    );
    for (const [type, f] of [
      ["mousePressed", 0.3],
      ["mouseMoved", 0.7],
      ["mouseReleased", 0.7],
    ])
      await call("Input.dispatchMouseEvent", {
        type,
        x: rect.x + rect.w * f,
        y: rect.y + rect.h * 0.5,
        button: "left",
        buttons: type === "mouseReleased" ? 0 : 1,
        clickCount: 1,
      });
    let value = await evaluate(
      `Number(document.querySelector('[role=slider]').getAttribute('aria-valuenow'))`,
    );
    if (Math.abs(value - 70) > 1)
      throw Error("Mouse comparison failed " + value);
    await evaluate(`document.querySelector('[role=slider]').focus()`);
    for (const [key, expected] of [
      ["Home", 0],
      ["End", 100],
      ["ArrowLeft", 98],
    ]) {
      await call("Input.dispatchKeyEvent", { type: "keyDown", key, code: key });
      value = await evaluate(
        `Number(document.querySelector('[role=slider]').getAttribute('aria-valuenow'))`,
      );
      if (value !== expected) throw Error("Keyboard " + key + " failed");
    }
    console.log("Mouse drag and Home/End/arrow controls PASS");
    await evaluate(
      `document.querySelectorAll('[data-testid=fabric-choices] button')[3].click()`,
    );
    await delay(100);
    if (
      !(await evaluate(
        `document.querySelector('[data-testid=fabric-detail] h3').textContent.includes('Velvet')`,
      ))
    )
      throw Error("Fabric selection failed");
    console.log("Photographic fabric selection PASS");
    await go("/", 390);
    await call("Emulation.setTouchEmulationEnabled", { enabled: true });
    await evaluate(
      `document.querySelector('[data-testid=curtain-comparison]').scrollIntoView({block:'center',behavior:'instant'})`,
    );
    await delay(100);
    const touch = await evaluate(
      `(()=>{const r=document.querySelector('[data-testid=curtain-comparison]').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`,
    );
    for (const [type, f] of [
      ["touchStart", 0.25],
      ["touchMove", 0.75],
      ["touchEnd", 0.75],
    ])
      await call("Input.dispatchTouchEvent", {
        type,
        touchPoints:
          type === "touchEnd"
            ? []
            : [{ x: touch.x + touch.w * f, y: touch.y + touch.h * 0.5 }],
      });
    value = await evaluate(
      `Number(document.querySelector('[role=slider]').getAttribute('aria-valuenow'))`,
    );
    if (Math.abs(value - 75) > 2)
      throw Error("Touch comparison failed " + value);
    console.log("Emulated touch drag PASS");
    await call("Emulation.setTouchEmulationEnabled", { enabled: false });
    await evaluate(
      `document.querySelector('[aria-label="Open navigation"]').click()`,
    );
    await delay(50);
    if (
      !(await evaluate(
        `document.querySelector('nav[aria-label="Mobile navigation"]')?.getAttribute("aria-hidden")==="false"`,
      ))
    )
      throw Error("Mobile menu failed");
    await call("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
    });
    await delay(50);
    if (
      await evaluate(
        `document.querySelector('nav[aria-label="Mobile navigation"]')?.getAttribute("aria-hidden")==="false"`,
      )
    )
      throw Error("Mobile menu Escape failed");
    if (!(await evaluate(`document.activeElement===document.querySelector('[aria-label="Open navigation"]')`))) throw Error("Escape focus return failed");
    await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
    await delay(250);
    if (!(await evaluate(`document.activeElement===document.querySelector('nav[aria-label="Mobile navigation"] a')`))) throw Error("Menu initial focus failed");
    const menuShot = await call("Page.captureScreenshot", {format:"png"});
    fs.writeFileSync(path.join(os.tmpdir(),"dcorhome-review-menu-390.png"),Buffer.from(menuShot.data,"base64"));
    await call("Input.dispatchKeyEvent", {type:"keyDown", key:"Escape", code:"Escape"});
    console.log("Mobile navigation and focus PASS");
    await go("/collections", 390);
    await evaluate(
      `(()=>{const s=document.querySelector('select[aria-label="Fabric category"]');s.value='Linen';s.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await delay(50);
    if (
      !(await evaluate(
        `document.querySelectorAll('article').length>0&&document.querySelectorAll('article').length<8`,
      ))
    )
      throw Error("Catalogue filter failed");
    console.log("Catalogue filtering PASS");
    await go("/studio?mode=upload", 1440);
    if (await evaluate(`!!document.querySelector('[data-heading]')`))
      throw Error("Sketch should not appear by default");
    await evaluate(
      `(async()=>{const blob=await fetch('/images/hero-room-before.webp').then(r=>r.blob());const transfer=new DataTransfer();transfer.items.add(new File([blob],'verification-room.webp',{type:'image/webp'}));const input=document.querySelector('input[type=file]');input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
    );
    await delay(100);
    if (
      !(await evaluate(
        `document.querySelector('img[alt="Your uploaded room"]')?.src.startsWith('blob:')`,
      ))
    )
      throw Error("Room upload failed");
    await evaluate(
      `document.querySelector('[aria-label="Preview mode"] button:nth-child(2)').click()`,
    );
    await delay(50);
    if (!(await evaluate(`!!document.querySelector('[data-heading]')`)))
      throw Error("Explicit sketch preview failed");
    await evaluate(`(()=>{document.querySelector('section.bg-ink details').open=true;const s=document.querySelector('select[aria-label=\"main heading\"]');s.value='Eyelet';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    await delay(50);
    if (
      !(await evaluate(
        `document.querySelector('[data-heading]')?.dataset.heading==='Eyelet'`,
      ))
    )
      throw Error("Studio heading selection failed");
    console.log(
      "Studio original/sketch modes, upload and heading selection PASS",
    );
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Save direction').click()`);
    await delay(600);
    if(!(await evaluate(`document.body.textContent.includes('Saved on this device')`)))throw Error('Local design save failed');
    await go('/designs',390);
    if(!(await evaluate(`document.querySelectorAll('article').length>0`)))throw Error('Saved design list empty');
    const reopen=await evaluate(`new URL([...document.querySelectorAll('article a')].find(a=>a.textContent==='Reopen').href).search`);
    await go('/studio'+reopen,390);
    await delay(700);
    if(!(await evaluate(`document.querySelector('img[alt="Your uploaded room"]')?.src.startsWith('blob:')`)))throw Error('Saved direction reopen failed');
    await go('/designs',390);
    await evaluate(`document.querySelector('article button').click()`);await delay(300);
    if(await evaluate(`document.querySelectorAll('article').length>0`))throw Error('Local design deletion failed');
    console.log('Browser-local direction save/list/reopen/delete PASS');
    await go("/measure", 390);
    await evaluate(
      `(()=>{const e=[...document.querySelectorAll('input[type=number]')].find(i=>i.closest('label').textContent.includes('Track / rod'));Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'280');e.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
    await delay(50);
    if (!(await evaluate(`document.body.textContent.includes('10.8 m')`)))
      throw Error("Measurement calculation failed");
    if (
      !(await evaluate(`document.body.textContent.includes('Rate on enquiry')`))
    )
      throw Error("Measurement must not invent a price");
    console.log("Measurement calculation and unpriced state PASS");
    await go("/contact", 390);
    if (await evaluate(`document.querySelector('form').checkValidity()`))
      throw Error("Empty consultation must fail validation");
    await evaluate(
      `(async()=>{const inputs=document.querySelectorAll('form input');for(const [index,value]of [[0,'Browser verification'],[1,'verification@example.com']]){Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(inputs[index],value);inputs[index].dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,10));}document.querySelector('input[type=checkbox]').click();window.originalFetch=window.fetch;window.fetch=async()=>new Response(JSON.stringify({error:'Verification: delivery unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});})()`,
    );
    await evaluate(`document.querySelector('form').requestSubmit()`);
    await delay(100);
    if (
      !(await evaluate(
        `document.querySelector('[role=status]')?.textContent.includes('Verification: delivery unavailable')`,
      ))
    )
      throw Error("Consultation error state failed");
    await evaluate(`window.fetch=window.originalFetch`);
    console.log("Consultation validation/error PASS (mocked; no enquiry sent)");
    await call("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
    if (
      !(await evaluate(
        `getComputedStyle(document.documentElement).scrollBehavior==='auto'`,
      ))
    )
      throw Error("Reduced motion failed");
    if (errors.length) throw Error(errors.join(";"));
    console.log("Reduced motion and no browser runtime exceptions PASS");
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    clearInterval(keepAlive);
    clearTimeout(deadline);
    try {
      await closeBrowser?.();
    } catch {}
    ws?.close();
    chrome.kill();
  }
})();
