
// === ANTI-ADBLOCK DETECTOR ===
function checkAdblock(){
  // Tunggu 1.5 detik biar Turnstile sempat load
  setTimeout(() => {
    // Kalau object 'turnstile' gak ada = ke-block
    if(typeof turnstile === 'undefined'){
      document.getElementById('adblockWarn').style.display = 'flex'; // Munculin popup
    }
  }, 1500);
}

// Jalanin pas web dibuka
document.addEventListener("DOMContentLoaded", checkAdblock);



document.addEventListener("DOMContentLoaded", () => {
const API = "https://calm-art-584f.cnamelist.workers.dev";
const COOLDOWN = 60 * 60 * 1000; // 60 minutes
const animalIcons = { cat:"🐱", dog:"🐶", rabbit:"🐰", cow:"🐮", lion:"🦁" };
let sessionId = "";
let selectedAnimal = "";

const modal = document.getElementById('claimModal');
const mainBtn = document.getElementById('mainClaimBtn'); // Tombol NEXT di luar
const closeBtn = document.getElementById('closeModal');
const finalBtn = document.getElementById('finalClaimBtn'); // Tombol CLAIM di popup

// ===== 1. CEK COOLDOWN SAAT BUKA HALAMAN =====
function checkCooldown(){
  const endTime = localStorage.getItem("ltcCooldown");
  if(endTime && new Date().getTime() < endTime){
    startTimer(parseInt(endTime));
  } else {
    mainBtn.innerText = "NEXT"; 
    mainBtn.disabled = false;
  }
}

function startTimer(endTime){
  mainBtn.disabled = true;
  const timer = setInterval(() => {
    const distance = endTime - new Date().getTime();
    if (distance < 0) {
      clearInterval(timer);
      mainBtn.innerText = "NEXT"; 
      mainBtn.disabled = false;
      localStorage.removeItem("ltcCooldown");
      return;
    }
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);
    mainBtn.innerText = `Wait ${m}:${s < 10 ? '0' : ''}${s}`;
  }, 1000);
}

// ===== 2. KLIK NEXT = CEK EMAIL + BUKA POPUP =====
mainBtn.onclick = () => {
  const username = document.getElementById("username").value.trim();
  if(!username || username.length < 3){ 
    document.getElementById("result").innerHTML = "❌ FaucetPay Email"; 
    return; 
  }
  document.getElementById("result").innerHTML = ""; // Hapus error
  modal.style.display = "flex";
  getChallenge(); // Ambil soal baru tiap buka popup
}

// Close Modal
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = e => { if(e.target == modal) modal.style.display = 'none'; }

// ===== 3. LOGIC KAMU YANG LAMA, DIPINDAH KE DALAM POPUP =====
async function getChallenge(){
  try{
    document.getElementById("result").innerHTML = "";
    document.getElementById("mathAnswer").value = "";
    selectedAnimal = "";
    const res = await fetch(API + "/api/challenge");
    const data = await res.json();
    sessionId = data.sessionId;
    // ID di HTML kamu: mathQ dan emojiQ, bukan questionMath
    document.getElementById("mathQ").innerText = data.question;
    document.getElementById("emojiQ").innerText = animalIcons[data.animal];

    const box = document.getElementById("animalBox");
    box.innerHTML = "";
    data.animals.forEach(a => {
      const div = document.createElement("div");
      div.className = "animal"; // CSS kamu udah ada
      div.setAttribute("data-emoji", animalIcons[a]); // Biar icon muncul dari CSS ::before
      div.innerHTML = a;
      div.onclick = () => {
        document.querySelectorAll(".animal").forEach(b => b.classList.remove("active"));
        div.classList.add("active");
        selectedAnimal = a;
      };
      box.appendChild(div);
    });
  }catch(e){ document.getElementById("result").innerHTML = "❌ Load challenge"; }
}

async function claim(){
  const username = document.getElementById("username").value.trim();
  const token = window.turnstile? turnstile.getResponse() : null;
  const mathAnswer = document.getElementById("mathAnswer").value;

  if(!token ||!mathAnswer ||!selectedAnimal){ 
    document.getElementById("result").innerHTML = "❌ Complete all data"; 
    return; 
  }

  finalBtn.disabled = true;
  document.getElementById("result").innerHTML = "⏳ Processing...";

  try{
    const res = await fetch(API + "/api/claim", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email: username, token, sessionId, mathAnswer, animalAnswer: selectedAnimal })
    });
    const data = await res.json();
    document.getElementById("result").innerHTML = data.success? "✅ " + data.message + " | Sisa: " + data.remaining : "❌ " + data.error;
    
    if(data.success){
      modal.style.display = "none"; // Tutup popup kalau sukses
      // ===== SET COOLDOWN CUMA KALAU SUKSES =====
      const endTime = new Date().getTime() + COOLDOWN;
      localStorage.setItem("ltcCooldown", endTime);
      startTimer(endTime);
    } else {
      if(window.turnstile) window.turnstile.reset();
      getChallenge(); // Ganti soal baru kalau gagal
    }
  }catch(e){ document.getElementById("result").innerHTML = "❌ Server error"; }
  finally {
    finalBtn.disabled = false;
    loadHistory();
  }
}

finalBtn.onclick = claim; // Sambungin tombol CLAIM di popup

async function loadHistory(){
  try{
    const res = await fetch(API + "/api/history");
    const data = await res.json();
    const historyEl = document.getElementById("history");
    if(data.length){
      historyEl.innerHTML = data.map(h => `<li><span class="user">${h.user}</span><span class="detail">${h.amount} | ${new Date(h.time).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', hour12:false})}</span></li>`).join("");
    } else {
      historyEl.innerHTML = `<li style="background:transparent; justify-content:center; color:#94a3b8">Belum ada claim</li>`;
    }
  }catch(e){ document.getElementById("history").innerHTML = `<li style="background:transparent; justify-content:center; color:#f87171">Gagal load history</li>`; }
}

loadHistory();
checkCooldown(); // Jalanin pas pertama load
});