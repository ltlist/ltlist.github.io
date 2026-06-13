import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAVokWJ_Wj3iATEhj6UPetF-KXKDV75S8", // Ganti punyamu
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listDiv = document.getElementById("list");
const trendingDiv = document.getElementById("trending");
const coinStatsDiv = document.getElementById("coinStats");
const coinFilter = document.getElementById("coinFilter");
const totalEl = document.getElementById("totalFaucets");

const API_URL = "https://api.ltlist.workers.dev"; // GANTI URL WORKER KAMU

let allFaucets = [];

async function loadFaucets() {
  // KUNCI: Cuma where doang, gak pake orderBy. Biar gak perlu index
  const q = query(
    collection(db, "faucets"),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  allFaucets = snap.docs.map(d => ({ id: d.id,...d.data() }));

  // KUNCI: Urut manual di browser by clicks paling banyak
  allFaucets.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  render(allFaucets);
  renderTrending();
  renderCoinStats();
  renderTotal();
  loadCoinFilter();
}

// Klik Claim -> Nembak ke Worker biar anti spam 60mnt
window.visitFaucet = async function (id, url) {
 