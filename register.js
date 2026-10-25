import { fbAuth, ADMIN_EMAIL } from "./firebase.js";

const $ = s => document.querySelector(s);
const msgs = {
  "auth/email-already-in-use": "This email is already registered. Sign in instead, or use “Forgot password?” on the sign-in page.",
  "auth/weak-password": "Choose a stronger password (at least 8 characters).",
  "auth/invalid-email": "That email doesn't look right.",
  "auth/network-request-failed": "No internet connection.",
  "auth/operation-not-allowed": "Email/Password sign-in is not turned on in Firebase yet.",
  "auth/unauthorized-domain": "Add this website's domain in Firebase → Authentication → Settings → Authorized domains."
};

$("#regForm").onsubmit = async e => {
  e.preventDefault();
  const email = $("#rEmail").value.trim().toLowerCase(), pass = $("#rPass").value, err = $("#regErr"), ok = $("#regOk");
  err.textContent = ok.textContent = "";

  /* Anyone except the shop owner is turned away before an account is created. */
  if(email !== ADMIN_EMAIL) return (err.textContent = "Registration is closed. Only the shop owner can register.");
  if(pass.length < 8) return (err.textContent = "Password must be at least 8 characters.");
  if(pass !== $("#rPass2").value) return (err.textContent = "The two passwords don't match.");

  const btn = $("#regBtn"); btn.disabled = true; btn.textContent = "Creating account…";
  try {
    const K = await fbAuth(); if(!K) throw { code: "auth/network-request-failed" };
    const { auth, au } = K;
    const cred = await au.createUserWithEmailAndPassword(auth, email, pass);
    await au.sendEmailVerification(cred.user);
    await au.signOut(auth);
    $("#regForm").classList.add("hidden");
    ok.textContent = `Account created. We sent a verification link to ${email}. Open it (check spam too), then sign in.`;
  } catch(ex){ err.textContent = msgs[ex.code] || ("Couldn't register: " + (ex.code || ex.message)); }
  btn.disabled = false; btn.textContent = "Register";
};
