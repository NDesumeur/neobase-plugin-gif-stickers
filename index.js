// GIF & stickers : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "";
/*CSS-MOVED*/ const CSS = `.gfApp{display:flex;background:var(--bg0)}
.gfApp.drop{box-shadow:inset 0 0 0 4px var(--magenta)}
.gfSide{width:230px;flex:none;display:flex;flex-direction:column;gap:4px;padding:18px 12px;border-right:3px solid var(--line);background:rgba(var(--d8),.6)}
.gfColl{all:unset;cursor:var(--cp,pointer);display:flex;justify-content:space-between;padding:8px 10px;color:var(--lilac);font-size:15px}
.gfColl:hover{background:rgba(255,255,255,.04)}
.gfColl.on{background:rgba(var(--mgr),.18);color:#fff}
.gfColl small{color:var(--muted)}
.gfMain{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px;padding:22px 26px;overflow:hidden}
.gfMain .row input{flex:1;padding:8px 12px;font-size:15px}
.gfGrid{flex:1;overflow-y:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));grid-auto-rows:140px;gap:12px;align-content:start;padding:4px}
.gfItem{position:relative;background:var(--win);cursor:var(--cp,pointer);display:grid;place-items:center;overflow:hidden;box-shadow:0 0 0 2px var(--line)}
.gfItem:hover{box-shadow:0 0 0 3px var(--magenta)}
.gfItem img{max-width:100%;max-height:100%;object-fit:contain}
.gfItem img.px8{image-rendering:pixelated;width:70%;height:70%}
.gfName{position:absolute;left:0;right:0;bottom:0;padding:4px 6px;font-size:12px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.75));white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0}
.gfItem:hover .gfName{opacity:1}
.gfTools{position:absolute;top:4px;right:4px;display:none;gap:3px}
.gfItem:hover .gfTools{display:flex}
.gfTools button{all:unset;cursor:var(--cp,pointer);width:24px;height:24px;display:grid;place-items:center;background:rgba(0,0,0,.7);color:#fff;font-size:13px}
.gfTools button:hover{background:var(--magenta)}
.gfTools button.on{color:#ffd07a}
.gfEmpty{grid-column:1/-1;padding:30px;text-align:center;font-size:16px}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "gifsApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const __picks = { "tools": d => ({ gifs: d.gifs }) };
  const __storeGet = async n => {
    let d = await doc(n);
    if (d == null) { try { d = await neo.storeGet(n); } catch { d = null; } if (d && __picks[n]) d = __picks[n](d); if (d != null) await folder.write(n, d); }  // première ouverture : tu retrouves ce que tu avais
    return d;
  };
  const __storeSet = async (n, d) => { await folder.write(n, d); return true; };
  // ---- ton code d'origine ----
let tools = null, toolsTimer = null;
const toolsReady = () => tools ? Promise.resolve(tools) : __storeGet('tools').then(d => tools = {text: {a: '', b: '', count: '', spell: '', ignore: []}, colors: {palettes: [], history: [], cur: '#e01ec8'}, gifs: {items: []}, ...(d || {})});
function toolsSave() { clearTimeout(toolsTimer); toolsTimer = setTimeout(() => { toolsTimer = null; __storeSet('tools', tools).catch(e => toast('Sauvegarde impossible : ' + e.message, true)); }, 600); }
addEventListener('pagehide', () => { if (toolsTimer) __storeSet('tools', tools); });
const toolCount = k => host.statCount(k);
const toolTabs = (box, tabs, cur, f) => { box.replaceChildren(...tabs.map(([k, l]) => { const b = el('button', 'tab px' + (k === cur ? ' on' : ''), l); b.onclick = () => f(k); return b; })); };

window.neo?.onDataChanged(async name => { if (name === 'files:gifs' && gf.box) return gfRender(); });

const pixArt = (rows, pal, scale = 4) => {
  const colors = {o: '#130a20', ...pal}, w = rows[0].length, h = rows.length;
  let shadow = '', body = '';
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '.') return;
    shadow += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1"/>`;
    body += `<rect x="${x}" y="${y}" width="1" height="1" fill="${colors[ch] || '#fff'}"/>`;
  }));
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + 1} ${h + 1}" width="${(w + 1) * scale}" height="${(h + 1) * scale}" shape-rendering="crispEdges"><g fill="#000" opacity=".45">${shadow}</g>${body}</svg>`);
};

/* ==================== GIF & stickers ==================== */
const gf = {coll: 'all', q: ''};
// NeoDex's own stickers: the app logos and a few pixel faces, drawn big
const GF_FACES = {
  coeur: [{r: '#ff4f6d', w: '#ffd0d8'}, ['............', '..rr....rr..', '.rwrr..rrrr.', '.rwrrrrrrrr.', '.rrrrrrrrrr.', '.rrrrrrrrrr.', '..rrrrrrrr..', '...rrrrrr...', '....rrrr....', '.....rr.....', '............', '............']],
  rire: [{y: '#ffd07a', k: '#3a2a08', w: '#ffffff', p: '#ff5ad9'}, ['...oooooo...', '..oyyyyyyo..', '.oyyyyyyyyo.', 'oyykyyyykyyo', 'oykykyykykyo', 'oyyyyyyyyyyo', 'oykkkkkkkkyo', 'oyykwwwwkyyo', '.oyykppkyyo.', '..oyykkyyo..', '...oooooo...', '............']],
  triste: [{y: '#7fe0ee', k: '#0b2a38', w: '#ffffff'}, ['...oooooo...', '..oyyyyyyo..', '.oyyyyyyyyo.', 'oyykyyyykyyo', 'oyykyyyykyyo', 'oywyyyyyyyyo', 'oywyyyyyyyyo', 'oyyykkkkyyyo', '.oykyyyykyo.', '..oyyyyyyo..', '...oooooo...', '............']],
  wow: [{y: '#d9c6ff', k: '#1c1238'}, ['...oooooo...', '..oyyyyyyo..', '.oyyyyyyyyo.', 'oyykkyykkyyo', 'oyykkyykkyyo', 'oyyyyyyyyyyo', 'oyyyykkyyyyo', 'oyyykyykyyyo', '.oyyykkyyyo.', '..oyyyyyyo..', '...oooooo...', '............']],
  gg: [{g: '#8ee8a0', k: '#0a3a1a'}, ['............', '.gggg..gggg.', 'gkkkk.gkkkk.', 'gk....gk....', 'gk.kk.gk.kk.', 'gk..k.gk..k.', 'gkkkk.gkkkk.', '.gggg..gggg.', '............', '............', '............', '............']],
  etoile: [{y: '#ffd07a', w: '#fff5d0'}, ['.....yy.....', '.....yy.....', '....yyyy....', 'yyyyywyyyyyy', '.yyyywyyyyy.', '..yyyyyyyy..', '..yyyyyyyy..', '.yyyy..yyyy.', '.yyy....yyy.', '.yy......yy.', '............', '............']],
};
const gfBuiltin = () => [...Object.entries(GF_FACES).map(([k, [pal, rows]]) => ({id: 'neo:' + k, name: k, art: [rows, pal]})), ...Object.keys(ART).map(k => ({id: 'neo:' + k, name: k, art: [ART[k][1], ART[k][0]]}))];
const gfPng = ([rows, pal]) => new Promise(ok => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(i, 4, 4, 152, 152); ok(c.toDataURL('image/png')); }; i.src = pixArt(rows, pal, 13); });
function gfMount() {
  const v = $('gifsApp'), side = el('div', 'gfSide'), main = el('div', 'gfMain'), head = el('div', 'agHead'), q = el('input', 'f'), add = el('button', 'btn main px', '+ AJOUTER'), link = el('button', 'btn px', 'LIEN…'), fi = Object.assign(el('input'), {type: 'file', accept: 'image/gif,image/png,image/webp,image/jpeg', multiple: true, hidden: true});
  q.placeholder = 'Rechercher un GIF ou un sticker'; add.title = 'Ajouter des GIF ou des images de ton PC'; link.title = 'Ajouter depuis un lien (GIF, PNG, page Giphy…)';
  const top = el('div', 'row'); top.append(q, add, link, fi);
  head.append(el('span', 'label', 'GIF & stickers'), el('span', 'hint', 'Clic : copier (un GIF reste animé quand tu le colles dans Discord, WhatsApp…). Glisse des fichiers ici ou colle une image (Ctrl+V).'));
  const box = el('div', 'gfGrid');
  main.append(head, top, box); v.replaceChildren(side, main); v.classList.add('gfApp');
  Object.assign(gf, {side, box, q});
  q.oninput = () => { gf.q = q.value.trim().toLowerCase(); gfRender(); };
  add.onclick = () => fi.click();
  fi.onchange = () => { gfAddFiles([...fi.files]); fi.value = ''; };
  link.onclick = async () => { const u = await ask('Lien du GIF ou de l\'image', '', 'Un lien direct (.gif, .png…) ou une page Giphy'); if (u?.trim()) gfAddUrl(u.trim()); };
  v.ondragover = e => { e.preventDefault(); v.classList.add('drop'); }; v.ondragleave = () => v.classList.remove('drop');
  v.ondrop = e => { e.preventDefault(); v.classList.remove('drop'); const fs = [...e.dataTransfer.files]; if (fs.length) gfAddFiles(fs); else { const u = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'); if (/^https?:/.test(u)) gfAddUrl(u.trim()); } };
  v.addEventListener('paste', e => {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const f = [...e.clipboardData.files].find(f => f.type.startsWith('image/'));
    if (f) { e.preventDefault(); const r = new FileReader(); r.onload = () => gfKeep(window.neo.filesAddData('gifs', f.name || 'image.png', r.result.split(',')[1]), f.name || 'image collée'); r.readAsDataURL(f); }
    else { const t = e.clipboardData.getData('text'); if (/^https?:\/\/\S+$/.test(t.trim())) { e.preventDefault(); gfAddUrl(t.trim()); } }
  });
  v.tabIndex = -1;
}
async function gfKeep(p, name) {
  try { const file = await p; await toolsReady(); if (!tools.gifs.items.some(i => i.file === file)) tools.gifs.items.unshift({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), file, name: name.replace(/\.\w+$/, '').replace(/[-_]+/g, ' ').slice(0, 60), tags: [], fav: false, t: Date.now(), uses: 0}); toolsSave(); gfRender(); return true; }
  catch (e) { toast('Ajout impossible : ' + e.message.replace(/^.*Error: /, ''), true); return false; }
}
async function gfAddFiles(files) { let n = 0; for (const f of files) if (await gfKeep(window.neo.pathOf(f).then(p => window.neo.filesAdd('gifs', p)), f.name)) n++; if (n) toast(n + ' ajouté' + (n > 1 ? 's' : '')); }
function gfAddUrl(u) {
  const g = /giphy\.com\/(?:gifs|stickers)\/(?:[\w-]*-)?(\w+)$/.exec(u.split('?')[0]);  // a Giphy page -> its GIF
  if (g) u = 'https://media.giphy.com/media/' + g[1] + '/giphy.gif';
  return gfKeep(window.neo.filesFetch('gifs', u), decodeURIComponent(u.split('/').pop().split('?')[0]) || 'gif').then(ok => ok && toast('Ajouté à ta bibliothèque'));
}
async function gfCopy(it) {
  try {
    if (it.art) { await window.neo.clipImageData(await gfPng(it.art)); }
    else if (/\.gif$/i.test(it.file)) await window.neo.clipFile('gifs', it.file);  // as a file: stays animated
    else await window.neo.clipImage('gifs', it.file);
    if (!it.art) { it.uses = (it.uses || 0) + 1; it.t = Date.now(); toolsSave(); }
    toolCount('gifs'); toast('Copié : colle-le où tu veux (Ctrl+V)'); sfx('notify');
  } catch (e) { toast('Copie impossible : ' + e.message.replace(/^.*Error: /, ''), true); }
}
async function gfRender() {
  if (!gf.box) return;
  await toolsReady();
  const items = tools.gifs.items, tags = [...new Set(items.flatMap(i => i.tags))].sort((a, b) => a.localeCompare(b, 'fr'));
  const colls = [['all', 'Tout', items.length], ['fav', '★ Favoris', items.filter(i => i.fav).length], ['recent', 'Récents', Math.min(24, items.filter(i => i.uses).length)], ['neo', 'Stickers NeoDex', gfBuiltin().length], ...tags.map(t => ['#' + t, '# ' + t, items.filter(i => i.tags.includes(t)).length])];
  gf.side.replaceChildren(el('span', 'label', 'Collections'), ...colls.map(([k, l, n]) => { const b = el('button', 'gfColl' + (gf.coll === k ? ' on' : '')); b.append(el('span', '', l), el('small', '', String(n))); b.onclick = () => { gf.coll = k; gfRender(); }; return b; }),
    el('div', 'hint', 'Pour créer une collection, ajoute un mot-clé à un GIF (bouton ✎).'));
  let list = gf.coll === 'neo' ? gfBuiltin() : gf.coll === 'fav' ? items.filter(i => i.fav) : gf.coll === 'recent' ? items.filter(i => i.uses).sort((a, b) => b.t - a.t).slice(0, 24) : gf.coll.startsWith('#') ? items.filter(i => i.tags.includes(gf.coll.slice(1))) : items;
  if (gf.q) list = (gf.coll === 'all' ? [...items, ...gfBuiltin()] : list).filter(i => (i.name + ' ' + (i.tags || []).join(' ')).toLowerCase().includes(gf.q));
  gf.box.replaceChildren(...(list.length ? list.map(it => {
    const c = el('div', 'gfItem'), img = el('img'), tools2 = el('div', 'gfTools');
    img.loading = 'lazy'; img.alt = it.name; img.draggable = false;
    if (it.art) { img.src = pixArt(it.art[0], it.art[1], 8); img.classList.add('px8'); } else window.neo.filesRead('gifs', it.file).then(b64 => { img.src = 'data:' + (/\.png$/i.test(it.file) ? 'image/png' : /\.webp$/i.test(it.file) ? 'image/webp' : /\.jpe?g$/i.test(it.file) ? 'image/jpeg' : 'image/gif') + ';base64,' + b64; }, () => {});
    c.title = it.name + (it.tags?.length ? ' · #' + it.tags.join(' #') : '') + ' · clic : copier';
    c.onclick = () => gfCopy(it);
    if (!it.art) {
      const fav = el('button', it.fav ? 'on' : '', '★'), ed = el('button', '', '✎'), del = el('button', '', 'X');
      fav.title = 'Favori'; ed.title = 'Nom et mots-clés'; del.title = 'Supprimer (sur tous tes PC)';
      fav.onclick = e => { e.stopPropagation(); it.fav = !it.fav; toolsSave(); gfRender(); };
      ed.onclick = async e => { e.stopPropagation(); const n = await ask('Nom', it.name); if (n == null) return; const t = await ask('Mots-clés (séparés par des virgules)', it.tags.join(', '), 'ils servent de collections et pour la recherche'); it.name = n.trim() || it.name; if (t != null) it.tags = [...new Set(t.split(',').map(s => s.trim().toLowerCase()).filter(Boolean))]; toolsSave(); gfRender(); };
      del.onclick = e => { e.stopPropagation(); tools.gifs.items = tools.gifs.items.filter(x => x !== it); toolsSave(); window.neo.filesRemove('gifs', it.file); gfRender(); };
      tools2.append(fav, ed, del);
    }
    c.append(img, tools2, el('span', 'gfName', it.name));
    return c;
  }) : [el('div', 'hint gfEmpty', gf.q ? 'Rien ne correspond à ta recherche.' : gf.coll === 'all' ? 'Ta bibliothèque est vide : ajoute des GIF de ton PC, colle un lien ou une image, ou pioche dans les stickers NeoDex.' : 'Rien dans cette collection pour l\'instant.')]));
}
async function gfOpen() {
  await toolsReady(); gfRender(); $('gifsApp').focus({preventScroll: true});
  window.neo.filesPrune('gifs', tools.gifs.items.map(i => i.file)).catch(() => {});  // files deleted on another PC
}
gfMount();  // (non indenté : les textes sur plusieurs lignes restent exactement les tiens)
  // ---- fin ----
  ctx.onOpen(() => { gfOpen(); });
}
