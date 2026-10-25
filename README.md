# BusyHands – 3D Knitwear Store with Name Customizer

A pink, girly 3D online store for a hand-knitting business. Customers spin products in 3D, add their name in yarn, and send the order to the seller on **WhatsApp**. The seller uses the **Admin page** to upload products, manage categories and see the exact design each customer picked.

Plain **HTML, CSS & JavaScript** + **Firebase**. No build step, no assets folder: every product, category and setting is added through Admin.

## Files
| File | What it does |
|---|---|
| `index.html`, `style.css`, `script.js` | The store, 3D customizer, bag, WhatsApp checkout |
| `design.css`, `design.js` | Yarn colours / fonts shared by store and admin |
| `admin.html`, `admin.css`, `admin.js` | Seller dashboard (orders, products, categories, settings) |
| `register.html`, `register.js` | One-time admin registration (only the admin email is accepted) |
| `firebase.js` | Firebase settings and the admin email |
| `firestore.rules` | The one security rule file (paste into Firebase) |
| `storage.rules` | Locks Firebase Storage (not used) |

## Firebase setup (once, about 5 minutes)
Open https://console.firebase.google.com and choose project **e-commerce-239b9**.

1. **Turn on email/password login**: `Build > Authentication > Get started > Sign-in method > Email/Password > Enable > Save`
2. **Allow your website domain**: `Authentication > Settings > Authorized domains > Add domain` (e.g. `yourstore.vercel.app`; `localhost` is already there)
3. **Create the database**: `Build > Firestore Database > Create database` (production mode)
4. **Publish the rules**: `Firestore Database > Rules` → delete everything → paste `firestore.rules` → **Publish**. Nothing to edit.
5. **Register the admin (once)**: open `register.html` on your live site, enter `gamerpraisemoder@gmail.com` and a password. Any other email is refused. Open the verification link sent to your inbox, then sign in at `admin.html`.

What the rules do:
- Only **gamerpraisemoder@gmail.com**, with a verified email, can change products, categories and settings, and read orders
- Everyone can see products, categories and store settings
- Customers can only *create* an order; they can never read, change or delete anything

Optional hardening: after you have registered, switch off new sign-ups if your console offers it (`Authentication > Settings > User actions > untick "Enable create (sign-up)"`). Even without it, other accounts get no access because of the rules.

To change the admin email, edit `ADMIN_EMAIL` in `firebase.js` and the email in `firestore.rules`, then publish the rules again.

The `apiKey` in `firebase.js` is meant to be public; the rules protect your data.

## Seller guide
1. Open `admin.html` and sign in (**Forgot password?** resets it by email).
2. **Settings:** WhatsApp number with country code and no `+` or `0` at the start (`2348012345678`), shop name, currency.
3. **Categories:** add the categories you sell (name and a short description). They appear on the shop and in the product form; reorder or delete anytime.
4. **Products:** choose a photo, add name, category, price, save. Photos are cropped square and compressed to about 80 KB before being stored in Firestore, so Firebase Storage is not needed. Untick "Customers can add a name" for items that can't be personalised.
5. **Orders:** when a customer checks out, their design appears with the name, yarn colour, style, position, size and notes. Knit it, then mark it done. The WhatsApp message carries the same order code (like `BH-AB12CD`).

## Hosting
The site uses ES modules + Firebase, so it must be served online (not opened as a file). GitHub Pages, Netlify or Vercel all work. Add the live domain in Firebase (setup step 2).

---
Made by Gpraise · [Want a store like this? Contact Gpraise on WhatsApp](https://wa.me/2348057940822?text=Hello%20Gpraise%2C%20I%20want%20a%20store%20like%20BusyHands)
