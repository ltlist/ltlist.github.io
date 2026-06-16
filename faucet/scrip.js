const API = "https://calm-art-584f.cnamelist.workers.dev";
const animalIcons = { cat:"🐱", dog:"🐶", rabbit:"🐰", cow:"🐮", lion:"🦁" };
let sessionId = "";
let selectedAnimal = "";

/* =========================
   GET CHALLENGE
========================= */
async function getChallenge(){
  try{
    const res = await fetch(API + "/api/challenge");
    const data = await res.json();
    sessionId = data.sessionId;
    selectedAnimal = "";
    document.getElementById("questionIcon").innerHTML = animalIcons[data.animal] || "❓";
    document.getElementById("questionMath").innerHTML = "Soal: <b>" + data.question + "</b>";
    const box = document.getElementById("animalBox");
    box.innerHTML = "";
    data.animals.forEach(a => {
      const div = document.createElement("div");
      div.className = "animal";
      div.innerHTML = animalIcons[a] + "<br>" + a;
      div.onclick = () => {
        document.querySelectorAll(".animal").forEach(b => b.classList.remove("active"));
        div.classList.add("active");
        selectedAnimal = a;
      };
      box.appendChild(div);
    });
  }catch(e){ document.getElementById("result").innerHTML = "❌ Gagal load challenge"; }
}

/* =========================
   CLAIM
========================= */
async function claim(){
  const email = document.getElementById("email").value.trim(); // 3. GANTI VARIABEL
  const token = window.turnstile? turnstile.getResponse() : null;
  const mathAnswer = document.getElementById("mathAnswer").value;

  // Validasi Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!email){ document.getElementById("result").innerHTML = "❌ Email FaucetPay jangan kosong"; return; }
  if(!emailRegex.test(email)){ document.getElementById("result").innerHTML = "❌ Format email salah"; return; }
  if(!token ||!mathAnswer ||!selectedAnimal){ document.getElementById("result").innerHTML = "❌ Lengkapi semua data"; return; }

  document.getElementById("claimBtn").disabled = true;
  document.getElementById("result").innerHTML = "⏳ Processing...";

  try{
    const res = await fetch(API + "/api/claim", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        email, // <- KIRIMNYA EMAIL
        token,
        sessionId,
        mathAnswer,
        animalAnswer: selectedAnimal
      })
    });
    const data = await res.json();
    document.getElementById("result").innerHTML = data.success? "✅ " + data.message + " | Sisa: " + data.remaining : "❌ " + data.error;
    if(window.turnstile) window.turnstile.reset();
    getChallenge();
  }catch(e){ document.getElementById("result").innerHTML = "❌ Server error"; }
  finally {
    document.getElementById("claimBtn").disabled = false;
    loadHistory();
  }
}

/* =========================
   HISTORY
========================= */
async function loadHistory(){
  try{
    const res = await fetch(API + "/api/history");
    const data = await res.json();
    document.getElementById("history").innerHTML = data.length? data.map(h => `${h.user} | ${h.amount} | ${new Date(h.time).toLocaleTimeString()}`).join("<br>") : "Belum ada claim";
  }catch(e){ document.getElementById("history").innerHTML = "Gagal load history"; }
}

getChallenge();
loadHistory();