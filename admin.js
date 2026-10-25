import { fbAuth, ADMIN_EMAIL } from "./firebase.js";
import { COLORS, esc, designHTML } from "./design.js";

const CATS = ["Sweaters","Dresses","Gloves","Shorts","Hats & Scarves","Other"];
const $ = s => document.querySelector(s);
const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2200); };
let K, products = [], orders = [], settings = { currency:"₦" }, editId = null, newImg = null, oldImg = null, timer;

$("#pCat").innerHTML = CATS.map(c => `<option>${c}</option>`).join("");
const money = n => (settings.currency || "") + Number(n || 0).toLocaleString();

/* ---------- Sign in ---------- */
async function start(){
  K = await fbAuth();
  if(!K){ $("#loginErr").textContent = "Can't reach Firebase. Check your internet connection and try again."; return; }
  const { auth, au } = K; let denied = "";
  au.onAuthStateChanged(auth, async user => {
    if(!user){ show("login"); $("#loginErr").textContent = denied; return; }
    if(user.email !== ADMIN_EMAIL || user.emailVerified === false){
      denied = `${user.email} is not allowed here. Only the shop owner can open admin.`;
      await au.signOut(auth); return;
    }
    denied = ""; $("#who").textContent = user.email; show("app"); loadAll(); clearInterval(timer); timer = setInterval(loadOrders, 20000);
  });
  $("#googleBtn").onclick = async () => {
    $("#loginErr").textContent = "";
    try { await au.signInWithPopup(auth, new au.GoogleAuthProvider()); }
    catch(e){
      if(["auth/popup-blocked","auth/operation-not-supported-in-this-environment"].includes(e.code)) return au.signInWithRedirect(auth, new au.GoogleAuthProvider());
      if(e.code === "auth/unauthorized-domain") $("#loginErr").textContent = "Add this website's domain in Firebase → Authentication → Settings → Authorized domains.";
      else if(e.code !== "auth/popup-closed-by-user") $("#loginErr").textContent = "Sign-in failed: " + (e.code || e.message);
    }
  };
  $("#signOut").onclick = () => au.signOut(auth);
}
function show(w){ $("#login").classList.toggle("hidden", w !== "login"); $("#app").classList.toggle("hidden", w !== "app"); }

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === t));
  ["orders","products","settings"].forEach(n => $("#tab-" + n).classList.toggle("hidden", n !== t.dataset.tab));
});

/* ---------- Load data ---------- */
async function loadAll(){ await loadSettings(); await loadProducts(); await loadOrders(); }
async function loadSettings(){
  try { const s = await K.fs.getDoc(K.fs.doc(K.db, "settings", "store"));
    if(s.exists()) settings = { ...settings, ...s.data() };
    $("#sWa").value = settings.whatsapp || ""; $("#sName").value = settings.name || "BusyHands"; $("#sCur").value = settings.currency || "₦";
  } catch(e){ toast("Couldn't load settings – check Firestore rules"); }
}
async function loadProducts(){
  try { const r = await K.fs.getDocs(K.fs.collection(K.db, "products"));
    products = r.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => (b.ts||0) - (a.ts||0)); renderProducts();
  } catch(e){ toast("Couldn't load products – check Firestore rules"); }
}
async function loadOrders(){
  try { const { fs, db } = K; const r = await fs.getDocs(fs.query(fs.collection(db, "orders"), fs.orderBy("createdAt", "desc")));
    orders = r.docs.map(d => ({ id:d.id, ...d.data() })); renderOrders();
  } catch(e){ console.warn(e); }
}
$("#refresh").onclick = async () => { await loadOrders(); toast("Updated ✔"); };

/* ---------- Orders ---------- */
function renderOrders(){
  const n = orders.filter(o => o.status === "new").length;
  $("#newBadge").textContent = n; $("#newBadge").classList.toggle("hidden", !n);
  $("#orders").innerHTML = orders.length ? orders.map(o => {
    const when = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : "";
    const phone = (o.customerPhone || "").replace(/\D/g, "");
    return `<div class="order ${o.status === "done" ? "done" : ""}">
      <div class="oh"><div><b>${esc(o.code)}</b> <span class="st">${o.status === "done" ? "DONE" : "NEW"}</span><br><span class="small muted">${esc(when)}</span></div>
        <div style="text-align:right"><b>${money(o.total)}</b><br><span class="small">${esc(o.customerName || "No name given")}${o.customerPhone ? " · " + esc(o.customerPhone) : ""}</span></div></div>
      ${(o.items || []).map(it => {
        const p = products.find(x => x.id === it.pid), c = it.custom || {}, cn = (COLORS.find(x => x.c === c.color) || {}).n || "";
        return `<div class="oi">${designHTML(p?.image, c)}<ul>
          <li class="nm">${esc(it.name)} × ${it.qty}</li>
          ${c.text ? `<li>Name to knit: <span class="big-name">${esc(c.text)}</span></li><li><span class="chipc" style="background:${esc(c.color)}"></span>${esc(cn)} yarn · ${esc(c.font)} · ${esc(c.pos)}</li>` : `<li class="muted">No name requested</li>`}
          ${c.size ? `<li>📏 Size: <b>${esc(c.size)}</b></li>` : ""}${c.note ? `<li>📝 ${esc(c.note)}</li>` : ""}
          ${p ? "" : `<li class="muted small">(product photo no longer in shop)</li>`}</ul></div>`; }).join("")}
      <div class="ofoot">
        <button class="mini" data-done="${o.id}">${o.status === "done" ? "↩ Reopen" : "✔ Mark done"}</button>
        ${phone ? `<a class="mini" target="_blank" rel="noopener" href="https://wa.me/${phone}">💬 Message customer</a>` : ""}
        <button class="mini danger" data-delo="${o.id}">Delete</button></div></div>`; }).join("")
    : `<p class="empty">No orders yet 🧶<br>When a customer taps checkout, their design will show up here.</p>`;
}
$("#orders").onclick = async e => {
  const d = e.target.closest("[data-done]"), x = e.target.closest("[data-delo]"); const { fs, db } = K;
  try {
    if(d){ const o = orders.find(v => v.id === d.dataset.done); await fs.updateDoc(fs.doc(db, "orders", o.id), { status: o.status === "done" ? "new" : "done" }); await loadOrders(); }
    if(x && confirm("Delete this order for good?")){ await fs.deleteDoc(fs.doc(db, "orders", x.dataset.delo)); await loadOrders(); }
  } catch(err){ toast("Failed: " + (err.code || err.message)); }
};

/* ---------- Image compressor ---------- */
async function loadBitmap(file){
  if(window.createImageBitmap){ try { return await createImageBitmap(file); } catch(e){} }
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
}
/* crops to a centered square, resizes to max 720px, tries WebP (JPEG fallback) and lowers quality until it's under ~80 KB */
async function compress(file, maxSide = 720, targetKB = 80){
  const img = await loadBitmap(file), w = img.width, h = img.height, side = Math.min(w, h);
  const sx = (w - side) / 2, sy = (h - side) / 2, cv = document.createElement("canvas"), ctx = cv.getContext("2d");
  const type = cv.toDataURL("image/webp").startsWith("data:image/webp") ? "image/webp" : "image/jpeg";
  let out = Math.min(side, maxSide), q = .82, url;
  for(let tries = 0; tries < 8; tries++){
    cv.width = cv.height = out; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, out, out); ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
    url = cv.toDataURL(type, q);
    if(url.length * .75 / 1024 <= targetKB) break;
    if(q > .5) q -= .1; else out = Math.round(out * .85);
  }
  return { url, kb: Math.round(url.length * .75 / 1024), before: Math.round(file.size / 1024), px: out };
}
$("#pFile").onchange = async e => {
  const f = e.target.files[0]; if(!f) return;
  $("#pvInfo").textContent = "Compressing…";
  try { const r = await compress(f); newImg = r.url;
    $("#pv").innerHTML = `<img src="${r.url}" alt="">`;
    $("#pvInfo").textContent = `✔ ${r.before} KB → ${r.kb} KB (${r.px}×${r.px}px)${r.kb < r.before ? " – storage saved!" : " – optimized for the shop"}`;
  } catch(err){ $("#pvInfo").textContent = "Couldn't read that photo. Try another one."; }
};

/* ---------- Products ---------- */
function renderProducts(){
  $("#pCount").textContent = products.length ? `(${products.length})` : "";
  $("#plist").innerHTML = products.length ? products.map(p => `<div class="pi">${designHTML(p.image, null)}
    <h3>${esc(p.name)}</h3><p>${esc(p.cat)} · ${money(p.price)}${p.old ? ` <s>${money(p.old)}</s>` : ""}</p>
    <div class="row"><button class="mini" data-edit="${p.id}">Edit</button><button class="mini danger" data-del="${p.id}">Delete</button></div></div>`).join("")
    : `<p class="empty" style="grid-column:1/-1">No products yet. Add your first one above 👆<br><span class="small">Until then, customers see sample products.</span></p>`;
}
function resetForm(){
  editId = null; newImg = null; oldImg = null; $("#pFile").value = "";
  ["#pName","#pTag","#pPrice","#pOld"].forEach(s => $(s).value = ""); $("#pCustom").checked = true; $("#pCat").selectedIndex = 0;
  $("#pv").textContent = "No photo yet"; $("#formTitle").textContent = "Add a product"; $("#cancelEdit").classList.add("hidden"); $("#saveProduct").textContent = "Save product";
}
$("#cancelEdit").onclick = resetForm;
$("#plist").onclick = async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if(ed){ const p = products.find(x => x.id === ed.dataset.edit); editId = p.id; oldImg = p.image; newImg = null;
    $("#pName").value = p.name; $("#pCat").value = p.cat; $("#pTag").value = p.tag || ""; $("#pPrice").value = p.price; $("#pOld").value = p.old || ""; $("#pCustom").checked = !!p.custom;
    $("#pv").innerHTML = `<img src="${esc(p.image)}" alt="">`; $("#formTitle").textContent = "Edit product"; $("#saveProduct").textContent = "Update product"; $("#cancelEdit").classList.remove("hidden");
    $("#pvInfo").textContent = "Choose a new photo only if you want to change it."; scrollTo({ top:0, behavior:"smooth" }); }
  if(del && confirm("Delete this product?")){ try { await K.fs.deleteDoc(K.fs.doc(K.db, "products", del.dataset.del)); toast("Deleted"); await loadProducts(); } catch(err){ toast("Failed: " + (err.code || err.message)); } }
};
$("#saveProduct").onclick = async () => {
  const name = $("#pName").value.trim(), price = Number($("#pPrice").value), image = newImg || oldImg;
  if(!image) return ($("#pMsg").textContent = "Please add a product photo.");
  if(!name) return ($("#pMsg").textContent = "Please type the product name.");
  if(!(price >= 0) || $("#pPrice").value === "") return ($("#pMsg").textContent = "Please enter a price.");
  const data = { name, cat:$("#pCat").value, tag:$("#pTag").value.trim(), price, old:Number($("#pOld").value) || 0, custom:$("#pCustom").checked, image };
  const b = $("#saveProduct"); b.disabled = true; $("#pMsg").textContent = "Saving…";
  try {
    const { fs, db } = K;
    if(editId) await fs.updateDoc(fs.doc(db, "products", editId), data);
    else await fs.addDoc(fs.collection(db, "products"), { ...data, ts: Date.now() });
    $("#pMsg").textContent = ""; toast(editId ? "Product updated ✔" : "Product added ✔"); resetForm(); await loadProducts();
  } catch(err){ $("#pMsg").textContent = "Couldn't save: " + (err.code || err.message) + (err.code === "permission-denied" ? " (publish firestore.rules in Firebase)" : ""); }
  b.disabled = false;
};

/* ---------- Settings ---------- */
$("#saveSettings").onclick = async () => {
  const wa = $("#sWa").value.replace(/\D/g, "");
  if(wa.length < 8) return ($("#sMsg").textContent = "Please enter a valid WhatsApp number with country code.");
  if(wa.startsWith("0")) return ($("#sMsg").textContent = "Start with the country code, not 0. Example: 2348012345678");
  try { await K.fs.setDoc(K.fs.doc(K.db, "settings", "store"), { whatsapp:wa, name:$("#sName").value.trim() || "BusyHands", currency:$("#sCur").value.trim() || "₦" });
    $("#sMsg").textContent = ""; $("#sWa").value = wa; toast("Settings saved ✔"); await loadSettings(); renderProducts(); renderOrders();
  } catch(err){ $("#sMsg").textContent = "Couldn't save: " + (err.code || err.message); }
};

start();
