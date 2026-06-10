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
   FIREBASE
===================== */
const firebaseConfig = {
  apiKey: "AIzaSyAVokJ_Wl3aITEhj6UPetF-MGQXKDV75S8",
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
   HELPERS
===================== */
function getLocal(id) {
  return allFaucets.find(f => f.id === id) || {};
}

function updateLocal(id, data) {
  const i = allFaucets.findIndex(f => f.id === id);
  if (i !== -1) {
    allFaucets[i] = { ...allFaucets[i], ...data };
  }
}

/* =====================
   SCORE
===================== */
function calcScore(f) {
  return (f.likes || 0) * 3 - (f.dislikes || 0) * 2;
}

/* =====================
   LOAD DATA
===================== */
async function loadFaucets() {

  const snap = await getDocs(collection(db, "faucets"));

  allFaucets = [];

  snap.forEach((d) => {
    const data = d.data();
    if (data.status === "active") {
      allFaucets.push({ id: d.id, ...data });
    }
  });

  allFaucets.sort((a, b) => calcScore(b) - calcScore(a));

  render(allFaucets);
}

/* =====================
   RENDER CARD HTML
===================== */
function cardHTML(d) {
  return `
    <div class="top-row">
      <div class="rank">#${d.rank || "-"}</div>
      <div class="coin">${d.coin || "-"}</div>
      <div class="score">⭐ ${calcScore(d)}</div>
    </div>

    <div class="name">${d.name}</div>

    <div class="bottom-row">
      <div class="vote">
        👍 ${d.likes || 0} 👎 ${d.dislikes || 0}
      </div>

      <a class="visit-btn"
         href="#"
         onclick="visitFaucet('${d.id}','${d.url}')">
        Claim
      </a>
    </div>
  `;
}

/* =====================
   MAIN RENDER
===================== */
function render(data) {

  listDiv.innerHTML = data.map(d => `
    <div class="card" id="card-${d.id}">
      ${cardHTML(d)}
    </div>
  `).join("");
}

/* =====================
   VISIT
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
   LIKE (REALTIME)
===================== */
window.likeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);

  const ref = doc(db, "faucets", id);

  let updateData = {};

  if (current === "like") return;

  if (current === "dislike") {
    updateData = {
      likes: increment(1),
      dislikes: increment(-1)
    };
  } else {
    updateData = {
      likes: increment(1)
    };
  }

  try {
    await updateDoc(ref, updateData);

    const local = getLocal(id);

    if (current === "dislike") {
      updateLocal(id, {
        likes: (local.likes || 0) + 1,
        dislikes: (local.dislikes || 0) - 1
      });
    } else {
      updateLocal(id, {
        likes: (local.likes || 0) + 1
      });
    }

    localStorage.setItem(key, "like");

    rerenderCard(id);

  } catch (e) {
    console.log(e);
  }
};

/* =====================
   DISLIKE (REALTIME)
===================== */
window.dislikeFaucet = async function (id) {

  const key = "vote_" + id;
  const current = localStorage.getItem(key);

  const ref = doc(db, "faucets", id);

  let updateData = {};

  if (current === "dislike") return;

  if (current === "like") {
    updateData = {
      likes: increment(-1),
      dislikes: increment(1)
    };
  } else {
    updateData = {
      dislikes: increment(1)
    };
  }

  try {
    await updateDoc(ref, updateData);

    const local = getLocal(id);

    if (current === "like") {
      updateLocal(id, {
        likes: (local.likes || 0) - 1,
        dislikes: (local.dislikes || 0) + 1
      });
    } else {
      updateLocal(id, {
        dislikes: (local.dislikes || 0) + 1
      });
    }

    localStorage.setItem(key, "dislike");

    rerenderCard(id);

  } catch (e) {
    console.log(e);
  }
};

/* =====================
   RERENDER 1 CARD ONLY
===================== */
function rerenderCard(id) {

  const d = getLocal(id);
  const el = document.getElementById("card-" + id);

  if (!el) return;

  el.innerHTML = cardHTML(d);
}

/* =====================
   INIT
===================== */
loadFaucets();