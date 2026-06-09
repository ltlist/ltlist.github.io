import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_l3aITEhj6UPetF-MGQXKDV75S8",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");

async function loadFaucets() {
  const snap = await getDocs(collection(db, "faucets"));

  let html = "";

  snap.forEach((doc) => {
    const d = doc.data();

    html += `
      <div class="card">
        <b>${d.name}</b><br>
        Coin: ${d.coin}<br><br>
        <a href="${d.url}" target="_blank">Visit</a>
      </div>
    `;
  });

  listDiv.innerHTML = html;
}

loadFaucets();