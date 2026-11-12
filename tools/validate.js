/* Validation script: checks all resource references in dashboard pages */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const PUBLIC_PAGES = [
  'index.html',
  'login.html',
  'recuperar-senha.html',
  'home.html',
  'direcao.html',
  'professor.html',
  'professor-perfil.html',
  'tecnico.html',
  'tecnico-perfil.html'
];
const LEGACY_REDIRECTS = {
  'direcao.html': 'dashboard/direcao.html',
  'professor.html': 'dashboard/professor.html',
  'professor-perfil.html': 'dashboard/professor-perfil.html',
  'tecnico.html': 'dashboard/tecnico.html',
  'tecnico-perfil.html': 'dashboard/tecnico-perfil.html'
};
const DASHBOARD_PAGES = [
  'dashboard/direcao.html',
  'dashboard/professor.html',
  'dashboard/professor-perfil.html',
  'dashboard/tecnico.html',
  'dashboard/tecnico-perfil.html'
];
let pass = 0, fail = 0;
const failures = [];

function ok(msg) { pass++; console.log('  \u2713 ' + msg); }
function bad(msg) { fail++; failures.push(msg); console.log('  \u2717 ' + msg); }

function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

console.log('\n===== 1. HTML/CSS/JS resource references =====');
function server(cb) {
  const srv = http.createServer((req, res) => {
    const urlPath = req.url.replace(/\?.*$/, '');
    const filePath = path.join(process.cwd(), urlPath);
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('NOT FOUND'); return; }
      res.writeHead(200);
      res.end(data);
    });
  });
  srv.listen(0, '127.0.0.1', () => cb(srv));
}

server((srv) => {
  const port = srv.address().port;
  const base = `http://127.0.0.1:${port}`;

  (function checkPage(idx, refs) {
    if (idx >= DASHBOARD_PAGES.length) {
      srv.close();
      finishChecks();
      return;
    }
    const page = DASHBOARD_PAGES[idx];
    const html = fs.readFileSync(page, 'utf8');
    const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
    const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    const allRes = [...new Set([links, scripts].flat().filter(p => !p.startsWith('http') && !p.startsWith('#')))];
    refs.push({ page, resources: allRes });
    const pageDir = path.dirname(page);
    (function checkRes(ri) {
      if (ri >= allRes.length) { checkPage(idx + 1, refs); return; }
      const res = allRes[ri];
      const resolvedPath = path.resolve(pageDir, res);
      const urlPath = path.relative(process.cwd(), resolvedPath).replace(/\\/g, "/");
      const url = base + "/" + encodeURI(urlPath);
      http.get(url, (r) => {
        if (r.statusCode === 200) ok(`${page} \u2192 ${res}`);
        else bad(`${page} \u2192 ${res} (HTTP ${r.statusCode})`);
        r.resume();
        checkRes(ri + 1);
      }).on('error', () => {
        bad(`${page} \u2192 ${res} (network error)`);
        checkRes(ri + 1);
      });
    })(0);
  })(0, []);

  function finishChecks() {
    console.log('\n===== 2. JS syntax check =====');
    const jsFiles = getAllJsFiles('js');
    jsFiles.forEach(f => {
      try {
        execSync(`node --check ${f}`, { stdio: 'pipe' });
        ok(`${f} syntax OK`);
      } catch (e) {
        bad(`${f} syntax: ${e.message.split('\n')[0]}`);
      }
    });

    console.log('\n===== 3. HTML structural checks =====');
    DASHBOARD_PAGES.forEach(page => {
      const html = fs.readFileSync(page, 'utf8');
      if (!html.includes('dark-mode.js')) bad(`${page}: missing dark-mode.js`);
      else ok(`${page}: dark-mode.js referenced`);
      if (!html.includes('skeleton.js')) bad(`${page}: missing skeleton.js`);
      else ok(`${page}: skeleton.js referenced`);
      if (!html.includes('DarkMode.init()')) bad(`${page}: missing DarkMode.init()`);
      else ok(`${page}: DarkMode.init() called`);
      if ((html.match(/<style>/g) || []).length > 0) bad(`${page}: has inline <style>`);
      else ok(`${page}: no inline <style>`);
      // tag balance sanity
      ['div', 'section', 'button', 'span', 'table', 'tbody', 'tr', 'td'].forEach(tag => {
        const open = (html.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
        const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        if (open !== close) bad(`${page}: <${tag}> open=${open} close=${close}`);
      });
    });

    console.log('\n===== 4. Internal page and section targets =====');
    [...PUBLIC_PAGES, ...DASHBOARD_PAGES].forEach(page => {
      const html = fs.readFileSync(page, 'utf8');
      if (LEGACY_REDIRECTS[page]) {
        const redirect = html.match(/window\.location\.replace\("([^"]+)"/);
        const expected = LEGACY_REDIRECTS[page];
        if (!redirect || redirect[1] !== expected) bad(`${page} → ${expected} (redirect missing)`);
        else if (!fs.existsSync(expected)) bad(`${page} → ${expected} (file not found)`);
        else ok(`${page} → ${expected}`);
        return;
      }

      const targets = [...html.matchAll(/(?:href|data-target)="([^"]+)"/g)].map(m => m[1]);
      targets.forEach(target => {
        if (/^(https?:|mailto:|tel:|javascript:)/i.test(target)) return;
        const [filePart, fragment] = target.split('#');
        const isSection = !filePart || (!filePart.includes('/') && !path.extname(filePart));
        const targetFile = isSection ? page : path.resolve(path.dirname(page), filePart);
        if (isSection) {
          const sectionId = fragment || filePart;
          const escapedId = sectionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const exists = new RegExp(`\\bid="${escapedId}"`).test(html);
          const profileModal = sectionId === 'perfil' && /id="profileModalOverlay"/.test(html);
          if (!exists && !profileModal) bad(`${page} → ${target} (section not found)`);
          else ok(`${page} → ${target}`);
          return;
        }

        if (!fs.existsSync(targetFile)) {
          bad(`${page} → ${target} (file not found)`);
          return;
        }
        if (fragment) {
          const targetHtml = fs.readFileSync(targetFile, 'utf8');
          const escapedId = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (!new RegExp(`\\bid="${escapedId}"`).test(targetHtml)) bad(`${page} → ${target} (section not found)`);
          else ok(`${page} → ${target}`);
          return;
        }
        ok(`${page} → ${target}`);
      });
    });

    console.log('\n===== 5. Public page checks =====');
    PUBLIC_PAGES.forEach(page => {
      const html = fs.readFileSync(page, 'utf8');
      if (page === 'index.html' && !/window\.location\.replace\(['"]login\.html['"]\)/.test(html)) {
        bad('index.html: must redirect to login.html');
      }
      const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(p => !/^(https?:|mailto:|tel:|javascript:|#)/i.test(p));
      const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]).filter(p => !/^(https?:|\/\/)/i.test(p));
      [...links, ...scripts].forEach(res => {
        try {
          const target = path.resolve(path.dirname(page), res.split(/[?#]/)[0]);
          if (fs.existsSync(target)) ok(`${page} \u2192 ${res}`);
          else bad(`${page} \u2192 ${res} (file not found)`);
        } catch (e) {
          bad(`${page} \u2192 ${res} (error)`);
        }
      });
    });
    if (fs.existsSync('cadastro.html')) bad('cadastro.html: self-service registration page must be removed');
    else ok('cadastro.html removed');
    const loginHtml = fs.readFileSync('login.html', 'utf8');
    if (/cadastro\.html|Criar conta|Criar uma conta/.test(loginHtml)) bad('login.html: contains registration links');
    else ok('login.html: no registration links');
    const firebaseSource = fs.readFileSync('js/core/firebase.js', 'utf8');
    if (/function\s+register\s*\(|\bregister,/.test(firebaseSource)) bad('js/core/firebase.js: self-service registration API must be removed');
    else ok('js/core/firebase.js: no self-service registration API');
    const firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
    if (/match\s*\/usuarios\/\{userId\}[\s\S]*?allow create:\s*if isDirection\(\);/.test(firestoreRules)) {
      ok('firestore.rules: only direction can create user profiles');
    } else {
      bad('firestore.rules: user profiles must only be created by direction');
    }

    console.log(`\n========================================`);
    console.log(`RESULT: ${pass} passed, ${fail} failed`);
    if (failures.length) { console.log('Failures:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
    else console.log('ALL CHECKS PASSED \u2713');
  }
});
