# 🧶 BusyHands – 3D Knitwear Store with Name Customizer

A pink, girly **3D online store** for a hand-knitting business. Customers spin products in 3D, **add their name in yarn**, and send the order to the seller on **WhatsApp**. The seller opens the **Admin page** to upload products and see the exact design each customer picked.

Plain **HTML, CSS & JavaScript** + **Firebase**. No build step.

Made by **Gpraise ❤️‍🔥**

---

## ✨ Features
- 3D spinning product ring, tilt cards, drag-to-spin gift box
- **3D Customizer:** customers drag the product around, type a name, pick yarn colour, lettering style, position, size and a design note
- **Checkout on WhatsApp** with every detail in the message
- The design is also **saved to Admin** (Orders tab) so the seller can open it and knit exactly that
- **Admin page** (🔐 button on the site, email + password login): add / edit / delete products, **your own categories**, price, WhatsApp number, orders
- **Auto image compressor:** photos are cropped square and shrunk to about 80 KB before saving, so storage lasts long
- No sample products or fixed categories: everything you see is added by the seller in Admin

## 📁 Files
| File | What it does |
|---|---|
| `index.html` | The store |
| `style.css`, `design.css` | Looks, 3D effects |
| `script.js` | Store logic, 3D customizer, bag, WhatsApp checkout |
| `admin.html`, `admin.css`, `admin.js` | Seller dashboard |
| `design.js` | Yarn colours / fonts shared by store and admin |
| `firebase.js` | Firebase settings |
| `firestore.rules` | **Security rules (paste into Firebase)** |
| `storage.rules` | Locks Firebase Storage (not used) |

---

## 🔥 Firebase Setup (do this once, ~5 minutes)

Open https://console.firebase.google.com and choose project **e-commerce-239b9**.

**1. Turn on email/password login**
`Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save`

**2. Create the admin account and allow your domain**
- `Authentication > Users > Add user` → type the shop owner's email and a strong password → Add. Copy the **User UID** shown in that row.
- `Authentication > Settings > Authorized domains > Add domain` → add your live domain, e.g. `yourname.github.io` or `yourstore.vercel.app`. (`localhost` is already there.)

**3. Create the database**
`Build > Firestore Database > Create database` (choose any location, start in production mode).

**4. Paste the security rules**
Open `firestore.rules`, replace `PASTE_ADMIN_UID_HERE` with the User UID you copied. Then `Firestore Database > Rules` → delete everything → paste the file → **Publish**.

What the rules do:
- Only the **admin account (your UID)** can add/edit/delete products, categories, settings, and read orders
- Everyone can see products, categories and the store settings
- Customers can only *create* an order. They can never read, change or delete anything
- Other people creating accounts with the public key gets them nothing: the rules only trust your UID

> The `apiKey` in `firebase.js` is **meant to be public**. Firebase protects your data with the rules above, not by hiding the key.

**Why no Firebase Storage?** Photos are compressed in the browser and stored inside Firestore (about 80 KB each), so you don't need Storage or a paid plan.

To change the admin, put the new account's UID in `firestore.rules` and publish again.

---

## 👩‍🎨 Seller Guide (Admin)

1. On the website tap **🔐 Admin** (top of the page or the footer)
2. **Sign in** with the admin email and password (use **Forgot password?** to reset it by email)
3. **Settings tab:** type the **WhatsApp number** with country code and no `+` or `0` at the start (`2348012345678`), shop name and currency → Save
4. **Categories tab:** add the categories you sell (icon, name, short text). They appear on the shop and in the product form. You can reorder or delete them anytime.
5. **Products tab:** choose a photo, add name, pick a category, price → Save. The photo compresses automatically.
   Untick "Customers can add a name" for items that can't be personalised
6. **Orders tab:** when a customer taps checkout, their design appears with a picture showing the name on the product, yarn colour, style, position, size and notes. Knit it, then tap **✔ Mark done**.
   The WhatsApp message includes the same order code (like `BH-AB12CD`).

**Photo tips:** clear, bright photo, the garment centered on a plain background. It is cropped to a square.

### How the "3D" works for uploaded photos
Your photo becomes a **3D knit swatch card** that customers can drag and turn. It has thickness and a back side, and the customer's name floats above the product like real stitching. It's a photo-based 3D look. A full 3D model of every garment would need 3D scanning.

---

## 📲 How To Edit The Code On Your Phone

1. On GitHub click the green `Code` button > `Download ZIP` and unzip it
2. Open the code editor: **https://gpcode-eta.vercel.app/**
3. Open the `landing_page` folder, edit `index.html`, `style.css` or `script.js`

Termux (optional):
```bash
pkg update && pkg upgrade -y
pkg install git -y
git clone https://github.com/Gamerpraise/landing_page.git
cd landing_page
git add . && git commit -m "updated" && git push
```

**Change colours:** top of `style.css` (`--pink`, `--bg`, `--ink`)
**Change texts:** `index.html`
**Yarn colours and fonts:** top of `design.js`

---

## 🚀 Host For FREE
Because the site uses ES modules + Firebase it must be **online** (not opened as a file).
1. **GitHub Pages:** `Settings > Pages > Branch main > Save`
2. **Netlify:** drag and drop the folder
3. **Vercel:** import the repo and Deploy

Then do step 2 of Firebase Setup with your new domain.

---

## 💼 This Store Is For Sale!
Want a store like this (with admin, 3D customizer and WhatsApp orders) for your business?
Contact **Gpraise** 👇

<a href="https://wa.me/2348057940822?text=Hello%20Gpraise%2C%20I%20want%20a%20store%20like%20BusyHands">
  <img src="https://img.shields.io/badge/Chat%20Gpraise%20on%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Gpraise" />
</a>

---
© 2026 BusyHands · Made by Gpraise ❤️‍🔥
