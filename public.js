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
  apiKey: "AIzaSyAVokJ_Wl3aITEhj6UPetF-MGQDV75S8",
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
   SCORE
===================== */
function calcScore(f) {
  return (f.likes || 0) * 3 - (f.dislikes || 0) * 4 + (f.clicks || 0);
}

/* =====================
   REALTIME LISTENER
===================== */
function startRealtime() {

  onSnapshot(collection(db, "faucets"), (snap) => {

    const temp = [];

    snap.forEach((d) => {
      const data = d.data();

      if (data.status === "active") {
        temp.push({ id: d.id, ...data });
      }
    });

    allFaucets = temp;

    render();
    renderTrending();
    renderTotal();
  });
}

/* =====================
   RENDER MAIN
===================== */
function render() {

  const sorted = [...allFaucets].sort((a, b) => calcScore(b) - calcScore(a));

  listDiv.innerHTML = sorted.map((d, i) => `
    <div class="card">

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
   TRENDING
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
   TOTAL
===================== */
function renderTotal() {
  if (totalEl) {
    totalEl.innerText = `📊 ${allFaucets.length} Faucets`;
  }
}

/* =====================
   ANTI SPAM VOTE SIMPLE
===================== */
function canVote(id) {
  const key = "vote_" + id;
  const last = localStorage.getItem(key);

  if (last && Date.now() - last < 5000) return false;

  localStorage.setItem(key, Date.now());
  return true;
}

/* =====================
   CLICK
===================== */
window.visitFaucet = async function (id, url) {

  await updateDoc(doc(db, "faucets", id), {
    clicks: increment(1)
  });

  window.open(url, "_blank");
};

/* =====================
   LIKE
===================== */
window.likeFaucet = async function (id) {

  if (!canVote(id)) return;

  await updateDoc(doc(db, "faucets", id), {
    likes: increment(1)
  });
};

/* =====================
   DISLIKE
===================== */
window.dislikeFaucet = async function (id) {

  if (!canVote(id)) return;

  await updateDoc(doc(db, "faucets", id), {
    dislikes: increment(1)
  });
};

/* =====================
   START
===================== */
startRealtime();