/**
 * ThreadLabs cinematic acceptance captures. Run only against the intended app.
 *   node scripts/cinematic-browser-qa.mjs [http://127.0.0.1:5173]
 *   node scripts/cinematic-browser-qa.mjs http://127.0.0.1:5173/ --active-only
 * Optional: QA_OUTPUT=docs/cinematic-reconstruction/qa-live to keep separate runs.
 * Native scrolling only; never changes renderer state or master timeline values.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const { chromium } = await import('playwright').catch(() => import(pathToFileURL(resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')).href));

const url = process.argv[2] || 'http://127.0.0.1:5173/';
const activeOnly = process.argv.includes('--active-only');
const output = resolve(process.env.QA_OUTPUT || 'docs/cinematic-reconstruction/qa');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist'],
});
const report = { url, startedAt: new Date().toISOString(), browser: await browser.version(), cases: {}, errors: [], warnings: [], failedRequests: [], assetResponses: [], httpErrors: [], assertions: [] };
const captureName = (prefix, p) => `${prefix}-${p.toFixed(4).replace('.', '-')}.png`;
function assert(condition, name, details = null) {
  report.assertions.push({ name, pass: Boolean(condition), details });
  if (!condition) console.error(`FAIL: ${name}`, details || '');
}
function watch(page, label) {
  page.on('pageerror', e => report.errors.push({ label, message: e.message, stack: e.stack }));
  page.on('console', msg => {
    if (msg.type() === 'error') report.errors.push({ label, message: msg.text(), location: msg.location() });
    if (msg.type() === 'warning') report.warnings.push({ label, message: msg.text() });
  });
  page.on('requestfailed', req => report.failedRequests.push({ label, url: req.url(), error: req.failure()?.errorText }));
  page.on('response', async r => {
    if (r.url().includes('/cinematic/')) report.assetResponses.push({ label, url: r.url(), status: r.status(), contentType: r.headers()['content-type'] });
    if (r.status() >= 400) report.httpErrors.push({label,url:r.url(),status:r.status()});
  });
}
async function diagnostic(page) {
  return page.evaluate(() => ({
    ...window.__threadlabsCinematic,
    scrollY, viewport: [innerWidth, innerHeight],
    documentWidth: document.documentElement.scrollWidth,
    canvasReady: document.querySelector('.cinematic-scroll-shell canvas')?.dataset.ready,
    canvasCount: document.querySelectorAll('.cinematic-scroll-shell canvas').length,
    fallback: [...document.querySelectorAll('.cinematic-fallback')].some(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0),
    bodyText: document.body.innerText.slice(0, 300),
  }));
}
async function scrollToProgress(page, progress) {
  const target = await page.evaluate(p => {
    const shell = document.querySelector('.cinematic-scroll-shell');
    if (!shell) throw new Error('Missing .cinematic-scroll-shell');
    const top = shell.getBoundingClientRect().top + scrollY;
    const range = shell.offsetHeight - innerHeight;
    scrollTo({ top: top + Math.max(0, range) * Math.min(p, .99999), behavior: 'instant' });
    return Math.max(0, Math.min(1, (scrollY - top) / range));
  }, progress);
  const settleStarted = Date.now();
  let settled = true;
  try {
    await page.waitForFunction(p => {
      const d = window.__threadlabsCinematic;
      return d && Number.isFinite(d.progress) && Math.abs(d.progress - p) < .00001;
    }, target, { timeout: 6000, polling: 'raf' });
  } catch { settled = false; }
  await page.waitForTimeout(160);
  return { requestedProgress: progress, nativeTarget: target, settled, settlingMs: Date.now() - settleStarted, ...await diagnostic(page) };
}
async function ready(page) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.cinematic-scroll-shell').waitFor({ timeout: 30000 });
  await page.locator('.cinematic-scroll-shell canvas[data-ready="true"]').waitFor({ timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
}
async function comparePNGs(page, a, b) {
  const first = (await readFile(a)).toString('base64'), second = (await readFile(b)).toString('base64');
  return page.evaluate(async ({ first, second }) => {
    async function decode(base64) {
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = new OffscreenCanvas(image.width, image.height);
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return { data: context.getImageData(0, 0, image.width, image.height).data, width: image.width, height: image.height };
    }
    const a = await decode(first), b = await decode(second);
    if (a.width !== b.width || a.height !== b.height) return { comparable: false };
    let sum = 0, changedPixels = 0;
    for (let i = 0; i < a.data.length; i += 4) {
      const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i+1] - b.data[i+1]) + Math.abs(a.data[i+2] - b.data[i+2]);
      sum += d; if (d > 24) changedPixels++;
    }
    return { comparable: true, meanAbsoluteChannelDifference: sum / (a.width * a.height * 3), changedPixelFraction: changedPixels / (a.width * a.height), thresholdPerPixel: 24 };
  }, { first, second });
}
async function frameSample(page) {
  return page.evaluate(() => new Promise(resolve => {
    const deltas = []; let last;
    function sample(t) { if (last !== undefined) deltas.push(t - last); last = t; if (deltas.length < 90) requestAnimationFrame(sample); else { const sorted = [...deltas].sort((a,b) => a-b); resolve({ count: deltas.length, medianMs: sorted[Math.floor(sorted.length*.5)], p95Ms: sorted[Math.floor(sorted.length*.95)], maxMs: Math.max(...deltas) }); } }
    requestAnimationFrame(sample);
  }));
}
async function activeScrollSample(page) {
  return page.evaluate(() => new Promise(resolve => {
    const shell = document.querySelector('.cinematic-scroll-shell');
    const top = shell.getBoundingClientRect().top + scrollY, range = shell.offsetHeight - innerHeight;
    const samples = []; let last, i = 0;
    function frame(t) {
      if (last !== undefined) {
        const d = window.__threadlabsCinematic || {};
        samples.push({ intervalMs: t - last, progress: d.progress, renderCpuMs: d.frameMs, drawCalls: d.drawCalls, triangles: d.triangles });
      }
      last = t;
      // Two natural native-scroll passes through approach, hold, and release.
      const phase = i < 180 ? i / 179 : 1 - (i - 180) / 179;
      scrollTo({ top: top + range * (.08 + .16 * phase), behavior: 'instant' });
      if (++i <= 360) requestAnimationFrame(frame);
      else {
        const summarize = key => {
          const values = samples.map(s => s[key]).filter(Number.isFinite).sort((a,b) => a-b);
          return { median: values[Math.floor(values.length*.5)], p95: values[Math.floor(values.length*.95)], max: values.at(-1) };
        };
        resolve({ direction: 'forward .08→.24 over180RAF; reverse .24→.08 over180RAF', count: samples.length, rAF: summarize('intervalMs'), renderCpu: summarize('renderCpuMs'), drawCalls: summarize('drawCalls'), triangles: summarize('triangles'), samples });
      }
    }
    requestAnimationFrame(frame);
  }));
}
async function captureActiveCases() {
  for (const [name, viewport] of [['desktop-active',{width:1440,height:900}],['mobile-active',{width:390,height:844}]]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor:1, reducedMotion:'no-preference' });
    const page = await context.newPage(); watch(page,name); await ready(page);
    const c = report.cases[name] = { viewport, captures:[], activePerformance:null };
    await scrollToProgress(page,.08);
    c.activePerformance = await activeScrollSample(page);
    console.log(name,JSON.stringify({...c.activePerformance,samples:undefined}));
    for (const p of [.11,.35,.55,.75]) {
      const state = await scrollToProgress(page,p), filename=captureName(name,p);
      await page.screenshot({path:resolve(output,filename),animations:'disabled'});
      c.captures.push({filename,...state});
    }
    assert(c.captures.every(s=>s.settled),`${name}: comparison captures settle`);
    await context.close();
  }
}
async function captureCase(name, viewport, positions, reversePositions) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await context.newPage(); watch(page, name);
  const record = report.cases[name] = { viewport, captures: [], reverse: [], performance: null };
  await ready(page);
  if (name === 'desktop') {
    record.earlyHand = await scrollToProgress(page, .14);
    const earlyPath = resolve(output, 'desktop-hand-early.png');
    await page.screenshot({ path: earlyPath, animations: 'disabled' });
    console.log(`EARLY_HAND_CAPTURE ${earlyPath} ${JSON.stringify(record.earlyHand)}`);
  }
  const files = new Map();
  for (const p of positions) {
    const state = await scrollToProgress(page, p), filename = captureName(name, p);
    await page.screenshot({ path: resolve(output, filename), animations: 'disabled' });
    record.captures.push({ filename, ...state }); files.set(p, resolve(output, filename));
    console.log(`${name} ${p.toFixed(4)} ${state.settled ? 'settled' : 'UNSETTLED'} ${state.assetsLoaded ?? ''}`);
  }
  record.performance = await frameSample(page);
  for (const p of reversePositions) {
    const state = await scrollToProgress(page, p), filename = captureName(`${name}-reverse`, p);
    await page.screenshot({ path: resolve(output, filename), animations: 'disabled' });
    const pixelDifference = await comparePNGs(page, files.get(p), resolve(output, filename));
    record.reverse.push({ filename, ...state, pixelDifference });
  }
  assert(record.captures.every(c => c.settled), `${name}: deterministic progress settles`, record.captures.filter(c => !c.settled).map(c => [c.requestedProgress, c.progress]));
  assert(record.captures.every(c => c.documentWidth <= viewport.width + 1), `${name}: no horizontal overflow`);
  assert(record.reverse.every(c => c.pixelDifference.comparable && c.pixelDifference.meanAbsoluteChannelDifference < 3), `${name}: reverse image repeatability`, record.reverse.map(c => ({ progress: c.requestedProgress, ...c.pixelDifference })));
  const contacts = record.captures.filter(c => c.requestedProgress >= .13 && c.requestedProgress <= .2).map(c => c.handContactDistance).filter(Number.isFinite);
  record.handContactDistances = contacts;
  // Resize while in the sequence and verify the normalized state survives.
  await scrollToProgress(page, .5);
  await page.setViewportSize({ width: viewport.width - 30, height: viewport.height - 40 });
  await page.waitForTimeout(350);
  record.afterResize = await diagnostic(page);
  await page.screenshot({ path: resolve(output, `${name}-resize.png`) });
  // Exercise context loss as the final destructive browser-local test.
  record.contextLoss = await page.evaluate(() => {
    const canvas = document.querySelector('.cinematic-scroll-shell canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    const extension = gl?.getExtension('WEBGL_lose_context');
    if (extension) { extension.loseContext(); return { supported: true }; }
    return { supported: false };
  });
  await page.waitForTimeout(400);
  record.contextLoss.after = await diagnostic(page);
  await page.screenshot({ path: resolve(output, `${name}-context-loss.png`) });
  await context.close();
}

try {
  if (activeOnly) {
    await captureActiveCases();
  } else {
  // 31 evenly spaced states + all requested hand beats, with 5 repeatability anchors.
  const uniform = Array.from({ length: 31 }, (_, i) => Number((i / 30).toFixed(6)));
  const hand = [.09, .11, .13, .16, .2, .23];
  const anchors = [.1, .2, .5, .8, .9];
  const desktop = [...new Set([...uniform, ...hand, ...anchors])].sort((a,b) => a-b);
  await captureCase('desktop', { width: 1440, height: 900 }, desktop, [...anchors].reverse());
  const mobile = [0,.09,.13,.16,.2,.23,.35,.5,.65,.8,.9,1];
  await captureCase('mobile', { width: 390, height: 844 }, mobile, [.9,.8,.5,.2]);
  const reducedContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const reduced = await reducedContext.newPage(); watch(reduced, 'reduced-motion');
  await reduced.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await reduced.waitForTimeout(500);
  report.cases.reducedMotion = await diagnostic(reduced);
  report.cases.reducedMotion.linkCount = await reduced.locator('a,button').count();
  await reduced.screenshot({ path: resolve(output, 'reduced-motion.png') });
  assert(report.cases.reducedMotion.linkCount > 0, 'Reduced motion: navigation remains available');
  await reducedContext.close();
  }
  assert(!report.assetResponses.some(r => r.status >= 400), 'Cinematic assets return successfully', report.assetResponses.filter(r => r.status >= 400));
  // Context loss produces a normal Three.js warning; preserve all logs for review.
  assert(!report.errors.some(e => !/context lost|ERR_ABORTED/i.test(e.message)), 'No unexpected page or console errors', report.errors);
} catch (e) {
  report.fatal = { message: e.message, stack: e.stack };
  console.error(e);
} finally {
  report.finishedAt = new Date().toISOString();
  report.pass = !report.fatal && report.assertions.every(a => a.pass);
  await writeFile(resolve(output, activeOnly ? 'active-browser-qa.json' : 'browser-qa.json'), JSON.stringify(report, null, 2));
  // Self-contained visual index works in any browser; no image library required.
  const all = Object.entries(report.cases).flatMap(([name, c]) => (c.captures || []).map(s => ({ name, ...s })));
  await writeFile(resolve(output, activeOnly ? 'active-index.html' : 'index.html'), `<!doctype html><html><meta charset="utf-8"><title>ThreadLabs cinematic QA</title><style>body{background:#252321;color:#f3eee6;font:14px system-ui;margin:24px}main{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0}img{width:100%;height:auto}figcaption{padding:6px 0}a{color:#d6af82}</style><h1>ThreadLabs cinematic QA</h1><p>${url} · ${report.startedAt} · <a href="${activeOnly?'active-browser-qa.json':'browser-qa.json'}">Metrics and logs</a></p><main>${all.map(c => `<figure><a href="${c.filename}"><img src="${c.filename}"></a><figcaption>${c.name} · progress ${c.requestedProgress} · ${Number(c.seconds || 0).toFixed(2)} s</figcaption></figure>`).join('')}</main></html>`);
  await browser.close();
  console.log(JSON.stringify({ pass: report.pass, output, captures: all.length, assertions: report.assertions, fatal: report.fatal }, null, 2));
  if (!report.pass) process.exitCode = 1;
}
