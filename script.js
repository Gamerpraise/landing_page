import { fbDB } from "./firebase.js";
import { COLORS, FONTS, POS, esc, defaultCustom, yarnStyle, designHTML, describe } from "./design.js";

/* ===========================================
   DEFAULT SETTINGS (the seller changes these in the Admin page)
=========================================== */
const STORE = { name: "BusyHands", whatsapp: "2348057940822", currency: "₦" };   // fallback until the seller saves settings in Admin
const GPRAISE = "2348057940822";   // watermark contact (don't remove)

/* ===========================================
   CODE BELOW – only edit if you know JS
=========================================== */
const $ = s => document.querySelector(s);
const money = n => STORE.currency + Number(n).toLocaleString();
let PRODUCTS = [], CATEGORIES = [], loaded = false, cart = [], filter = "All";
let SET = { on:false, title:"", text:"", discount:10, ids:[] };      // gift set, controlled from Admin
let query = "", sortBy = "new", oneCol = false;
const wish = new Set();
try { JSON.parse(localStorage.getItem("bh-wish") || "[]").forEach(id => wish.add(String(id))); oneCol = localStorage.getItem("bh-one") === "1"; } catch(e){}
const saveWish = () => { try { localStorage.setItem("bh-wish", JSON.stringify([...wish])); } catch(e){} };
const byId = id => PRODUCTS.find(p => String(p.id) === String(id));

/* ---------- Load seller's settings + products from Firebase ---------- */
async function loadRemote(){
  const k = await fbDB(); if(!k){ loaded = true; renderAll(); return; }
  const { db, fs } = k;
  try {
    const [ps, st] = await Promise.all([fs.getDocs(fs.collection(db, "products")), fs.getDoc(fs.doc(db, "settings", "store"))]);
    if(st.exists()){ const s = st.data(); if(s.whatsapp) STORE.whatsapp = s.whatsapp; if(s.name) STORE.name = s.name; if(s.currency) STORE.currency = s.currency;
      if(Array.isArray(s.categories)) CATEGORIES = s.categories.filter(c => c && c.name);
      if(s.set && typeof s.set === "object") SET = { ...SET, ...s.set }; }
    const list = ps.docs.map(d => ({ id:d.id, ...d.data(), img:d.data().image })).filter(p => p.img && p.name);
    list.sort((a,b) => (a.ts||0) - (b.ts||0)); PRODUCTS = list;
  } catch(e){ console.warn("Couldn't load the shop:", e); }
  loaded = true; document.title = `${STORE.name} – Handmade Knits With Your Name On Them`; renderAll();
}

/* ---------- Render ---------- */
function renderCats(){
  const has = CATEGORIES.length > 0;
  $("#categories").classList.toggle("hidden", !has);
  document.querySelectorAll('a[href="#categories"]').forEach(l => l.classList.toggle("hidden", !has));
  $("#catGrid").innerHTML = CATEGORIES.map(c =>
    `<div class="cat tilt" data-reveal data-cat="${esc(c.name)}"><span class="ico">${esc(c.icon || "🧶")}</span><h3>${esc(c.name)}</h3><p>${esc(c.text || "")}</p></div>`).join("");
  if(filter === "♥" && !wish.size) filter = "All";
  if(filter !== "All" && filter !== "♥" && !CATEGORIES.some(c => c.name === filter)) filter = "All";
  $("#chips").classList.toggle("hidden", !has && !wish.size);
  $("#chips").innerHTML = ["All", ...CATEGORIES.map(c => c.name)].map(n =>
    `<button class="chip ${n===filter?"on":""}" data-f="${esc(n)}">${esc(n)}</button>`).join("")
    + (wish.size ? `<button class="chip ${filter==="♥"?"on":""}" data-f="♥">♥ Saved (${wish.size})</button>` : "");
}
function renderProducts(){
  const q = query.trim().toLowerCase();
  let list = PRODUCTS.filter(p => (filter === "All" || (filter === "♥" ? wish.has(String(p.id)) : p.cat === filter))
    && (!q || [p.name, p.cat, p.tag].some(x => String(x || "").toLowerCase().includes(q))));
  list = [...list].sort(sortBy === "low" ? (a,b) => a.price - b.price : sortBy === "high" ? (a,b) => b.price - a.price : (a,b) => (b.ts||0) - (a.ts||0));
  $("#productGrid").classList.toggle("one", oneCol);
  $("#resultCount").textContent = loaded && PRODUCTS.length && (q || filter !== "All") ? `${list.length} ${list.length === 1 ? "piece" : "pieces"} found` : "";
  $("#clearSearch").classList.toggle("hidden", !q);
  $("#productGrid").innerHTML = list.length ? list.map(p => `
    <article class="product tilt">
      ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}
      <button class="heart ${wish.has(String(p.id)) ? "on" : ""}" data-heart="${esc(p.id)}" aria-label="Save ${esc(p.name)}">${wish.has(String(p.id)) ? "♥" : "♡"}</button>
      <div class="pimg" data-cust="${esc(p.id)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"><span class="glass">View in 3D</span></div>
      <div class="pinfo">
        <div class="cat-name">${esc(p.cat)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="price price-line">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
        <div class="prow">
          <button class="cust" data-cust="${esc(p.id)}">${p.custom ? "Customize" : "View in 3D"} <i class="sp">✨</i></button>
          <button class="add" data-add="${esc(p.id)}" aria-label="Quick add ${esc(p.name)}">+</button>
        </div>
      </div>
    </article>`).join("")
    : (!loaded ? `<p class="empty" style="grid-column:1/-1">Loading the shop… 🧶</p>`
      : !PRODUCTS.length ? `<p class="empty" style="grid-column:1/-1">Nothing here yet – coming soon! 🧶</p>`
      : `<p class="empty" style="grid-column:1/-1">${filter === "♥" ? "You haven't saved anything yet. Tap the ♡ on a piece you love." : `No pieces match “${esc(query)}”. Try another word.`}</p>`);
  initEffects();
}
/* ---------- Gift set (the seller chooses the pieces in Admin) ---------- */
function setInfo(){
  const items = (SET.ids || []).map(byId).filter(Boolean).slice(0, 6);
  const sum = items.reduce((a,p) => a + Number(p.price), 0);
  const disc = Math.min(90, Math.max(0, Number(SET.discount) || 0));
  return { items, sum, disc, price: Math.round(sum * (1 - disc/100)), show: !!SET.on && items.length >= 2 };
}
function renderSet(){
  const { items, sum, disc, price, show } = setInfo();
  $("#spin").classList.toggle("hidden", !show);
  document.querySelectorAll('a[href="#spin"]').forEach(l => l.classList.toggle("hidden", !show));
  if(!show) return;
  $("#setTitle").textContent = SET.title || "The Gift Set";
  $("#setText").textContent = SET.text || "Pieces picked to go together, knitted to match and wrapped like a gift. Add a name to each piece for a gift she'll never forget.";
  $("#setBadge").textContent = disc > 0 ? `🎁 Save ${disc}%` : "🎁 Gift favourite";
  $("#setItems").innerHTML = items.map(p => `<li>${esc(p.name)}</li>`).join("");
  $("#dealPrice").innerHTML = disc > 0 ? `<s>${money(sum)}</s> <b>${money(price)}</b>` : `<b>${money(sum)}</b>`;
  renderBox();
}
function renderAll(){
  document.querySelectorAll("#shopName,.fname").forEach(el => el.textContent = STORE.name);
  renderCats(); renderProducts(); renderRing(); renderSet(); renderCart();
  initEffects();
}

/* ---------- Hero 3D ring ---------- */
const ring = $("#ring");
let ringN = 6;
function renderRing(){
  const items = PRODUCTS.slice(0, 6); ringN = items.length || 1; $("#scene").classList.toggle("hidden", !items.length);
  ring.innerHTML = items.map(p => `<div class="rc"><img src="${esc(p.img)}" alt="${esc(p.name)}"><h4>${esc(p.name)}</h4><span>${money(p.price)}</span></div>`).join("");
  placeRing();
}
function placeRing(){
  const r = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ring-r")) || 270;
  ring.querySelectorAll(".rc").forEach((el,i) => el.style.transform = `rotateY(${i*(360/ringN)}deg) translateZ(${r}px)`);
}
addEventListener("resize", () => { placeRing(); placeBox(); });
let ringY = 0, ringX = -8, vel = .25, dragging = false, lastX = 0;
const scene = $("#scene");
scene.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; scene.setPointerCapture(e.pointerId); });
scene.addEventListener("pointermove", e => { if(dragging){ const dx = e.clientX - lastX; ringY += dx*.5; vel = dx*.08; lastX = e.clientX; } });
["pointerup","pointercancel"].forEach(ev => scene.addEventListener(ev, () => dragging = false));
scene.addEventListener("mousemove", e => { if(dragging) return; const b = scene.getBoundingClientRect(); ringX = -8 + ((e.clientY-b.top)/b.height-.5)*-14; });

/* ---------- Spin box ---------- */
const box = $("#box"), stage = $("#boxStage");
function renderBox(){
  const imgs = setInfo().items.map(p => p.img); while(imgs.length && imgs.length < 6) imgs.push(...imgs);
  box.innerHTML = imgs.slice(0,6).map(src => `<div class="face"><img src="${esc(src)}" alt=""></div>`).join(""); placeBox();
}
function placeBox(){
  const h = box.offsetWidth/2;
  const t = [`translateZ(${h}px)`,`rotateY(180deg) translateZ(${h}px)`,`rotateY(90deg) translateZ(${h}px)`,`rotateY(-90deg) translateZ(${h}px)`,`rotateX(90deg) translateZ(${h}px)`,`rotateX(-90deg) translateZ(${h}px)`];
  box.querySelectorAll(".face").forEach((f,i) => f.style.transform = t[i]);
}
let boxY = 30, boxX = -20, boxDrag = false, bx = 0, by = 0;
stage.addEventListener("pointerdown", e => { boxDrag = true; bx = e.clientX; by = e.clientY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener("pointermove", e => { if(!boxDrag) return; boxY += (e.clientX-bx)*.6; boxX -= (e.clientY-by)*.4; bx = e.clientX; by = e.clientY; });
["pointerup","pointercancel"].forEach(ev => stage.addEventListener(ev, () => boxDrag = false));

/* ---------- 3D customizer ---------- */
const slab = $("#slab"), viewer = $("#viewer");
let cur = null, vY = -25, vX = -8, vDrag = false, vx = 0, vy = 0, vAuto = true;
function buildSlab(p){
  slab.innerHTML = `
    <div class="sf front"><img src="${esc(p.img)}" alt=""><span class="yt" id="ytFront"></span></div>
    <div class="sf back"><div><b>Knitted for</b><span class="yt" id="ytBack"></span><div id="backInfo"></div><small>${esc(STORE.name)} 🧶</small></div></div>
    <div class="sf side r"></div><div class="sf side l"></div><div class="sf side t"></div><div class="sf side b"></div>`;
}
function paintSlab(){
  const c = cur.c, st = yarnStyle(c), show = !!c.text;
  ["#ytFront","#ytBack"].forEach(id => { const el = $(id); el.textContent = c.text; el.style.cssText = st + (id==="#ytBack" ? ";position:static;top:auto" : ""); el.classList.toggle("hidden", !show); });
  $("#backInfo").textContent = [c.size && `Size ${c.size}`, c.note].filter(Boolean).join(" · ");
}
function openCustomizer(id){
  const p = byId(id); if(!p) return;
  cur = { p, c: defaultCustom(), qty: 1 };
  $("#mName").textContent = p.name;
  $("#mPrice").innerHTML = `${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}`;
  $("#cText").value = ""; $("#cSize").value = ""; $("#cNote").value = ""; $("#qVal").textContent = 1;
  $("#cText").parentElement.classList.toggle("hidden", !p.custom);
  ["#cColors","#cFonts","#cPos"].forEach(s => { const l = $(s).previousElementSibling; l.classList.toggle("hidden", !p.custom); $(s).classList.toggle("hidden", !p.custom); });
  $("#cColors").innerHTML = COLORS.map(x => `<button class="sw ${x.c===cur.c.color?"on":""}" style="background:${x.c}" data-color="${x.c}" title="${x.n}" aria-label="${x.n}"></button>`).join("");
  $("#cFonts").innerHTML = FONTS.map(x => `<button class="oc ${x.n===cur.c.font?"on":""}" style="font-family:${x.f}" data-font="${x.n}">${x.n}</button>`).join("");
  $("#cPos").innerHTML = POS.map(x => `<button class="oc ${x.n===cur.c.pos?"on":""}" data-pos="${x.n}">${x.n}</button>`).join("");
  buildSlab(p); paintSlab(); vY = -25; vX = -8; vAuto = true;
  document.body.classList.add("modal-open"); $("#modal").setAttribute("aria-hidden","false");
}
function closeCustomizer(){ document.body.classList.remove("modal-open"); $("#modal").setAttribute("aria-hidden","true"); }
viewer.addEventListener("pointerdown", e => { vDrag = true; vAuto = false; vx = e.clientX; vy = e.clientY; viewer.setPointerCapture(e.pointerId); });
viewer.addEventListener("pointermove", e => { if(!vDrag) return; vY += (e.clientX-vx)*.7; vX = Math.max(-40, Math.min(40, vX - (e.clientY-vy)*.4)); vx = e.clientX; vy = e.clientY; });
["pointerup","pointercancel"].forEach(ev => viewer.addEventListener(ev, () => vDrag = false));
$("#modal").addEventListener("input", e => {
  if(!cur) return;
  if(e.target.id === "cText") cur.c.text = e.target.value.trim();
  if(e.target.id === "cSize") cur.c.size = e.target.value.trim();
  if(e.target.id === "cNote") cur.c.note = e.target.value.trim();
  paintSlab();
});
$("#modal").addEventListener("click", e => {
  if(e.target === $("#modal")) return closeCustomizer();
  const t = e.target.closest("[data-color],[data-font],[data-pos]"); if(!t || !cur) return;
  const grp = t.parentElement;
  if(t.dataset.color) cur.c.color = t.dataset.color;
  if(t.dataset.font) cur.c.font = t.dataset.font;
  if(t.dataset.pos) cur.c.pos = t.dataset.pos;
  grp.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === t)); paintSlab();
});
$("#closeModal").addEventListener("click", closeCustomizer);
$("#qMinus").addEventListener("click", () => { cur.qty = Math.max(1, cur.qty-1); $("#qVal").textContent = cur.qty; });
$("#qPlus").addEventListener("click", () => { cur.qty = Math.min(20, cur.qty+1); $("#qVal").textContent = cur.qty; });
$("#mAdd").addEventListener("click", () => { addToCart(cur.p, cur.c, cur.qty); closeCustomizer(); setCart(true); });

/* ---------- Animation loop ---------- */
(function loop(){
  if(!dragging){ vel += (.25 - vel)*.03; ringY += vel; }
  ring.style.transform = `rotateX(${ringX}deg) rotateY(${ringY}deg)`;
  if(!boxDrag) boxY += .4;
  box.style.transform = `rotateX(${boxX}deg) rotateY(${boxY}deg)`;
  if(cur){ if(vAuto) vY += .5; slab.style.transform = `rotateX(${vX}deg) rotateY(${vY}deg)`; }
  requestAnimationFrame(loop);
})();

/* ---------- tilt + reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add("show"); io.unobserve(e.target); } }), { threshold:.1 });
function initEffects(){
  document.querySelectorAll(".tilt").forEach(el => {
    if(el.dataset.t) return; el.dataset.t = 1;
    el.addEventListener("pointermove", e => { if(e.pointerType !== "mouse") return; const b = el.getBoundingClientRect();
      const x = (e.clientX-b.left)/b.width-.5, y = (e.clientY-b.top)/b.height-.5; el.style.transform = `perspective(900px) rotateY(${x*8}deg) rotateX(${-y*8}deg) translateY(-4px)`; });
    el.addEventListener("pointerleave", () => el.style.transform = "");
  });
  document.querySelectorAll("[data-reveal]:not(.show)").forEach(el => io.observe(el));
}
addEventListener("scroll", () => { document.querySelectorAll(".float-shapes > *").forEach((el,i) => el.style.translate = `0 ${scrollY*(.08+i*.04)}px`); }, { passive:true });

/* ---------- Bag ---------- */
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800); }
const setCart = open => document.body.classList.toggle("cart-open", open);
function addToCart(p, c, qty = 1){
  const custom = p.custom ? { ...c } : { ...defaultCustom(), text:"", size:c.size, note:c.note };
  const key = p.id + "|" + JSON.stringify(custom);
  const f = cart.find(x => x.key === key);
  f ? f.qty += qty : cart.push({ key, p, custom, qty });
  renderCart(); toast(`Added ${p.name} 🎉`);
  const b = $("#openCart"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}
function renderCart(){
  $("#cartCount").textContent = cart.reduce((a,c) => a + c.qty, 0);
  $("#cartTotal").textContent = money(cart.reduce((a,c) => a + c.qty*c.p.price, 0));
  $("#cartItems").innerHTML = cart.length ? cart.map((c,i) => `
    <div class="ci">${designHTML(c.p.img, c.custom)}<div>${esc(c.p.name)}<br><b>${money(c.p.price)}</b> × ${c.qty}<small>${esc(describe(c.custom))}</small></div><button data-rm="${i}" aria-label="Remove">✕</button></div>`).join("")
    : `<p class="empty">Your bag is empty 🧶<br>Add something you love!</p>`;
}
const shortCode = () => "BH-" + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString(36).slice(-2).toUpperCase();

async function checkout(e){
  e.preventDefault();
  if(!cart.length) return toast("Your bag is empty 🧶");
  const btn = $("#checkout"), label = btn.textContent; btn.textContent = "Sending your design…";
  const code = shortCode();
  const name = $("#buyerName").value.trim().slice(0,60), phone = $("#buyerPhone").value.trim().slice(0,30);
  const total = cart.reduce((a,c) => a + c.qty*c.p.price, 0);
  const items = cart.map(c => ({ pid:String(c.p.id), name:c.p.name, price:Number(c.p.price), qty:c.qty,
    custom:{ text:c.custom.text||"", color:c.custom.color||"", font:c.custom.font||"", pos:c.custom.pos||"", size:c.custom.size||"", note:c.custom.note||"" } }));
  /* save the design so the seller can see it in Admin (never blocks WhatsApp) */
  try {
    const k = await fbDB();
    if(k){ const { db, fs } = k;
      await Promise.race([ fs.addDoc(fs.collection(db,"orders"), { code, items, total, currency:STORE.currency, customerName:name, customerPhone:phone, status:"new", createdAt:fs.serverTimestamp() }),
        new Promise((_,rej) => setTimeout(() => rej(new Error("timeout")), 5000)) ]); }
  } catch(err){ console.warn("Order not saved to admin:", err); }
  const lines = cart.map(c => {
    const d = c.custom, extra = [];
    if(d.text) extra.push(`   ✍️ Name: ${d.text} | Yarn: ${(COLORS.find(x=>x.c===d.color)||{}).n||""} | Style: ${d.font} | Where: ${d.pos}`);
    if(d.size) extra.push(`   📏 Size: ${d.size}`);
    if(d.note) extra.push(`   📝 ${d.note}`);
    return `• ${c.p.name} x${c.qty} – ${money(c.p.price*c.qty)}` + (extra.length ? "\n" + extra.join("\n") : "");
  }).join("\n");
  const msg = `Hello ${STORE.name} 👋, I want to order:\n${lines}\n\nTotal: ${money(total)}\n🆔 Order ${code} (my design is saved in your admin)` + (name ? `\n👤 ${name}` : "");
  btn.textContent = label;
  location.href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
$("#checkout").addEventListener("click", checkout);
$("#dealBtn").addEventListener("click", e => { e.preventDefault(); const { items, price, disc } = setInfo();
  const msg = `Hello ${STORE.name} 👋, I want ${SET.title || "the gift set"}:\n` + items.map(p => `• ${p.name}`).join("\n")
    + `\nSet price: ${money(price)}${disc > 0 ? ` (${disc}% off)` : ""}\nPlease tell me how to add the names.`;
  location.href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`; });
$("#openCart").addEventListener("click", () => setCart(true));
$("#closeCart").addEventListener("click", () => setCart(false));
$("#overlay").addEventListener("click", () => setCart(false));
addEventListener("keydown", e => { if(e.key === "Escape"){ closeCustomizer(); setCart(false); } });

document.addEventListener("click", e => {
  const hb = e.target.closest("[data-heart]");
  if(hb){ const id = String(hb.dataset.heart); const on = !wish.has(id); on ? wish.add(id) : wish.delete(id); saveWish();
    hb.classList.toggle("on", on); hb.textContent = on ? "♥" : "♡"; toast(on ? "Saved to your favourites" : "Removed from favourites");
    renderCats(); if(filter === "♥") renderProducts(); return; }
  const add = e.target.closest("[data-add]"); if(add){ const p = byId(add.dataset.add); if(p) addToCart(p, defaultCustom(), 1); }
  const cu = e.target.closest("[data-cust]"); if(cu) openCustomizer(cu.dataset.cust);
  const rm = e.target.closest("[data-rm]"); if(rm){ cart.splice(+rm.dataset.rm, 1); renderCart(); }
  const chip = e.target.closest(".chip"); if(chip){ filter = chip.dataset.f; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === chip)); renderProducts(); }
  const cat = e.target.closest(".cat"); if(cat){ filter = cat.dataset.cat; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.f === filter)); renderProducts(); $("#products").scrollIntoView({ behavior:"smooth" }); }
});

/* ---------- search, sort, layout ---------- */
const ICON_2 = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>`;
const ICON_1 = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/></svg>`;
const setGT = () => { $("#gridToggle").innerHTML = oneCol ? ICON_1 : ICON_2; $("#gridToggle").setAttribute("aria-label", oneCol ? "Show two per row" : "Show one per row"); };
$("#search").addEventListener("input", e => { query = e.target.value; renderProducts(); });
$("#clearSearch").addEventListener("click", () => { query = ""; $("#search").value = ""; renderProducts(); $("#search").focus(); });
$("#sort").addEventListener("change", e => { sortBy = e.target.value; renderProducts(); });
$("#gridToggle").addEventListener("click", () => { oneCol = !oneCol; try { localStorage.setItem("bh-one", oneCol ? "1" : "0"); } catch(e){} setGT(); renderProducts(); });
setGT();

/* hide the floating Shop Now button while the products are on screen */
new IntersectionObserver(([en]) => document.querySelector(".sticky-btn").classList.toggle("off", en.isIntersecting), { threshold:0 }).observe($("#products"));

/* ---------- 3D name studio ---------- */
const ST = { color: COLORS[0].c, font: FONTS[0] };
const stWord = $("#stWord"), stStage = $("#stStage");
function renderStudioControls(){
  $("#stColors").innerHTML = COLORS.map(c => `<button class="sw ${c.c===ST.color?"on":""}" data-stc="${c.c}" style="background:${c.c}" aria-label="${c.n}"></button>`).join("");
  $("#stFonts").innerHTML = FONTS.map(f => `<button class="oc ${f.n===ST.font.n?"on":""}" data-stf="${f.n}" style="font-family:${f.f}">${f.n}</button>`).join("");
}
function renderStudio(){
  const txt = $("#stName").value.trim() || "Your name", w = stStage.clientWidth || 320;
  const fs = Math.max(34, Math.min(130, (w * .86) / (txt.length * .52 + .6))) * ST.font.k;
  const N = 14, layers = [];
  for(let i = 0; i < N; i++){
    const front = i === N - 1, z = (i - N/2) * 2.4;
    const col = front ? ST.color : `color-mix(in srgb, ${ST.color} ${35 + i*4}%, #4a1c36)`;
    layers.push(`<span class="stl ${front?"front":""}" style="transform:translateZ(${z}px);color:${col}">${esc(txt)}</span>`);
  }
  stWord.style.cssText = `font-family:${ST.font.f};font-size:${fs}px`;
  stWord.innerHTML = layers.join("");
}
$("#stName").addEventListener("input", renderStudio);
$("#stColors").addEventListener("click", e => { const b = e.target.closest("[data-stc]"); if(!b) return; ST.color = b.dataset.stc; renderStudioControls(); renderStudio(); });
$("#stFonts").addEventListener("click", e => { const b = e.target.closest("[data-stf]"); if(!b) return; ST.font = FONTS.find(f => f.n === b.dataset.stf); renderStudioControls(); renderStudio(); });
let stY = -20, stX = -8, stDrag = false, stx = 0, sty = 0;
stStage.addEventListener("pointerdown", e => { stDrag = true; stx = e.clientX; sty = e.clientY; stStage.setPointerCapture(e.pointerId); });
stStage.addEventListener("pointermove", e => { if(!stDrag) return; stY += (e.clientX - stx) * .6; stX = Math.max(-35, Math.min(25, stX - (e.clientY - sty) * .3)); stx = e.clientX; sty = e.clientY; });
["pointerup","pointercancel"].forEach(ev => stStage.addEventListener(ev, () => stDrag = false));
(function stLoop(){
  if(!stDrag){ const target = Math.sin(Date.now() / 1500) * 26; stY += (target - (((stY + 180) % 360) - 180)) * .03; stX += (-8 - stX) * .03; }
  stWord.style.transform = `rotateX(${stX}deg) rotateY(${stY}deg)`;
  requestAnimationFrame(stLoop);
})();
addEventListener("resize", renderStudio);
renderStudioControls(); renderStudio();

renderAll(); loadRemote();
