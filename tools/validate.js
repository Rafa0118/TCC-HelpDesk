/* Validation script: checks all resource references in dashboard pages */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const PAGES = [
  'index.html',
  'login.html',
  'cadastro.html',
  'home.html',
  'dashboard/direcao.html',
  'dashboard/professor.html',
  'dashboard/professor-perfil.html',
  'dashboard/tecnico.html',
  'dashboard/tecnico-perfil.html'
];
const DASHBOARD_PAGES = PAGES.filter(p => p.startsWith('dashboard'));
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

    console.log('\n===== 4. Public page checks =====');
    PAGES.filter(p => !p.startsWith('dashboard')).forEach(page => {
      const html = fs.readFileSync(page, 'utf8');
      const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]).filter(p => !p.startsWith('http') && !p.startsWith('#'));
      const scripts = [...html.matchAll(/src="([^"]+)"/g)].map(m => m[1]).filter(p => !p.startsWith('http'));
      [...links, ...scripts].forEach(res => {
        try {
          if (fs.existsSync(res)) ok(`${page} \u2192 ${res}`);
          else bad(`${page} \u2192 ${res} (file not found)`);
        } catch (e) {
          bad(`${page} \u2192 ${res} (error)`);
        }
      });
    });

    console.log(`\n========================================`);
    console.log(`RESULT: ${pass} passed, ${fail} failed`);
    if (failures.length) { console.log('Failures:\n - ' + failures.join('\n - ')); process.exitCode = 1; }
    else console.log('ALL CHECKS PASSED \u2713');
  }
});
