import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* =====================
   FIREBASE CONFIG
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3aITEhj6UPetF-KXKDV75S8",
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
   ANTI CLICK SPAM (LOCAL)
===================== */
function canClick(id) {
  const last = localStorage.getItem("click_" + id);
  if (!last) return true;

  return Date.now() - Number(last) > 5000;
}

function setClick(id) {
  localStorage.setItem("click_" + id, Date.now());
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.status === "active") {
      allFaucets.push({
        id: docSnap.id,
        ...data
      });
    }
  });

  allFaucets.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));

  render(allFaucets);
  renderTrending();
}

/* =====================
   CLICK (ONLY UPDATE IF FIELD EXISTS)
===================== */
window.visitFaucet = async function (id, url) {

  if (!canClick(id)) return;

  setClick(id);

  const ref = doc(db, "faucets", id);

  try {
    const faucet = allFaucets.find(f => f.id === id);

    let updateData = {
      clicks: increment(1),
      lastClickAt: Date.now(),
      deviceId: getDeviceId()
    };

    // ✔ ONLY UPDATE uptime IF EXISTS
    if (faucet && typeof faucet.uptime !== "undefined") {
      updateData.uptime = increment(1);
    }

    await updateDoc(ref, updateData);

  } catch (e) {
    console.log(e);
  }

  window.open(url, "_blank");
};

/* =====================
   RENDER MAIN
===================== */
function render(data) {

  listDiv.innerHTML = data.map(d => `
    <div class="card">

      <div class="rank-badge">#${d.rank || "-"}</div>

      <div class="name">${d.name}</div>

      <div class="coin">${d.coin}</div>

      <div class="clicks">👁 ${d.clicks || 0}</div>

      ${typeof d.uptime !== "undefined"
        ? `<div class="clicks">⏱ ${d.uptime}</div>`
        : ""}

      <a class="visit-btn"
         href="#"
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

      <div class="rank-badge">🔥 ${i + 1}</div>

      <div class="name">${d.name}</div>

      <div class="coin">${d.coin}</div>

      <div class="clicks">👁 ${d.clicks || 0}</div>

      ${typeof d.uptime !== "undefined"
        ? `<div class="clicks">⏱ ${d.uptime}</div>`
        : ""}

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>

    </div>
  `).join("");
}

/* =====================
   SEARCH
===================== */
window.searchPublic = function () {
  const q = document.getElementById("search")?.value.toLowerCase() || "";

  render(allFaucets.filter(f =>
    (f.name || "").toLowerCase().includes(q) ||
    (f.coin || "").toLowerCase().includes(q)
  ));
};

/* =====================
   FILTER
===================== */
window.filterCoin = function () {
  const c = document.getElementById("coinFilter")?.value;
  if (!c || c === "all") return render(allFaucets);
  render(allFaucets.filter(f => f.coin === c));
};

/* =====================
   INIT
===================== */
loadFaucets();