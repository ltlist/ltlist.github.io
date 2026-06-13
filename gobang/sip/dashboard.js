import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3iATEhj6UPetF-Fix",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const UID_ADMIN = "gZPXqeKPBAZfCzYXEcrGWMcSFHI2";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const listDiv = document.getElementById("list");
const toastDiv = document.getElementById("toast");
const modalDiv = document.getElementById("editModal");

let allFaucets = [];

/* =========================
   🔥 FIX LOGIN TIDAK LOGOUT
========================= */
await setPersistence(auth, browserLocalPersistence);

/* =========================
   TOAST
========================= */
const showToast = (msg) => {
  toastDiv.textContent = msg;
  toastDiv.classList.add("show");
  setTimeout(() => toastDiv.classList.remove("show"), 2000);
};

/* =========================
   ADMIN CHECK (SAFE)
========================= */
function isAdmin(user) {
  return user && user.uid === UID_ADMIN;
}

/* =========================
   LOAD DATA
========================= */
async function loadFaucets() {
  const q = query(collection(db, "faucets"), orderBy("rank", "asc"));
  const snap = await getDocs(q);

  allFaucets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render(allFaucets);
}

/* =========================
   RENDER
========================= */
function render(data) {
  if (!listDiv) return;

  listDiv.innerHTML = data.map(d => `
    <div class="card">
      <div class="card-left">
        <span class="rank-badge">#${d.rank ?? '-'}</span>
        <span class="status-badge ${d.status}">${d.status}</span>
      </div>

      <div class="card-mid">
        <div class="card-title">${d.name}</div>
        <div class="card-sub">${d.coin}</div>
        <div class="card-stats">${d.clicks || 0} claims</div>
      </div>

      <a href="${d.url}" target="_blank" class="claim-btn">Open</a>
    </div>
  `).join("");
}

/* =========================
   AUTH STABLE FIX (ANTI LOOP)
========================= */
let authReady = false;

onAuthStateChanged(auth, async (user) => {
  authReady = true;

  // ❗ tunggu Firebase siap dulu
  if (!authReady) return;

  if (!isAdmin(user)) {
    await signOut(auth);
    window.location.replace("login.html");
    return;
  }

  await loadFaucets();
});