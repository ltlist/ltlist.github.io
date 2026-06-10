import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokWj_Wj3aITEhj6UPetF-MGQXKdv75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");

let allFaucets = [];

/* =====================
   DEVICE ID
===================== */
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

/* =====================
   LOAD FAUCETS
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    allFaucets.push({
      id: d.id,
      ...d.data()
    });
  });

  calculateScore();
  sortByScore();

  render(allFaucets);
  renderTrending();
}

/* =====================
   SCORE SYSTEM
===================== */
function calculateScore() {

  allFaucets = allFaucets.map(f => {

    const likes = f.likes || 0;
    const dislikes = f.dislikes || 0;
    const clicks = f.clicks || 0;

    const score = (likes * 2) - (dislikes * 2) + clicks;

    return { ...f, score };
  });
}

function sortByScore() {
  allFaucets.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/* =====================
   CLICK TRACKING
===================== */
window.visitFaucet = async function (id, url) {

  await updateDoc(doc(db, "faucets", id), {
    clicks: increment(1)
  });

  loadFaucets();
  window.open(url, "_blank");
};

/* =====================
   VOTE SYSTEM (LIKE / DISLIKE)
===================== */
function getVoteKey(id) {
  return "vote_" + id;
}

function getVote(id) {
  return localStorage.getItem(getVoteKey(id));
}

function setVote(id, type) {
  localStorage.setItem(getVoteKey(id), type);
}

/* LIKE */
window.likeFaucet = async function (id) {

  const current = getVote(id);
  const ref = doc(db, "faucets", id);

  if (current === "like") return alert("Sudah like!");

  if (current === "dislike") {
    await updateDoc(ref, {
      dislikes: increment(-1),
      likes: increment(1)
    });
  } else {
    await updateDoc(ref, {
      likes: increment(1)
    });
  }

  setVote(id, "like");

  await loadFaucets();
};

/* DISLIKE */
window.dislikeFaucet = async function (id) {

  const current = getVote(id);
  const ref = doc(db, "faucets", id);

  if (current === "dislike") return alert("Sudah dislike!");

  if (current === "like") {
    await updateDoc(ref, {
      likes: increment(-1),
      dislikes: increment(1)
    });
  } else {
    await updateDoc(ref, {
      dislikes: increment(1)
    });
  }

  setVote(id, "dislike");

  await loadFaucets();
};

/* =====================
   RENDER MAIN LIST
===================== */
function render(data) {

  let html = "";

  data.forEach((d) => {

    html += `
      <div class="card">

        <div class="rank-badge">
          #${d.rank || "-"}
        </div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">
          👁 ${d.clicks || 0}
        </div>

        <div class="clicks">
          ⭐ ${d.score || 0}
        </div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

        <button onclick="likeFaucet('${d.id}')">👍</button>
        <button onclick="dislikeFaucet('${d.id}')">👎</button>

      </div>
    `;
  });

  listDiv.innerHTML = html;
}

/* =====================
   TRENDING (BY SCORE)
===================== */
function renderTrending() {

  const top = [...allFaucets]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

  let html = "";

  top.forEach((d, i) => {

    html += `
      <div class="card">

        <div class="rank-badge">🔥 ${i + 1}</div>

        <div class="name">${d.name}</div>

        <div class="coin">${d.coin}</div>

        <div class="clicks">⭐ ${d.score || 0}</div>

        <a href="#"
           class="visit-btn"
           onclick="visitFaucet('${d.id}','${d.url}')">
          Claim
        </a>

      </div>
    `;
  });

  document.getElementById("trending").innerHTML = html;
}

/* =====================
   INIT
===================== */
loadFaucets();