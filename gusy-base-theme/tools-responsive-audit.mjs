#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_HUB = 'http://127.0.0.1:8888/gusy-themes/';
const CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
];
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'tablet', width: 834, height: 1112, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true }
];

function argValue(name, fallback = '') {
  const exact = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

async function fileExists(path) {
  try {
    const { access } = await import('node:fs/promises');
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function chromePath() {
  const explicit = argValue('--chrome');
  if (explicit && await fileExists(explicit)) return explicit;

  for (const candidate of CHROME_PATHS) {
    if (await fileExists(candidate)) return candidate;
  }

  throw new Error('Chrome was not found. Pass --chrome=/path/to/chrome.');
}

function decodeHtmlUrl(value) {
  return value
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, "'");
}

async function discoverUrls(hubUrl) {
  const response = await fetch(hubUrl);
  if (!response.ok) {
    throw new Error(`Could not load hub ${hubUrl}: ${response.status}`);
  }

  const html = await response.text();
  const hub = new URL(hubUrl);
  const urls = new Set();

  for (const match of html.matchAll(/href=["']([^"']+)["']/g)) {
    const raw = decodeHtmlUrl(match[1]);
    let url;
    try {
      url = new URL(raw, hub);
    } catch {
      continue;
    }

    if (url.origin !== hub.origin) continue;
    if (!url.pathname.startsWith('/gusy-')) continue;
    if (url.pathname === '/gusy-themes/') continue;
    if (url.pathname.startsWith('/wp-json/')) continue;
    urls.add(url.toString().replace(/[?#].*$/, ''));
  }

  return Array.from(urls).sort();
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    ws.addEventListener('message', (event) => this.handleMessage(event));
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject, timer } = this.pending.get(message.id);
      clearTimeout(timer);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message || JSON.stringify(message.error)));
      } else {
        resolve(message.result || {});
      }
      return;
    }

    if (message.method) {
      for (const listener of [...this.listeners]) {
        if (listener.method !== message.method) continue;
        if (listener.sessionId && listener.sessionId !== message.sessionId) continue;
        clearTimeout(listener.timer);
        this.listeners = this.listeners.filter((candidate) => candidate !== listener);
        listener.resolve(message.params || {});
      }
    }
  }

  send(method, params = {}, sessionId = '') {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 45000);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(payload));
    });
  }

  waitFor(method, sessionId = '', timeout = 15000) {
    return new Promise((resolve, reject) => {
      const listener = {
        method,
        sessionId,
        resolve,
        reject,
        timer: setTimeout(() => {
          this.listeners = this.listeners.filter((candidate) => candidate !== listener);
          reject(new Error(`CDP event timeout: ${method}`));
        }, timeout)
      };
      this.listeners.push(listener);
    });
  }
}

async function connectWebSocket(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return ws;
}

async function launchChrome() {
  const userDataDir = await mkdtemp(join(tmpdir(), 'gusy-chrome-'));
  const chrome = spawn(
    await chromePath(),
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome did not expose a DevTools endpoint.')), 12000);
    chrome.stderr.on('data', (chunk) => {
      const line = chunk.toString();
      const match = line.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    chrome.on('exit', (code) => reject(new Error(`Chrome exited before audit started: ${code}`)));
  });

  return { chrome, userDataDir, wsUrl };
}

async function removeDirectoryWithRetry(path) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 180 * (attempt + 1)));
    }
  }
}

async function runPool(items, concurrency, handler) {
  let cursor = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await handler(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

async function auditUrl(client, url, viewport, screenshotDir, shouldScreenshot) {
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  await client.send('Page.enable', {}, sessionId);
  await client.send('Runtime.enable', {}, sessionId);
  await client.send(
    'Emulation.setDeviceMetricsOverride',
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile
    },
    sessionId
  );

  const load = client.waitFor('Page.loadEventFired', sessionId, 20000).catch(() => null);
  await client.send('Page.navigate', { url }, sessionId);
  await load;

  const expression = `(() => new Promise((resolve) => {
    const done = () => {
      const viewportWidth = window.innerWidth;
      const doc = document.documentElement;
      const body = document.body;
      const visible = (element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const selectorFor = (element) => {
        if (element.id) return '#' + element.id;
        const classes = Array.from(element.classList || []).slice(0, 4).join('.');
        return element.tagName.toLowerCase() + (classes ? '.' + classes : '');
      };
      const overflows = Array.from(document.querySelectorAll('body *'))
        .filter((element) => {
          if (!visible(element)) return false;
          const style = window.getComputedStyle(element);
          if (style.position === 'fixed') return false;
          const rect = element.getBoundingClientRect();
          return rect.right > viewportWidth + 2 || rect.left < -2;
        })
        .slice(0, 10)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            selector: selectorFor(element),
            text: (element.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 90),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width)
          };
        });
      const images = Array.from(document.images).map((image) => ({
        src: image.currentSrc || image.src,
        alt: image.alt || '',
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        width: Math.round(image.getBoundingClientRect().width),
        height: Math.round(image.getBoundingClientRect().height)
      }));
      const imageChecks = window.__gusyImageChecks || images.map((image) => ({
        src: image.src,
        ok: image.complete && image.naturalWidth > 0,
        status: image.complete && image.naturalWidth > 0 ? 200 : 0,
        contentType: ''
      }));
      const h1 = document.querySelector('h1');
      const h1Rect = h1 ? h1.getBoundingClientRect() : null;
      const visibleWpHeaders = Array.from(document.querySelectorAll('.wp-site-blocks > header, header.wp-block-template-part, .gusy-site-header'))
        .filter((element) => !element.closest('.gusy-theme') && visible(element))
        .map(selectorFor);
      const navigation = performance.getEntriesByType('navigation')[0];

      resolve({
        status: navigation && 'responseStatus' in navigation ? navigation.responseStatus : 0,
        title: document.title,
        bodyClasses: body ? body.className : '',
        viewportWidth,
        viewportHeight: window.innerHeight,
        scrollWidth: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0),
        scrollHeight: Math.max(doc.scrollHeight, body ? body.scrollHeight : 0),
        horizontalOverflow: Math.max(doc.scrollWidth, body ? body.scrollWidth : 0) - viewportWidth,
        gusyTheme: Boolean(document.querySelector('.gusy-theme')),
        visibleWpHeaders,
        imageCount: images.length,
        brokenImages: imageChecks.filter((image) => !image.ok || (image.contentType && !image.contentType.includes('image'))),
        tinyImages: images.filter((image) => image.width > 0 && image.height > 0 && (image.width < 80 || image.height < 60)),
        svgCount: document.querySelectorAll('.gusy-theme svg, .gusy-theme img[src$=".svg"]').length,
        h1: h1 ? (h1.textContent || '').trim().replace(/\\s+/g, ' ') : '',
        h1Length: h1 ? (h1.textContent || '').trim().replace(/\\s+/g, ' ').length : 0,
        h1Rect: h1Rect ? {
          left: Math.round(h1Rect.left),
          right: Math.round(h1Rect.right),
          width: Math.round(h1Rect.width),
          height: Math.round(h1Rect.height)
        } : null,
        overflows
      });
    };

    const pause = (delay) => new Promise((resume) => setTimeout(resume, delay));
    const activateLazyImages = async () => {
      Array.from(document.images).forEach((image) => {
        image.loading = 'eager';
        image.decoding = 'sync';
      });

      window.scrollTo(0, 0);
      await pause(80);
    };

    const checkImages = async () => {
      window.__gusyImageChecks = await Promise.all(Array.from(document.images).map(async (image) => {
        const src = image.currentSrc || image.src;
        try {
          const response = await fetch(src, { cache: 'no-store' });
          return {
            src,
            ok: response.ok,
            status: response.status,
            contentType: response.headers.get('content-type') || ''
          };
        } catch (error) {
          return {
            src,
            ok: false,
            status: 0,
            contentType: '',
            error: String(error && error.message ? error.message : error)
          };
        }
      }));
    };

    activateLazyImages().then(checkImages).then(() => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => setTimeout(done, 120));
      } else {
        setTimeout(done, 120);
      }
    });
  }))()`;

  const evaluation = await client.send(
    'Runtime.evaluate',
    { expression, awaitPromise: true, returnByValue: true },
    sessionId
  );
  const metrics = evaluation.result?.value || {};

  if (shouldScreenshot) {
    try {
      const screenshot = await client.send(
        'Page.captureScreenshot',
        { format: 'jpeg', quality: 82, captureBeyondViewport: false },
        sessionId
      );
      const safeName = `${new URL(url).pathname.replace(/^\//, '').replace(/\/$/, '').replace(/[^a-z0-9-]+/gi, '-')}-${viewport.name}.jpg`;
      await writeFile(join(screenshotDir, safeName), Buffer.from(screenshot.data, 'base64'));
    } catch (error) {
      metrics.screenshotWarning = String(error && error.message ? error.message : error);
    }
  }

  await client.send('Target.closeTarget', { targetId });

  const errors = [];
  if (metrics.status && metrics.status >= 400) errors.push(`HTTP ${metrics.status}`);
  if (!metrics.gusyTheme) errors.push('Missing .gusy-theme');
  if (metrics.visibleWpHeaders?.length) errors.push(`Visible WordPress header: ${metrics.visibleWpHeaders.join(', ')}`);
  if (metrics.imageCount < 3) errors.push(`Only ${metrics.imageCount} images`);
  if (metrics.brokenImages?.length) errors.push(`${metrics.brokenImages.length} broken images`);
  if (metrics.svgCount > 0) errors.push(`${metrics.svgCount} SVG assets inside theme`);
  if (!metrics.h1) errors.push('Missing H1');
  if (metrics.h1Length > 76) errors.push(`H1 too long: ${metrics.h1Length}`);
  if (metrics.horizontalOverflow > 2) errors.push(`Document overflow: ${metrics.horizontalOverflow}px`);
  if (metrics.overflows?.length) errors.push(`${metrics.overflows.length} overflowing elements`);

  return {
    url,
    viewport: viewport.name,
    width: viewport.width,
    height: viewport.height,
    errors,
    metrics
  };
}

async function main() {
  const hub = argValue('--hub', DEFAULT_HUB);
  const singleUrl = argValue('--url');
  const output = argValue('--output', 'audit/responsive-report.json');
  const screenshotDir = argValue('--screenshots', 'audit/screenshots');
  const limit = Number(argValue('--limit', '0'));
  const concurrency = Number(argValue('--concurrency', '6'));
  const sampleScreenshots = hasArg('--sample-screenshots');
  const urls = singleUrl
    ? [new URL(singleUrl).toString()]
    : (await discoverUrls(hub)).slice(0, limit > 0 ? limit : undefined);

  if (urls.length !== 100 && !limit && !singleUrl) {
    throw new Error(`Expected 100 Gusy preview pages from ${hub}, found ${urls.length}.`);
  }

  await mkdir(screenshotDir, { recursive: true });
  const { chrome, userDataDir, wsUrl } = await launchChrome();
  const failures = [];
  const results = [];

  try {
    const ws = await connectWebSocket(wsUrl);
    const client = new CdpClient(ws);
    const sampleUrls = new Set(sampleScreenshots ? [urls[0], urls.find((url) => url.includes('-work/')) || urls[1]].filter(Boolean) : []);
    const tasks = urls.flatMap((url) => VIEWPORTS.map((viewport) => ({
      url,
      viewport,
      screenshot: sampleUrls.has(url)
    })));
    let completed = 0;
    const pooled = await runPool(tasks, concurrency, async (task) => {
      const result = await auditUrl(client, task.url, task.viewport, screenshotDir, task.screenshot);
      completed += 1;
      if (completed % VIEWPORTS.length === 0 || result.errors.length) {
        process.stdout.write(`Audited ${completed}/${tasks.length}: ${task.url} ${task.viewport.name}${result.errors.length ? ' FAILED' : ''}\n`);
      }
      return result;
    });

    results.push(...pooled);
    failures.push(...pooled.filter((result) => result.errors.length));

    ws.close();
  } finally {
    if (!chrome.killed) {
      chrome.kill('SIGTERM');
    }
    await new Promise((resolve) => {
      chrome.once('exit', resolve);
      setTimeout(resolve, 900);
    });
    await removeDirectoryWithRetry(userDataDir);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    hub,
    pageCount: urls.length,
    viewportCount: VIEWPORTS.length,
    checkCount: results.length,
    failureCount: failures.length,
    failures,
    results
  };

  await mkdir(output.split('/').slice(0, -1).join('/') || '.', { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2));

  process.stdout.write(`Responsive report: ${output}\n`);
  process.stdout.write(`Checks: ${results.length}\n`);
  process.stdout.write(`Failures: ${failures.length}\n`);

  if (failures.length) {
    process.stdout.write(JSON.stringify(failures.slice(0, 10), null, 2) + '\\n');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
