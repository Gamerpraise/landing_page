/* Shared by the store AND the admin page: yarn colors, fonts, and the
   "stitched name on product" preview so the seller sees EXACTLY what the buyer designed. */
export const COLORS = [
  {n:"Rose",c:"#ff5d8f"},{n:"Cream",c:"#fff3e0"},{n:"Baby Blue",c:"#7fc4ff"},{n:"Lilac",c:"#b79cff"},
  {n:"Mint",c:"#7fe0b8"},{n:"Sunny",c:"#ffc94a"},{n:"Plum",c:"#6a3b8a"},{n:"Cocoa",c:"#8a5a44"}
];
export const FONTS = [
  {n:"Script",f:"'Dancing Script',cursive",k:1},
  {n:"Bubble",f:"'Fredoka',sans-serif",k:.85},
  {n:"Classic",f:"'Fraunces',Georgia,serif",k:.9}
];
export const POS = [{n:"Chest",y:36},{n:"Center",y:52},{n:"Bottom",y:70}];

export const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
export const defaultCustom = () => ({ text:"", color:COLORS[0].c, font:FONTS[0].n, pos:POS[0].n, size:"", note:"" });

/* inline style for the yarn text */
export function yarnStyle(c){
  const f = FONTS.find(x => x.n === c.font) || FONTS[0];
  const p = POS.find(x => x.n === c.pos) || POS[0];
  const len = Math.max(1, (c.text || "").length);
  const fs = Math.min(.17, 1.9 / (len + 3)) * f.k;
  return `--yarn:${c.color};--fs:${fs.toFixed(3)};top:${p.y}%;font-family:${f.f}`;
}
/* flat preview (admin orders + cart thumbnails) */
export function designHTML(img, c){
  return `<div class="dz"><img src="${esc(img || "")}" alt="">${c && c.text ? `<span class="yt" style="${yarnStyle(c)}">${esc(c.text)}</span>` : ""}</div>`;
}
export function describe(c){
  if(!c) return "";
  const colorName = (COLORS.find(x => x.c === c.color) || {}).n || "";
  const parts = [];
  if(c.text) parts.push(`Name “${c.text}” · ${colorName} yarn · ${c.font} · ${c.pos}`);
  if(c.size) parts.push(`Size: ${c.size}`);
  if(c.note) parts.push(`Note: ${c.note}`);
  return parts.join(" | ");
}
