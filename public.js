import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  increment,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE
===================== */
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =====================
   DOM
===================== */
const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const totalEl = document.getElementById("totalFaucets");

let allFaucets = [];

/* =====================
   DEVICE ID (ANTI MULTI ACCOUNT BASIC)
===================== */
function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

/* =====================
   PRO ANTI SPAM ENGINE
===================== */
const clickCache = {};
let globalClickCount = 0;
let resetTime = Date.now();

/* reset global tiap 1 menit */
setInterval(() => {
  globalClickCount = 0;
  resetTime = Date.now();
}, 60000);

/* =====================
   CHECK CLICK VALID
===================== */
function canClick(id) {

  const now = Date.now();

  // per faucet cooldown
  if (clickCache[id] && now - clickCache[id] < 15000) {
    return false;
  }

  // global limit per minute
  if (globalClickCount >= 20) {
    return false;
  }

  clickCache[id] = now;
  globalClickCount++;

  return true;
}

/* =====================
   REALTIME FIRESTORE
===================== */
function startRealtime() {
  onSnapshot(collection(db, "faucets"), (snap) => {

    allFaucets = [];

    snap.forEach((d) => {
      const data = d.data();
      if (data.status === "active") {
        allFaucets.push({ id: d.id, ...data });
      }
    });

    render();
    renderTrending();
    renderTotal();
  });
}

/* =====================
   SCORE
===================== */
function calcScore(f) {
  return (f.likes || 0) * 3 - (f.dislikes || 0) * 4 + (f.clicks || 0);
}

/* =====================
   VISIT (ANTI SPAM PRO)
===================== */
window.visitFaucet = async function (id, url) {

  if (!canClick(id)) {
    alert("Terlalu cepat klik, tunggu sebentar!");
    return;
  }

  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1),
      lastClick: serverTimestamp(),
      device: getDeviceId()
    });
  } catch (e) {}

  window.open(url, "_blank");
};

/* =====================
   LIKE (SAFE)
===================== */
window.likeFaucet = async function (id) {
  try {
    await updateDoc(doc(db, "faucets", id), {
      likes: increment(1)
    });
  } catch (e) {}
};

/* =====================
   DISLIKE (SAFE)
===================== */
window.dislikeFaucet = async function (id) {
  try {
    await updateDoc(doc(db, "faucets", id), {
      dislikes: increment(1)
    });
  } catch (e) {}
};

/* =====================
   RENDER LIST
===================== */
function render() {

  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  listDiv.innerHTML = allFaucets.map((d, i) => `
    <div class="card">

      <div class="rank">#${i + 1}</div>

      <div class="name">${d.name}</div>

      <div class="coin">${d.coin}</div>

      <div class="score">⭐ ${calcScore(d)}</div>

      <div class="vote">
        👍 ${d.likes || 0} 👎 ${d.dislikes || 0}
      </div>

      <a class="visit-btn"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>

    </div>
  `).join("");
}

/* =====================
   TRENDING
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);

  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div>🔥 ${i + 1}</div>
      <div>${d.name}</div>
      <div>${d.coin}</div>
      <div>⭐ ${calcScore(d)}</div>
    </div>
  `).join("");
}

/* =====================
   TOTAL
===================== */
function renderTotal() {
  if (totalEl) {
    totalEl.innerText = `📊 ${allFaucets.length} Faucets`;
  }
}

/* =====================
   START
===================== */
startRealtime();