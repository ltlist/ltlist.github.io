import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  increment,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokJ_Wl3aITEhj6UPetF-MGQXDV75S8",
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
   SCORE SYSTEM (REALTIME RANK)
===================== */
function calcScore(f) {
  return (f.likes || 0) * 3 - (f.dislikes || 0) * 4;
}

/* =====================
   REALTIME LISTENER (AUTO UPDATE)
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

    render();          // FULL AUTO UPDATE
    renderTrending();
    renderTotal();
  });
}

/* =====================
   RENDER MAIN (AUTO SORT LIVE)
===================== */
function render() {

  // AUTO SORT (REAL TIME RANKING)
  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  listDiv.innerHTML = allFaucets.map((d, i) => `
    <div class="card" data-id="${d.id}">

      <div class="rank-badge">#${i + 1}</div>

      <div class="name">${d.name}</div>

      <div class="coin">${d.coin}</div>

      <div class="score">⭐ ${calcScore(d)}</div>

      <div class="vote">
        👍 ${d.likes || 0} 👎 ${d.dislikes || 0}
      </div>

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>

      <button onclick="likeFaucet('${d.id}')">👍</button>
      <button onclick="dislikeFaucet('${d.id}')">👎</button>

    </div>
  `).join("");
}

/* =====================
   TRENDING TOP 5
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
    .slice(0, 5);

  trendingDiv.innerHTML = top.map((d, i) => `
    <div class="card">
      <div class="rank-badge">🔥 ${i + 1}</div>
      <div class="name">${d.name}</div>
      <div class="coin">${d.coin}</div>
      <div class="score">⭐ ${calcScore(d)}</div>
    </div>
  `).join("");
}

/* =====================
   TOTAL FAUCETS
===================== */
function renderTotal() {
  if (totalEl) {
    totalEl.innerText = `📊 ${allFaucets.length} Faucets`;
  }
}

/* =====================
   VISIT CLICK
===================== */
window.visitFaucet = async function (id, url) {
  try {
    await updateDoc(doc(db, "faucets", id), {
      clicks: increment(1)
    });
  } catch (e) {}

  window.open(url, "_blank");
};

/* =====================
   LIKE (LIVE UPDATE)
===================== */
window.likeFaucet = async function (id) {

  const ref = doc(db, "faucets", id);

  try {
    await updateDoc(ref, {
      likes: increment(1)
    });
  } catch (e) {}
};

/* =====================
   DISLIKE (LIVE UPDATE)
===================== */
window.dislikeFaucet = async function (id) {

  const ref = doc(db, "faucets", id);

  try {
    await updateDoc(ref, {
      dislikes: increment(1)
    });
  } catch (e) {}
};

/* =====================
   START APP
===================== */
startRealtime();