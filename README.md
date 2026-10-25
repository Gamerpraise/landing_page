# 🛍️ Velora Market – 3D Shopping Landing Page

A beautiful **3D online store template** built with plain **HTML, CSS & JavaScript**. No framework, no install, no Three.js. Made for business owners who want to show and sell products like **hair, clothes, shoes, bags, beauty and accessories**.

Created by **Gpraise**

---

## ✨ What You Get
- 3D spinning product ring (drag it with your finger or mouse)
- 3D tilt cards for categories and products
- Drag-to-spin 3D gift box deal section
- Shopping bag (cart) with **WhatsApp checkout**
- Category filters, reviews, seller section, mobile-friendly layout

## 📁 Files
| File | What it does |
|---|---|
| `index.html` | Page structure and text |
| `style.css` | Colors, 3D effects, layout |
| `script.js` | **Store settings, products**, cart and 3D animations |
| `assets/` | Product images and logo (SVG) |

---

## 📲 How To Edit On Your Phone (EASY METHOD)

You don't need a laptop.

**Step 1: Download this template**
1. On this GitHub page click the green `Code` button > `Download ZIP`
2. Open your file manager and unzip it.

**Step 2: Open the GP Code editor**
Use the free online code editor here: **https://gpcode-eta.vercel.app/**

**Step 3: Import your project**
1. Open https://gpcode-eta.vercel.app/ in your phone browser
2. Open / import the unzipped `landing_page` folder (or its files)
3. Edit `index.html`, `style.css` and `script.js`, then preview your changes

---

## 💻 METHOD 2: Termux (For Tech Guys)

1. Install Termux from F-Droid (not Play Store)
2. Run these one by one:

```bash
pkg update && pkg upgrade -y
pkg install git -y
git clone https://github.com/Gamerpraise/landing_page.git
cd landing_page
ls
```

3. Open the files in the GP Code editor: https://gpcode-eta.vercel.app/
4. To push changes back to GitHub (optional):

```bash
git add .
git commit -m "updated store"
git push
```

---

## 🛒 How To Make It YOUR Store

### 1. Your WhatsApp number, name & currency
Open `script.js`. At the very top you will see:

```js
const STORE = {
  name: "Velora Market",
  whatsapp: "2348057940822",   // country code, no + or spaces
  currency: "$"                // or "₦"
};
```
Change them. Every order from the cart goes to **your** WhatsApp.

### 2. Add, edit or remove products
Still in `script.js`, find `const PRODUCTS = [ ... ]`. One line = one product:

```js
{ id:9, name:"Curly Wig", cat:"Hair", price:120, old:150, img:"assets/wig.jpg", tag:"New" },
```
- `id` must be a unique number
- `cat` must match a category: Hair, Clothes, Shoes, Bags, Beauty, Accessories
- `old` is the crossed-out price (use `0` for none)
- `tag` is the small label on the card

### 3. Use your own product photos
1. Put your photos inside the `assets/` folder (`.jpg`, `.png`, `.webp` or `.svg`)
2. Set the `img:` path of that product, e.g. `img:"assets/wig.jpg"`
3. Use **square photos** (800×800px) for best results
4. Replace `assets/logo.svg` and `assets/favicon.svg` with your own logo (keep the same names)

### 4. Change categories
In `script.js` edit `const CATEGORIES = [ ... ]` (name, emoji icon, short text).

### 5. Change text
Edit words directly in `index.html` (hero headline, reviews, the "Glow-Up Box" deal, footer).

### 6. Change colors
Open `style.css`. At the top, change the `:root` colors:

```css
--bg:#fff8f3;   /* page background */
--pink:#ff5d8f; /* main brand color */
--ink:#2a1633;  /* dark text */
```
Want blue? Change `--pink` and `--pink-dark` to blue shades. Done.

### 7. Make the 3D ring bigger or smaller
In `style.css` change `--ring-r:270px;` (bigger number = wider ring).

---

## 🎨 Change Design Without Coding (AI helper)
Use https://zzzcode.ai/code-generator
1. Type `CSS` (or `JavaScript`) in the first box
2. Paste your whole `style.css` (or `script.js`)
3. Type what you want, e.g. *"change the main color to blue"*
4. Copy the result and paste it back in your file

---

## 🚀 Host For FREE
1. **GitHub Pages:** repo `Settings` > `Pages` > Branch `main` / `(root)` > Save
2. **Netlify:** https://www.netlify.com – drag and drop the project folder
3. **Vercel:** https://vercel.com – Add New Project > import your repo > Deploy

📱 Then share your live link on WhatsApp status, Instagram, TikTok and Facebook.

---

## 🔮 Coming Soon
- Seller / admin dashboard to upload products
- Firebase login, database and image uploads
- Buyer accounts and order tracking

---

## 📞 Need Help?
Message **Gpraise** on WhatsApp:

<a href="https://wa.me/2348057940822?text=Hello%20Gpraise%2C%20please%20I%20need%20help%20with%20the%20Velora%20store%20template">
  <img src="https://img.shields.io/badge/Chat%20on%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Chat on WhatsApp" />
</a>

---
© 2026 Gpraise – Velora Market Template. All Rights Reserved.
