/* ===========================================
   STORE SETTINGS  –  EDIT THIS PART
=========================================== */
const STORE = {
  name: "Velora Market",
  whatsapp: "2348057940822",   // your number, country code, no + or spaces
  currency: "$"                // e.g. "₦" or "$"
};

// Add / edit / delete products here. Put images inside the assets/ folder.
const PRODUCTS = [
  { id:1, name:"Silky Body Wave Bundle", cat:"Hair",       price:85,  old:110, img:"assets/hair.svg",     tag:"Best seller" },
  { id:2, name:"Blush Satin Dress",      cat:"Clothes",    price:60,  old:0,   img:"assets/dress.svg",    tag:"New" },
  { id:3, name:"Cloud Runner Sneakers",  cat:"Shoes",      price:75,  old:95,  img:"assets/sneakers.svg", tag:"-20%" },
  { id:4, name:"Midnight Leather Bag",   cat:"Bags",       price:90,  old:0,   img:"assets/bag.svg",      tag:"Hot" },
  { id:5, name:"Rose Noir Perfume",      cat:"Beauty",     price:45,  old:55,  img:"assets/perfume.svg",  tag:"Gift" },
  { id:6, name:"Golden Hour Shades",     cat:"Accessories",price:30,  old:0,   img:"assets/shades.svg",   tag:"New" },
  { id:7, name:"Gold Classic Watch",     cat:"Accessories",price:120, old:150, img:"assets/watch.svg",    tag:"-20%" },
  { id:8, name:"Plum Cozy Hoodie",       cat:"Clothes",    price:55,  old:0,   img:"assets/hoodie.svg",   tag:"Cozy" }
];

const CATEGORIES = [
  { name:"Hair", icon:"💇‍♀️", text:"Bundles & wigs" },
  { name:"Clothes", icon:"👗", text:"Dresses & streetwear" },
  { name:"Shoes", icon:"👟", text:"Sneakers & heels" },
  { name:"Bags", icon:"👜", text:"Totes & clutches" },
  { name:"Beauty", icon:"💄", text:"Scents & skincare" },
  { name:"Accessories", icon:"🕶️", text:"Watches & shades" }
];

/* ===========================================
   CODE BELOW – only edit if you know JS
=========================================== */
const $ = s => document.querySelector(s);
const money = n => STORE.currency + n.toLocaleString();
let cart = [];
let filter = "All";

/* ---------- Render ---------- */
$("#catGrid").innerHTML = CATEGORIES.map(c =>
  `<div class="cat tilt" data-reveal data-cat="${c.name}"><span class="ico">${c.icon}</span><h3>${c.name}</h3><p>${c.text}</p></div>`).join("");

$("#chips").innerHTML = ["All", ...CATEGORIES.map(c => c.name)].map(n =>
  `<button class="chip ${n==="All"?"on":""}" data-f="${n}">${n}</button>`).join("");

function renderProducts(){
  const list = PRODUCTS.filter(p => filter==="All" || p.cat===filter);
  $("#productGrid").innerHTML = list.length ? list.map(p => `
    <article class="product tilt" data-reveal>
      ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
      <div class="pimg"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
      <div class="pinfo">
        <div class="cat-name">${p.cat}</div>
        <h3>${p.name}</h3>
        <div class="prow">
          <div class="price">${money(p.price)}${p.old ? `<s>${money(p.old)}</s>` : ""}</div>
          <button class="add" data-add="${p.id}" aria-label="Add ${p.name}">+</button>
        </div>
      </div>
    </article>`).join("") : `<p class="empty" style="grid-column:1/-1">Nothing here yet – coming soon!</p>`;
  initEffects();
}

/* ---------- Hero 3D ring (drag + auto spin) ---------- */
const ring = $("#ring");
const ringItems = PRODUCTS.slice(0, 6);
ring.innerHTML = ringItems.map(p =>
  `<div class="rc"><img src="${p.img}" alt="${p.name}"><h4>${p.name}</h4><span>${money(p.price)}</span></div>`).join("");

function placeRing(){
  const r = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ring-r")) || 300;
  ring.querySelectorAll(".rc").forEach((el, i) =>
    el.style.transform = `rotateY(${i * (360/ringItems.length)}deg) translateZ(${r}px)`);
}
placeRing(); addEventListener("resize", placeRing);

let ringY = 0, ringX = -8, vel = 0.25, dragging = false, lastX = 0;
function dragify(el, onMove){
  el.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", e => { if(dragging){ onMove(e.clientX - lastX); lastX = e.clientX; } });
  ["pointerup","pointercancel"].forEach(ev => el.addEventListener(ev, () => dragging = false));
}
dragify($("#scene"), dx => { ringY += dx * 0.5; vel = dx * 0.08; });
$("#scene").addEventListener("mousemove", e => {
  if(dragging) return;
  const b = e.currentTarget.getBoundingClientRect();
  ringX = -8 + ((e.clientY - b.top) / b.height - .5) * -14;
});

/* ---------- Spin box ---------- */
const box = $("#box");
const faceImgs = ["hair","dress","perfume","bag","sneakers","shades"];
const half = () => box.offsetWidth / 2;
box.innerHTML = faceImgs.map(n => `<div class="face"><img src="assets/${n}.svg" alt=""></div>`).join("");
function placeBox(){
  const h = half();
  const t = [`translateZ(${h}px)`,`rotateY(180deg) translateZ(${h}px)`,`rotateY(90deg) translateZ(${h}px)`,
             `rotateY(-90deg) translateZ(${h}px)`,`rotateX(90deg) translateZ(${h}px)`,`rotateX(-90deg) translateZ(${h}px)`];
  box.querySelectorAll(".face").forEach((f,i) => f.style.transform = t[i]);
}
placeBox(); addEventListener("resize", placeBox);
let boxY = 30, boxX = -20, boxVel = 0.4, boxDrag = false, bx = 0, by = 0;
const stage = $("#boxStage");
stage.addEventListener("pointerdown", e => { boxDrag = true; bx = e.clientX; by = e.clientY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener("pointermove", e => { if(!boxDrag) return; boxY += (e.clientX-bx)*.6; boxX -= (e.clientY-by)*.4; bx = e.clientX; by = e.clientY; });
["pointerup","pointercancel"].forEach(ev => stage.addEventListener(ev, () => boxDrag = false));

/* ---------- Animation loop ---------- */
(function loop(){
  if(!dragging){ vel += (0.25 - vel) * 0.03; ringY += vel; }
  ring.style.transform = `rotateX(${ringX}deg) rotateY(${ringY}deg)`;
  if(!boxDrag) boxY += boxVel;
  box.style.transform = `rotateX(${boxX}deg) rotateY(${boxY}deg)`;
  requestAnimationFrame(loop);
})();

/* ---------- 3D tilt cards + scroll reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if(e.isIntersecting){ e.target.classList.add("show"); io.unobserve(e.target); }
}), { threshold: .1 });

function initEffects(){
  document.querySelectorAll(".tilt").forEach(el => {
    if(el.dataset.t) return; el.dataset.t = 1;
    el.addEventListener("pointermove", e => {
      if(e.pointerType === "touch") return;
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      el.style.transform = `rotateY(${x*12}deg) rotateX(${-y*12}deg) translateY(-6px)`;
    });
    el.addEventListener("pointerleave", () => el.style.transform = "");
  });
  document.querySelectorAll("[data-reveal]:not(.show)").forEach(el => io.observe(el));
}

/* ---------- Floating shapes parallax ---------- */
addEventListener("scroll", () => {
  const y = scrollY;
  document.querySelectorAll(".float-shapes > *").forEach((el, i) => el.style.translate = `0 ${y * (0.08 + i*0.04)}px`);
}, { passive: true });

/* ---------- Cart ---------- */
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 1800); }
function renderCart(){
  const count = cart.reduce((a,c) => a + c.qty, 0);
  const total = cart.reduce((a,c) => a + c.qty * c.price, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total);
  $("#cartItems").innerHTML = cart.length ? cart.map(c => `
    <div class="ci"><img src="${c.img}" alt=""><div>${c.name}<br><b>${money(c.price)}</b> × ${c.qty}</div><button data-rm="${c.id}" aria-label="Remove">✕</button></div>`).join("")
    : `<p class="empty">Your bag is empty 🛍️<br>Add something you love!</p>`;
  const lines = cart.map(c => `• ${c.name} x${c.qty} – ${money(c.price*c.qty)}`).join("\n");
  const msg = `Hello ${STORE.name}, I want to order:\n${lines}\nTotal: ${money(total)}`;
  $("#checkout").href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
const setCart = open => document.body.classList.toggle("cart-open", open);

document.addEventListener("click", e => {
  const add = e.target.closest("[data-add]");
  if(add){
    const p = PRODUCTS.find(x => x.id == add.dataset.add);
    const found = cart.find(c => c.id === p.id);
    found ? found.qty++ : cart.push({ ...p, qty: 1 });
    renderCart(); toast(`Added ${p.name} 🎉`);
    const b = $("#openCart"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  const rm = e.target.closest("[data-rm]");
  if(rm){ cart = cart.filter(c => c.id != rm.dataset.rm); renderCart(); }
  const chip = e.target.closest(".chip");
  if(chip){ filter = chip.dataset.f; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === chip)); renderProducts(); }
  const cat = e.target.closest(".cat");
  if(cat){ filter = cat.dataset.cat; document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.f === filter)); renderProducts(); $("#products").scrollIntoView({ behavior:"smooth" }); }
  const wa = e.target.closest("[data-wa]");
  if(wa){ e.preventDefault(); open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(wa.dataset.wa)}`, "_blank"); }
});
$("#dealBtn").addEventListener("click", e => { e.preventDefault(); open(`https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Hello, I want the Glow-Up Box for " + STORE.currency + "144")}`, "_blank"); });
$("#openCart").addEventListener("click", () => setCart(true));
$("#closeCart").addEventListener("click", () => setCart(false));
$("#overlay").addEventListener("click", () => setCart(false));

renderProducts(); renderCart(); initEffects();
