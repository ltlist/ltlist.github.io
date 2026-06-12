/* =========================================
   FIREBASE IMPORTS
========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


/* =========================================
   FIREBASE CONFIG
========================================= */
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ltlist-f.firebaseapp.com",
  projectId: "ltlist-f",
  storageBucket: "ltlist-f.firebasestorage.app",
  messagingSenderId: "991011425656",
  appId: "1:991011425656:web:d8f4da4e5c4b4ab9aacc8d"
};


/* =========================================
   FIREBASE INIT
========================================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


/* =========================================
   DOM ELEMENTS
========================================= */
const listDiv = document.getElementById("list");
const toastDiv = document.getElementById("toast");
const modalDiv = document.getElementById("editModal");


/* =========================================
   GLOBAL VARIABLES
========================================= */
let allFaucets = [];


/* =========================================
   UTILITIES
========================================= */
const showToast = (msg) => {
  ...
};

function requireAuth() {
  ...
}


/* =========================================
   LOAD DATA
========================================= */
async function loadFaucets() {
  ...
}


/* =========================================
   RENDER
========================================= */
function render(data) {
  ...
}


/* =========================================
   CLICK TRACKING
========================================= */
window.addClick = async function(id) {
  ...
};


/* =========================================
   ADD FAUCET
========================================= */
window.addFaucet = async function() {
  ...
};


/* =========================================
   DELETE FAUCET
========================================= */
window.deleteFaucet = async function(id) {
  ...
};


/* =========================================
   STATUS MANAGEMENT
========================================= */
window.toggleStatus = async function(id, status) {
  ...
};


/* =========================================
   EDIT MODAL
========================================= */
window.openEdit = function(data) {
  ...
};

window.closeModal = function() {
  ...
};

window.saveEdit = async function() {
  ...
};


/* =========================================
   RANK MANAGEMENT
========================================= */
window.rerank = async function(auto = false) {
  ...
};


/* =========================================
   SEARCH
========================================= */
window.searchFaucet = function() {
  ...
};


/* =========================================
   LOGOUT
========================================= */
window.logout = () =>
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });


/* =========================================
   UI EVENTS
========================================= */
modalDiv.onclick = (e) => {
  if (e.target === modalDiv) closeModal();
};

window.addEventListener("scroll", () => {
  document
    .querySelector(".navbar")
    .classList.toggle("scrolled", window.scrollY > 10);
});


/* =========================================
   AUTH GUARD
========================================= */
onAuthStateChanged(auth, async (user) => {

  console.log("AUTH:", user);

  if (user) {
    console.log("UID:", user.uid);
    await loadFaucets();
  } else {
    console.log("BELUM LOGIN");
    window.location.href = "login.html";
  }

});