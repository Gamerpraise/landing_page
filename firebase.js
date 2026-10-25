/* Firebase loader. Loads from Google's CDN only when needed.
   If Firebase can't load (offline / not set up yet), the shop simply shows no products. */
const V = "10.12.2", B = `https://www.gstatic.com/firebasejs/${V}/`;
export const firebaseConfig = {
  apiKey: "AIzaSyBcvt5pN7GPsxyV97k7Ed5ojKXHFhRrfZk",
  authDomain: "e-commerce-239b9.firebaseapp.com",
  projectId: "e-commerce-239b9",
  storageBucket: "e-commerce-239b9.firebasestorage.app",
  messagingSenderId: "1045719865464",
  appId: "1:1045719865464:web:72514219651e245806758d",
  measurementId: "G-KP9WB4Z5XY"
};

let dbP, authP;
export function fbDB(){
  return dbP ??= (async () => { try {
    const [{ initializeApp, getApps }, fs] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-firestore.js")]);
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    return { db: fs.getFirestore(app), fs, app };
  } catch (e) { console.warn("Firebase unavailable:", e); return null; } })();
}
export function fbAuth(){
  return authP ??= (async () => { try {
    const k = await fbDB(); if(!k) return null;
    const au = await import(B + "firebase-auth.js");
    return { ...k, auth: au.getAuth(k.app), au };
  } catch (e) { console.warn("Firebase auth unavailable:", e); return null; } })();
}
