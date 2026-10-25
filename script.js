import { fbDB } from "./firebase.js";
import { COLORS, FONTS, POS, esc, defaultCustom, yarnStyle, designHTML, describe } from "./design.js";

/* ===========================================
   DEFAULT SETTINGS (the seller changes these in the Admin page)
=========================================== */
const STORE = { name: "BusyHands", whatsapp: "2348057940822", currency: "₦" };   // fallback until the seller saves settings in Admin

/* ===========================================
   CODE BELOW – only edit if you know JS
=========================================== */
const $ = s => document.querySelector(s);
const money = n => STORE.currency + Number(n).toLocaleString();
let PRODUCTS = [], CATEGORIES = [], loaded = false, cart = [], filter = "All";
const byId = id => PRODUCTS.find(p => String(p.id) === String(id));

/* ---------- Load seller's settings + products from Firebase ---------- */
async function loadRemote(){
  const k = await fbDB(); if(!k){ loaded = true; renderAll(); return; }
  const { db, fs } = k;
  try {
    const [ps, st] = await Promise.all([fs.getDocs(fs.collection(db, "products")), fs.getDoc(fs.doc(db, "settings", "store"))]);
    if(st.exists()){ const s = st.data(); if(s.whatsapp) STORE.whatsapp = s.whatsapp; if(s.name) STORE.name = s.name; if(s.currency) STORE.currency = s.currency;
      if(Array.isArray(s.categories)) CATEGORIES = s.categories.filter(c => c && c.name); }
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
    `<div class="cat" data-cat="${esc(c.name)}"><h3>${esc(c.name)}</h3>${c.text ? `<p>${esc(c.text)}</p>` : ""}</div>`).join("");
  if(filter !== "All" && !CATEGORIES.some(c => c.name === filter)) filter = "All";
  $("#chips").classList.toggle("hidden", !has);
  $("#chips").innerHTML = ["All", ...CATEGORIES.map(c => c.name)].map(n =>
    `<button class="chip ${n===filter?"on":""}" data-f="${esc(n)}">${esc(n)}</button>`).join("");
}
function renderProducts(){
  const list = PRODUCTS.filter(p => filter==="All" || p.cat===filter);
  $("#productGrid").innerHTML = list.length ? list.map(p => `
    <article class="product">
      ${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ""}
      <div class="pimg" data-cust="${esc(p.id)}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"></div>
      <div class="pinfo">
        <div class="cat-name">${esc(p.cat)}</div>
        <h3>${esc(p.name)}</h3>
        <div class="price price-line">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
        <div class="prow">
          <button class="cust" data-cust="${esc(p.id)}">${p.custom ? "Customize" : "View in 3D"}</button>
          <button class="add" data-add="${esc(p.id)}" aria-label="Quick add ${esc(p.name)}">Add</button>
        </div>
      </div>
    </article>`).join("") : `<p class="empty" style="grid-column:1/-1">${loaded ? "No products yet. Check back soon." : "Loading…"}</p>`;
}
function renderAll(){
  document.querySelectorAll("#shopName,.fname").forEach(el => el.textContent = STORE.name);
  renderCats(); renderProducts(); renderRing(); renderCart();
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
addEventListener("resize", placeRing);
let ringY = 0, ringX = -8, vel = .25, dragging = false, lastX = 0;
const scene = $("#scene");
scene.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; scene.setPointerCapture(e.pointerId); });
scene.addEventListener("pointermove", e => { if(dragging){ const dx = e.clientX - lastX; ringY += dx*.5; vel = dx*.08; lastX = e.clientX; } });
["pointerup","pointercancel"].forEach(ev => scene.addEventListener(ev, () => dragging = false));
scene.addEventListener("mousemove", e => { if(dragging) return; const b = scene.getBoundingClientRect(); ringX = -8 + ((e.clientY-b.top)/b.height-.5)*-14; });

/* ---------- 3D customizer ---------- */
const slab = $("#slab"), viewer = $("#viewer");
let cur = null, vY = -25, vX = -8, vDrag = false, vx = 0, vy = 0, vAuto = true;
function buildSlab(p){
  slab.innerHTML = `
    <div class="sf front"><img src="${esc(p.img)}" alt=""><span class="yt" id="ytFront"></span></div>
    <div class="sf back"><div><b>Knitted for</b><span class="yt" id="ytBack"></span><div id="backInfo"></div><small>${esc(STORE.name)}</small></div></div>
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
  if(cur){ if(vAuto) vY += .5; slab.style.transform = `rotateX(${vX}deg) rotateY(${vY}deg)`; }
  requestAnimationFrame(loop);
})();

/* ---------- Bag ---------- */
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800); }
const setCart = open => document.body.classList.toggle("cart-open", open);
function addToCart(p, c, qty = 1){
  const custom = p.custom ? { ...c } : { ...defaultCustom(), text:"", size:c.size, note:c.note };
  const key = p.id + "|" + JSON.stringify(custom);
  const f = cart.find(x => x.key === key);
  f ? f.qty += qty : cart.push({ key, p, custom, qty });
  renderCart(); toast(`Added ${p.name}`);
  const b = $("#openCart"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
}
function renderCart(){
  $("#cartCount").textContent = cart.reduce((a,c) => a + c.qty, 0);
  $("#cartTotal").textContent = money(cart.reduce((a,c) => a + c.qty*c.p.price, 0));
  $("#cartItems").innerHTML = cart.length ? cart.map((c,i) => `
    <div class="ci">${designHTML(c.p.img, c.custom)}<div>${esc(c.p.name)}<br><b>${money(c.p.price)}</b> × ${c.qty}<small>${esc(describe(c.custom))}</small></div><button data-rm="${i}" aria-label="Remove">&times;</button></div>`).join("")
    : `<p class="empty">Your bag is empty.</p>`;
}
const shortCode = () => "BH-" + Math.random().toString(36).slice(2,6).toUpperCase() + Date.now().toString(36).slice(-2).toUpperCase();

async function checkout(e){
  e.preventDefault();
  if(!cart.length) return toast("Your bag is empty");
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
    if(d.text) extra.push(`   Name: ${d.text} | Yarn: ${(COLORS.find(x=>x.c===d.color)||{}).n||""} | Style: ${d.font} | Where: ${d.pos}`);
    if(d.size) extra.push(`   Size: ${d.size}`);
    if(d.note) extra.push(`   Note: ${d.note}`);
    return `• ${c.p.name} x${c.qty} – ${money(c.p.price*c.qty)}` + (extra.length ? "\n" + extra.join("\n") : "");
  }).join("\n");
  const msg = `Hello ${STORE.name}, I want to order:\n${lines}\n\nTotal: ${money(total)}\nOrder ${code} (my design is saved in your admin)` + (name ? `\nName: ${name}` : "");
  btn.textContent = label;
  location.href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
$("#checkout").addEventListener("click", checkout);
$("#openCart").addEventListener("click", () => setCart(true));
$("#closeCart").addEventListener("click", () => setCart(false));
$("#overlay").addEventListener("click", () => setCart(false));
addEventListener("keydown", e => { if(e.key === "Escape"){ closeCustomizer(); setCart(false); } });

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]"); if(add){ const p = byId(add.dataset.add); if(p) addToCart(p, defaultCustom(), 1); }
  const cu = e.target.closest("[data-cust]"); if(cu) openCustomizer(cu.dataset.cust);
  const rm = e.target.closest("[data-rm]"); if(rm){ cart.splice(+rm.dataset.rm, 1); renderCart(); }
  const chip = e.target.closest(".chip"); if(chip){ filter = chip.dataset.f; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === chip)); renderProducts(); }
  const cat = e.target.closest(".cat"); if(cat){ filter = cat.dataset.cat; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.f === filter)); renderProducts(); $("#products").scrollIntoView({ behavior:"smooth" }); }
});

renderAll(); loadRemote();
