import { fbAuth, ADMIN_EMAIL } from "./firebase.js";
import { COLORS, esc, designHTML } from "./design.js";

const $ = s => document.querySelector(s);
const toast = m => { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 2200); };
let K, products = [], orders = [], cats = [], setSel = [], settings = { currency:"₦" }, editId = null, newImg = null, oldImg = null, timer;

const money = n => (settings.currency || "") + Number(n || 0).toLocaleString();

/* ---------- Sign in (email + password) ---------- */
const authMsg = e => ({
  "auth/invalid-credential":"Wrong email or password.", "auth/wrong-password":"Wrong email or password.", "auth/user-not-found":"Wrong email or password.",
  "auth/invalid-email":"That email doesn't look right.", "auth/too-many-requests":"Too many tries. Wait a few minutes or reset your password.",
  "auth/network-request-failed":"No internet connection.", "auth/operation-not-allowed":"Email/Password sign-in is not turned on in Firebase yet.",
  "auth/unauthorized-domain":"Add this website's domain in Firebase → Authentication → Settings → Authorized domains."
}[e.code] || ("Sign-in failed: " + (e.code || e.message)));

async function start(){
  K = await fbAuth();
  if(!K){ $("#loginErr").textContent = "Can't reach Firebase. Check your internet connection and try again."; return; }
  const { auth, au, fs, db } = K; let denied = "", justSignedIn = false;
  au.onAuthStateChanged(auth, async user => {
    if(!user){ show("login"); $("#loginErr").textContent = denied; return; }
    if((user.email || "").toLowerCase() !== ADMIN_EMAIL){
      denied = "This account does not have admin access."; await au.signOut(auth); return;
    }
    if(!user.emailVerified){
      if(justSignedIn){ justSignedIn = false; try { await au.sendEmailVerification(user); } catch(e){} }
      denied = `Verify your email first. A link was sent to ${user.email} (check spam too), then sign in again.`;
      await au.signOut(auth); return;
    }
    /* The real gate is firestore.rules: only the verified admin email can read orders. */
    try { await fs.getDocs(fs.query(fs.collection(db, "orders"), fs.limit(1))); }
    catch(e){
      denied = e.code === "permission-denied" ? "This account does not have admin access. Publish firestore.rules in Firebase." : "Couldn't check admin access (" + (e.code || e.message) + "). Try again.";
      await au.signOut(auth); return;
    }
    denied = ""; $("#who").textContent = user.email; show("app"); loadAll(); clearInterval(timer); timer = setInterval(loadOrders, 20000);
  });
  $("#loginForm").onsubmit = async e => {
    e.preventDefault(); denied = ""; $("#loginErr").textContent = ""; const b = $("#loginBtn"); b.disabled = true; b.textContent = "Signing in…";
    justSignedIn = true;
    try { await au.signInWithEmailAndPassword(auth, $("#lEmail").value.trim(), $("#lPass").value); }
    catch(err){ justSignedIn = false; $("#loginErr").textContent = authMsg(err); }
    b.disabled = false; b.textContent = "Sign in";
  };
  $("#forgotBtn").onclick = async () => {
    const em = $("#lEmail").value.trim(); if(!em) return ($("#loginErr").textContent = "Type your email above first, then tap Forgot password.");
    try { await au.sendPasswordResetEmail(auth, em); $("#loginErr").textContent = "If that email has an account, a reset link is on its way. Check spam too."; }
    catch(err){ $("#loginErr").textContent = authMsg(err); }
  };
  $("#signOut").onclick = () => au.signOut(auth);
}
function show(w){ $("#login").classList.toggle("hidden", w !== "login"); $("#app").classList.toggle("hidden", w !== "app"); }

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === t));
  ["orders","products","categories","set","settings"].forEach(n => $("#tab-" + n).classList.toggle("hidden", n !== t.dataset.tab));
});

/* ---------- Load data ---------- */
async function loadAll(){ await loadSettings(); await loadProducts(); await loadOrders(); }
async function loadSettings(){
  try { const s = await K.fs.getDoc(K.fs.doc(K.db, "settings", "store"));
    if(s.exists()) settings = { ...settings, ...s.data() };
    $("#sWa").value = settings.whatsapp || ""; $("#sName").value = settings.name || "BusyHands"; $("#sCur").value = settings.currency || "₦";
    cats = Array.isArray(settings.categories) ? settings.categories : []; renderCats();
    const st = settings.set || {}; setSel = Array.isArray(st.ids) ? st.ids.map(String) : [];
    $("#setOn").checked = !!st.on; $("#setTitle").value = st.title || ""; $("#setText").value = st.text || ""; $("#setDisc").value = st.discount ?? 10; renderSetPick();
  } catch(e){ toast("Couldn't load settings – check Firestore rules"); }
}
async function loadProducts(){
  try { const r = await K.fs.getDocs(K.fs.collection(K.db, "products"));
    products = r.docs.map(d => ({ id:d.id, ...d.data() })).sort((a,b) => (b.ts||0) - (a.ts||0)); renderProducts(); renderCats(); renderSetPick();
  } catch(e){ toast("Couldn't load products – check Firestore rules"); }
}
async function loadOrders(){
  try { const { fs, db } = K; const r = await fs.getDocs(fs.query(fs.collection(db, "orders"), fs.orderBy("createdAt", "desc")));
    orders = r.docs.map(d => ({ id:d.id, ...d.data() })); renderOrders();
  } catch(e){ console.warn(e); }
}
$("#refresh").onclick = async () => { await loadOrders(); toast("Updated"); };

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
          ${c.size ? `<li>Size: <b>${esc(c.size)}</b></li>` : ""}${c.note ? `<li>Note: ${esc(c.note)}</li>` : ""}
          ${p ? "" : `<li class="muted small">(product photo no longer in shop)</li>`}</ul></div>`; }).join("")}
      <div class="ofoot">
        <button class="mini" data-done="${o.id}">${o.status === "done" ? "Reopen" : "Mark done"}</button>
        ${phone ? `<a class="mini" target="_blank" rel="noopener" href="https://wa.me/${phone}">Message customer</a>` : ""}
        <button class="mini danger" data-delo="${o.id}">Delete</button></div></div>`; }).join("")
    : `<p class="empty">No orders yet. When a customer checks out, their design will show up here.</p>`;
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
    $("#pvInfo").textContent = `${r.before} KB → ${r.kb} KB (${r.px}×${r.px}px)${r.kb < r.before ? " (smaller file)" : " – optimized for the shop"}`;
  } catch(err){ $("#pvInfo").textContent = "Couldn't read that photo. Try another one."; }
};

/* ---------- Products ---------- */
function renderProducts(){
  $("#pCount").textContent = products.length ? `(${products.length})` : "";
  $("#plist").innerHTML = products.length ? products.map(p => `<div class="pi">${designHTML(p.image, null)}
    <h3>${esc(p.name)}</h3><p>${esc(p.cat)} · ${money(p.price)}${p.old ? ` <s>${money(p.old)}</s>` : ""}</p>
    <div class="row"><button class="mini" data-edit="${p.id}">Edit</button><button class="mini danger" data-del="${p.id}">Delete</button></div></div>`).join("")
    : `<p class="empty" style="grid-column:1/-1">No products yet. Add your first one above.</p>`;
}
function fillCatSelect(keep){
  const list = cats.map(c => c.name); if(keep && !list.includes(keep)) list.push(keep);
  $("#pCat").innerHTML = list.length ? list.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("") : `<option value="">No categories yet</option>`;
  if(keep) $("#pCat").value = keep;
}
function resetForm(){
  editId = null; newImg = null; oldImg = null; $("#pFile").value = "";
  ["#pName","#pTag","#pPrice","#pOld"].forEach(s => $(s).value = ""); $("#pCustom").checked = true; fillCatSelect();
  $("#pv").textContent = "No photo yet"; $("#formTitle").textContent = "Add a product"; $("#cancelEdit").classList.add("hidden"); $("#saveProduct").textContent = "Save product";
}
$("#cancelEdit").onclick = resetForm;
$("#plist").onclick = async e => {
  const ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
  if(ed){ const p = products.find(x => x.id === ed.dataset.edit); editId = p.id; oldImg = p.image; newImg = null;
    $("#pName").value = p.name; fillCatSelect(p.cat); $("#pTag").value = p.tag || ""; $("#pPrice").value = p.price; $("#pOld").value = p.old || ""; $("#pCustom").checked = !!p.custom;
    $("#pv").innerHTML = `<img src="${esc(p.image)}" alt="">`; $("#formTitle").textContent = "Edit product"; $("#saveProduct").textContent = "Update product"; $("#cancelEdit").classList.remove("hidden");
    $("#pvInfo").textContent = "Choose a new photo only if you want to change it."; scrollTo({ top:0, behavior:"smooth" }); }
  if(del && confirm("Delete this product?")){ try { await K.fs.deleteDoc(K.fs.doc(K.db, "products", del.dataset.del)); toast("Deleted"); await loadProducts(); } catch(err){ toast("Failed: " + (err.code || err.message)); } }
};
$("#saveProduct").onclick = async () => {
  const name = $("#pName").value.trim(), price = Number($("#pPrice").value), image = newImg || oldImg;
  if(!image) return ($("#pMsg").textContent = "Please add a product photo.");
  if(!name) return ($("#pMsg").textContent = "Please type the product name.");
  if(!(price >= 0) || $("#pPrice").value === "") return ($("#pMsg").textContent = "Please enter a price.");
  const data = { name, cat:$("#pCat").value || "", tag:$("#pTag").value.trim(), price, old:Number($("#pOld").value) || 0, custom:$("#pCustom").checked, image };
  const b = $("#saveProduct"); b.disabled = true; $("#pMsg").textContent = "Saving…";
  try {
    const { fs, db } = K;
    if(editId) await fs.updateDoc(fs.doc(db, "products", editId), data);
    else await fs.addDoc(fs.collection(db, "products"), { ...data, ts: Date.now() });
    $("#pMsg").textContent = ""; toast(editId ? "Product updated" : "Product added"); resetForm(); await loadProducts();
  } catch(err){ $("#pMsg").textContent = "Couldn't save: " + (err.code || err.message) + (err.code === "permission-denied" ? " (publish firestore.rules in Firebase)" : ""); }
  b.disabled = false;
};

/* ---------- Categories (the seller decides these) ---------- */
function renderCats(){
  $("#cCount").textContent = cats.length ? `(${cats.length})` : "";
  $("#catList").innerHTML = cats.length ? cats.map((c, i) => {
    const n = products.filter(p => p.cat === c.name).length;
    return `<div class="catrow"><span class="ci-ico">${esc(c.icon || "🧶")}</span><div class="ci-t"><b>${esc(c.name)}</b><span>${esc(c.text || "")}${c.text ? " · " : ""}${n} product${n === 1 ? "" : "s"}</span></div>
      <button class="mini" data-cup="${i}" aria-label="Move up" ${i === 0 ? "disabled" : ""}>↑</button><button class="mini danger" data-cdel="${i}">Delete</button></div>`; }).join("")
    : `<p class="empty">No categories yet. Add your first one above, then pick it when you add products.</p>`;
  fillCatSelect($("#pCat").value || "");
}
async function saveCats(msg){
  try { await K.fs.setDoc(K.fs.doc(K.db, "settings", "store"), { categories: cats }, { merge:true }); settings.categories = cats; renderCats(); renderProducts(); toast(msg); }
  catch(err){ $("#cMsg").textContent = "Couldn't save: " + (err.code || err.message) + (err.code === "permission-denied" ? " (publish firestore.rules in Firebase)" : ""); await loadSettings(); }
}
$("#addCat").onclick = async () => {
  const name = $("#cName").value.trim().replace(/\s+/g, " "), icon = $("#cIcon").value.trim() || "🧶", text = $("#cText").value.trim();
  if(!name) return ($("#cMsg").textContent = "Please type a category name.");
  if(cats.some(c => c.name.toLowerCase() === name.toLowerCase())) return ($("#cMsg").textContent = "You already have that category.");
  $("#cMsg").textContent = ""; cats = [...cats, { name, icon, text }];
  await saveCats("Category added ✔"); $("#cName").value = ""; $("#cIcon").value = ""; $("#cText").value = "";
};
$("#catList").onclick = async e => {
  const up = e.target.closest("[data-cup]"), del = e.target.closest("[data-cdel]");
  if(up){ const i = +up.dataset.cup; if(i > 0){ cats = [...cats]; [cats[i-1], cats[i]] = [cats[i], cats[i-1]]; await saveCats("Order saved"); } }
  if(del){ const i = +del.dataset.cdel, c = cats[i], n = products.filter(p => p.cat === c.name).length;
    if(confirm(n ? `Delete “${c.name}”? ${n} product(s) use it. They stay in your shop but won't appear under this category.` : `Delete “${c.name}”?`)){ cats = cats.filter((_, k) => k !== i); await saveCats("Category deleted"); } }
};

/* ---------- Gift set (the seller picks the pieces) ---------- */
function setNumbers(){
  const chosen = setSel.map(id => products.find(p => String(p.id) === id)).filter(Boolean);
  const sum = chosen.reduce((a, p) => a + Number(p.price), 0), d = Math.min(90, Math.max(0, Number($("#setDisc").value) || 0));
  return { chosen, sum, d, price: Math.round(sum * (1 - d/100)) };
}
function renderSetPick(){
  $("#setPick").innerHTML = products.length ? products.map(p => {
    const on = setSel.includes(String(p.id));
    return `<button type="button" class="sp-item ${on ? "on" : ""}" data-sp="${esc(p.id)}"><span class="tick">✔</span><img src="${esc(p.image)}" alt=""><b>${esc(p.name)}</b><span>${esc(settings.currency || "₦")}${Number(p.price).toLocaleString()}</span></button>`; }).join("")
    : `<p class="empty">Add products first, then come back to build a set.</p>`;
  const { chosen, sum, d, price } = setNumbers(), cur = settings.currency || "₦";
  $("#setSummary").textContent = chosen.length ? `${chosen.length} selected · pieces total ${cur}${sum.toLocaleString()} · customers pay ${cur}${price.toLocaleString()}${d ? ` (${d}% off)` : ""}` : "Nothing selected yet.";
}
$("#setPick").onclick = e => { const b = e.target.closest("[data-sp]"); if(!b) return; const id = String(b.dataset.sp);
  if(setSel.includes(id)) setSel = setSel.filter(x => x !== id);
  else if(setSel.length >= 6) return ($("#setMsg").textContent = "A set can have up to 6 pieces.");
  else setSel = [...setSel, id];
  $("#setMsg").textContent = ""; renderSetPick(); };
$("#setDisc").oninput = renderSetPick;
$("#saveSet").onclick = async () => {
  const ids = setSel.filter(id => products.some(p => String(p.id) === id)), on = $("#setOn").checked;
  if(on && ids.length < 2) return ($("#setMsg").textContent = "Pick at least 2 products, or untick “Show the gift set”.");
  const set = { on, title: $("#setTitle").value.trim(), text: $("#setText").value.trim(), discount: Math.min(90, Math.max(0, Math.round(Number($("#setDisc").value) || 0))), ids };
  try { await K.fs.setDoc(K.fs.doc(K.db, "settings", "store"), { set }, { merge:true }); settings.set = set; $("#setMsg").textContent = ""; toast(on ? "Gift set saved" : "Saved (hidden on shop)"); }
  catch(err){ $("#setMsg").textContent = "Couldn't save: " + (err.code || err.message); }
};

/* ---------- Settings ---------- */
$("#saveSettings").onclick = async () => {
  const wa = $("#sWa").value.replace(/\D/g, "");
  if(wa.length < 8) return ($("#sMsg").textContent = "Please enter a valid WhatsApp number with country code.");
  if(wa.startsWith("0")) return ($("#sMsg").textContent = "Start with the country code, not 0. Example: 2348012345678");
  try { await K.fs.setDoc(K.fs.doc(K.db, "settings", "store"), { whatsapp:wa, name:$("#sName").value.trim() || "BusyHands", currency:$("#sCur").value.trim() || "₦" }, { merge:true });
    $("#sMsg").textContent = ""; $("#sWa").value = wa; toast("Settings saved"); await loadSettings(); renderProducts(); renderOrders();
  } catch(err){ $("#sMsg").textContent = "Couldn't save: " + (err.code || err.message); }
};

start();
