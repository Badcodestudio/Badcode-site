/* Your content lives in data.json. This file is the shared code for every page and the edit tool. */
const REPO = "Badcodestudio/badcode-site";   /* GitHub owner/repository */
const BRANCH = "main";

const BOOK_COLORS = ["bk1","bk2","bk3","bk4"];
const REL_COLORS  = ["hs","jh","mt","ul","am","ri","tr","wf","wb","cw","dt"];

/* What each editable list looks like. [key, label, kind] — kind: text | color | img | date */
const SCHEMA = {
  books:   { one:"book",  title:"title", colors:BOOK_COLORS,
    blank:{series:"",title:"",color:"bk1",img:"",paperback:"",kindle:"",date:""},
    fields:[["series","Series","text"],["title","Title","text"],["color","Cover colour","color"],["img","Cover image","img"],["paperback","Paperback link","text"],["kindle","Kindle link","text"],["date","Release date","date"]] },
  music:   { one:"song",  title:"title", colors:REL_COLORS,
    blank:{title:"",code:"",color:"hs",img:"",spotify:"",apple:"",hyperfollow:"",date:""},
    fields:[["title","Title","text"],["code","Short code (2 letters)","text"],["color","Colour","color"],["img","Cover image","img"],["spotify","Spotify link","text"],["apple","Apple Music link","text"],["hyperfollow","Single Listen link","text"],["date","Release date","date"]] },
  videos:  { one:"video", title:"title", colors:REL_COLORS,
    blank:{title:"",url:"",code:"",color:"hs",img:"",date:""},
    fields:[["title","Title","text"],["url","Video link","text"],["code","Short code (2 letters)","text"],["color","Colour","color"],["img","Thumbnail image","img"],["date","Release date","date"]] },
  apps:    { one:"app",   title:"name",
    blank:{name:"",tag:"",blurb:"",url:""},
    fields:[["name","Name","text"],["tag","Label (small tag)","text"],["blurb","Short description","text"],["url","Link","text"]] },
  socials: { one:"link",  title:"label",
    blank:{label:"",url:""},
    fields:[["label","Name","text"],["url","Link","text"]] }
};

/* Shown until you save your own list from the editor (then data.json holds it). */
const DEFAULT_APPS = [
  { name:"Chimeramorphic", tag:"Hybrid character generator",
    blurb:"Blend animals, myth and imagination into striking hybrid characters. Pick a form, set the style, create.",
    url:"https://chimeramorphic.badcode.studio" },
  { name:"Eidolon", tag:"18+ · Now in testing",
    blurb:"A dark-fantasy and mythology studio for adults: design intense creatures and characters, then turn them into 3D models.",
    url:"https://eidolon.monster" }
];

let DATA = null;
let editing = false, dirty = false;

const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = id => document.getElementById(id);
const musicLive = m => m.spotify || m.apple || m.hyperfollow;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
/* "2026-10-16" -> "Oct 16, 2026". Anything else typed by hand is shown as written. */
function fmtDate(s){
  s = String(s == null ? "" : s).trim();
  if(!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if(!m || +m[2] < 1 || +m[2] > 12) return esc(s);
  return MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1];
}
const btn = (url, label) => url ? `<a class="fmt" href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : "";

/* ---------- public rendering ---------- */
function swatch(item){
  if(item.img) return `<img class="swimg" src="${esc(item.img)}" alt="" loading="lazy">`;
  return `<span class="sw ${esc(item.color)}" aria-hidden="true">${esc(item.code)}</span>`;
}
function bookHTML(b){
  const title = b.title || "";
  const cover = b.img
    ? `<div class="cover has-img"><img src="${esc(b.img)}" alt="${esc(title)} cover" loading="lazy"></div>`
    : `<div class="cover ${esc(b.color)}"><span class="series">${esc(b.series)}</span>
      <span class="ct${title.length > 40 ? " long" : ""}">${esc(title)}</span><span class="by">Philip Trapp</span></div>`;
  return `<div class="book">${cover}<div class="fmts">${btn(b.paperback,"Paperback")}${btn(b.kindle,"Kindle")}</div>${b.date ? `<span class="rd">${fmtDate(b.date)}</span>` : ""}</div>`;
}
function musicHTML(m){
  const links = m.spotify || m.apple ? btn(m.spotify,"Spotify") + btn(m.apple,"Apple Music") : btn(m.hyperfollow,"Listen");
  return `<div class="row music${musicLive(m) ? "" : " off"}">${swatch(m)}
    <span class="info"><span class="t">${esc(m.title)}</span><span class="m">Single · Philip Trapp</span>${m.date ? `<span class="m">${fmtDate(m.date)}</span>` : ""}</span>
    ${musicLive(m) ? `<span class="links">${links}</span>` : `<span class="act">Coming soon</span>`}</div>`;
}
function videoHTML(v){
  const tag = v.url ? "a" : "div";
  const href = v.url ? ` href="${esc(v.url)}" target="_blank" rel="noopener"` : "";
  return `<${tag} class="row video${v.url ? "" : " off"}"${href}>${swatch(v)}
    <span class="info"><span class="t">${esc(v.title)}</span><span class="m">Music video</span>${v.date ? `<span class="m">${fmtDate(v.date)}</span>` : ""}</span>
    <span class="act">${v.url ? "Watch" : "Coming soon"}</span></${tag}>`;
}
const PUBLIC = {
  books: b => bookHTML(b),
  music: m => musicHTML(m),
  videos: v => videoHTML(v),
  apps: a => `<a class="teaser" href="${esc(a.url)}" target="_blank" rel="noopener">${a.tag ? `<span class="tag">${esc(a.tag)}</span>` : ""}
    <h3>${esc(a.name)}</h3><p>${esc(a.blurb)}</p><span class="go">Open ${esc(a.name)} &rarr;</span></a>`,
  socials: x => btn(x.url, esc(x.label))
};

/* Short line for the page headers and the home-page cards. */
const COUNT = {
  books:  () => DATA.books.length + (DATA.books.length === 1 ? " book" : " books") + " on Amazon",
  music:  () => DATA.music.filter(musicLive).length + " releases",
  videos: () => { const n = DATA.videos.filter(v => v.url).length; return n ? n + " music videos" : "Links coming soon"; },
  apps:   () => DATA.apps.length + (DATA.apps.length === 1 ? " app" : " apps")
};

/* Little cover strips on the home-page cards: newest music/videos, first books. */
function previewHTML(key){
  const withImg = (DATA[key] || []).filter(i => i.img);
  const pick = key === "books" ? withImg.slice(0, 3) : withImg.slice(-3).reverse();
  return pick.map(i => `<img src="${esc(i.img)}" alt="" loading="lazy">`).join("");
}

/* ---------- editor rendering ---------- */
function fieldHTML(sec, i, f, item){
  const [key, label, kind] = f;
  const val = item[key] == null ? "" : item[key];
  const at = `data-sec="${sec}" data-i="${i}" data-f="${key}"`;
  if(kind === "color"){
    return `<label>${label}<select ${at}>${SCHEMA[sec].colors.map(c => `<option value="${c}"${c===val?" selected":""}>${c}</option>`).join("")}</select></label>`;
  }
  if(kind === "date"){
    return `<label>${label}<input type="date" ${at} value="${esc(/^\d{4}-\d{2}-\d{2}$/.test(val) ? val : "")}"></label>`;
  }
  if(kind === "img"){
    return `<label>${label}<span class="ed-imgrow"><input type="text" ${at} value="${esc(val)}" placeholder="images/file.jpg or leave empty">
      <button class="ebtn" type="button" data-act="upload" data-sec="${sec}" data-i="${i}" data-f="${key}">Upload</button></span></label>`;
  }
  return `<label>${label}<input type="text" ${at} value="${esc(val)}" autocapitalize="off" autocomplete="off"></label>`;
}
function editorHTML(sec){
  const S = SCHEMA[sec], list = DATA[sec];
  const items = list.map((item, i) => `<div class="ed-item">
    <h4>${esc(item[S.title] || "(untitled " + S.one + ")")}</h4>
    <div class="ed-grid">${S.fields.map(f => fieldHTML(sec, i, f, item)).join("")}</div>
    <div class="ed-tools">
      <button class="ebtn" type="button" data-act="up" data-sec="${sec}" data-i="${i}"${i===0?" disabled":""}>Move up</button>
      <button class="ebtn" type="button" data-act="down" data-sec="${sec}" data-i="${i}"${i===list.length-1?" disabled":""}>Move down</button>
      <button class="ebtn danger" type="button" data-act="del" data-sec="${sec}" data-i="${i}">Delete</button>
    </div></div>`).join("");
  return items + `<div class="ed-add"><button class="ebtn" type="button" data-act="add" data-sec="${sec}">+ Add ${S.one}</button></div>`;
}

/* Every page marks its lists with data-list="books" (etc). Add data-editable to let edit mode change that list. */
function renderAll(){
  if(!DATA) return;
  document.querySelectorAll("[data-list]").forEach(el => {
    const sec = el.dataset.list;
    if(!SCHEMA[sec]) return;
    const ed = editing && el.hasAttribute("data-editable");
    el.style.display = ed ? "grid" : "";
    el.style.gridTemplateColumns = ed ? "1fr" : "";
    el.innerHTML = ed ? editorHTML(sec) : DATA[sec].map(PUBLIC[sec]).join("");
  });
  const pe = $("picfair-edit");
  if(pe){
    pe.classList.toggle("hidden", !editing);
    if(editing) pe.innerHTML = `<label>Picfair store link<input type="text" id="picfair-input" value="${esc(DATA.picfair)}" autocapitalize="off" autocomplete="off"></label>`;
  }
  document.querySelectorAll("[data-picfair]").forEach(a => { a.href = DATA.picfair || "#"; });
  document.querySelectorAll("[data-count]").forEach(el => { const f = COUNT[el.dataset.count]; if(f) el.textContent = f(); });
  document.querySelectorAll("[data-preview]").forEach(el => {
    const html = previewHTML(el.dataset.preview);
    el.innerHTML = html; el.hidden = !html;
  });
}

/* ---------- loading ---------- */
async function load(){
  try{
    const r = await fetch("data.json?v=" + Date.now(), {cache:"no-store"});
    if(!r.ok) throw new Error("HTTP " + r.status);
    DATA = await r.json();
    if(!Array.isArray(DATA.apps)) DATA.apps = DEFAULT_APPS.map(a => ({...a}));
    for(const k of Object.keys(SCHEMA)) if(!Array.isArray(DATA[k])) DATA[k] = [];
    if(typeof DATA.picfair !== "string") DATA.picfair = "";
    renderAll();
  }catch(e){
    const box = $("load-error");
    if(!box) return;
    box.classList.remove("hidden");
    box.textContent = location.protocol === "file:"
      ? "This page loads its content from data.json, so it has to be opened from the website, not from a file on your phone."
      : "The content could not be loaded. Please refresh in a moment.";
  }
}

/* ---------- GitHub saving ---------- */
const store = {
  get(){ try{ return localStorage.getItem("bcs_token") || ""; }catch(_){ return ""; } },
  set(v){ try{ localStorage.setItem("bcs_token", v); }catch(_){} },
  clear(){ try{ localStorage.removeItem("bcs_token"); }catch(_){} }
};
let TOKEN = store.get();

async function gh(method, path, body){
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method,
    headers:{ "Authorization":"Bearer " + TOKEN, "Accept":"application/vnd.github+json", "Content-Type":"application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  let json = null; try{ json = await r.json(); }catch(_){}
  if(!r.ok){
    const e = new Error((json && json.message) || ("HTTP " + r.status)); e.status = r.status; throw e;
  }
  return json;
}
const b64text = s => btoa(unescape(encodeURIComponent(s)));

function msg(text, cls){ const m = $("edit-msg"); m.textContent = text; m.className = "msg" + (cls ? " " + cls : ""); }

async function startEditing(){
  if(!DATA){ return; }
  if(!TOKEN){
    const t = (prompt("Paste your GitHub token to edit this page. It stays on this device only.") || "").trim();
    if(!t) return;
    TOKEN = t;
  }
  try{
    await gh("GET", `data.json?ref=${BRANCH}`);   // proves the token works and can see the repo
    store.set(TOKEN);
  }catch(e){
    store.clear(); TOKEN = "";
    alert(e.status === 401 || e.status === 404
      ? "GitHub did not accept that token for " + REPO + ". Check that it was created for that repository with Contents: Read and write."
      : "Could not reach GitHub: " + e.message);
    return;
  }
  editing = true; document.body.classList.add("editing");
  msg("Editing. Nothing is published until you tap Save.");
  renderAll();
  if(!document.querySelector("[data-editable]")) msg("Nothing to edit on this page. Use the Books, Music, Video, Apps or Photos page, or Home for your links.");
}
function stopEditing(){
  const discard = dirty;
  if(discard && !confirm("You have unsaved changes. Leave editing anyway and lose them?")) return;
  editing = false; dirty = false; document.body.classList.remove("editing");
  /* Saved changes are already on screen (the live site takes a minute to catch up), so only
     reload from the site when unsaved edits are being thrown away. */
  if(discard) load(); else renderAll();
}

async function save(){
  const b = $("btn-save"); b.disabled = true; msg("Saving…");
  try{
    // Clean up before saving: trim text and drop completely empty items.
    for(const sec of Object.keys(SCHEMA)){
      DATA[sec] = DATA[sec].map(it => { const o = {}; for(const k in it) o[k] = typeof it[k] === "string" ? it[k].trim() : it[k]; return o; })
                           .filter(it => SCHEMA[sec].fields.some(([k]) => k !== "color" && it[k]));
    }
    DATA.picfair = (DATA.picfair || "").trim();
    const cur = await gh("GET", `data.json?ref=${BRANCH}`);
    await gh("PUT", "data.json", {
      message: "Update site content",
      content: b64text(JSON.stringify(DATA, null, 2) + "\n"),
      sha: cur.sha, branch: BRANCH
    });
    dirty = false; renderAll();
    msg("Saved. The live site updates in about a minute.", "ok");
  }catch(e){
    if(e.status === 401 || e.status === 403) msg("GitHub refused the save. The token may have expired or lacks write access.", "err");
    else if(e.status === 409) msg("The file changed on GitHub while you were editing. Tap Save again.", "err");
    else msg("Save failed: " + e.message, "err");
  }finally{ b.disabled = false; }
}

/* ---------- image upload ---------- */
function pickFile(){
  return new Promise(res => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => res(inp.files && inp.files[0] || null);
    inp.click();
  });
}
function shrink(file, max){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("That file is not an image the browser can read.")); };
    img.src = url;
  });
}
async function upload(sec, i, key){
  const file = await pickFile(); if(!file) return;
  msg("Uploading image…");
  try{
    const data = await shrink(file, 900);
    const name = "images/" + Date.now().toString(36) + ".jpg";
    await gh("PUT", name, { message: "Add image", content: data, branch: BRANCH });
    DATA[sec][i][key] = name; dirty = true; renderAll();
    msg("Image uploaded. Tap Save to publish the change.", "ok");
  }catch(e){ msg("Upload failed: " + e.message, "err"); }
}

/* ---------- events ---------- */
document.addEventListener("input", e => {
  const t = e.target;
  if(t.id === "picfair-input"){ DATA.picfair = t.value; dirty = true; return; }
  if(!editing || !t.dataset || !t.dataset.sec) return;
  DATA[t.dataset.sec][+t.dataset.i][t.dataset.f] = t.value; dirty = true;
});
document.addEventListener("change", e => {
  const t = e.target;
  if(editing && t.tagName === "SELECT" && t.dataset.sec){ DATA[t.dataset.sec][+t.dataset.i][t.dataset.f] = t.value; dirty = true; }
});
document.addEventListener("click", e => {
  const t = e.target.closest("[data-act]"); if(!t || !editing) return;
  const sec = t.dataset.sec, i = +t.dataset.i, list = DATA[sec];
  const act = t.dataset.act;
  if(act === "upload"){ upload(sec, i, t.dataset.f); return; }
  if(act === "add"){ list.push({...SCHEMA[sec].blank}); }
  else if(act === "del"){ if(!confirm("Delete this " + SCHEMA[sec].one + "?")) return; list.splice(i, 1); }
  else if(act === "up" && i > 0){ [list[i-1], list[i]] = [list[i], list[i-1]]; }
  else if(act === "down" && i < list.length - 1){ [list[i+1], list[i]] = [list[i], list[i+1]]; }
  dirty = true; renderAll();
});
$("edit-link").addEventListener("click", startEditing);
$("btn-save").addEventListener("click", save);
$("btn-done").addEventListener("click", stopEditing);
$("btn-signout").addEventListener("click", () => {
  if(dirty && !confirm("You have unsaved changes. Sign out anyway?")) return;
  const discard = dirty;
  store.clear(); TOKEN = ""; dirty = false; editing = false; document.body.classList.remove("editing");
  if(discard) load(); else renderAll();
});
window.addEventListener("beforeunload", e => { if(dirty){ e.preventDefault(); e.returnValue = ""; } });

load();
