const API = "https://calm-art-584f.cnamelist.workers.dev";
const animalIcons = { cat:"🐱", dog:"🐶", rabbit:"🐰", cow:"🐮", lion:"🦁" };
let sessionId = "";
let selectedAnimal = "";

async function getChallenge(){
  try{
    const res = await fetch(API + "/api/challenge");
    const data = await res.json();
    sessionId = data.sessionId;
    selectedAnimal = "";
    document.getElementById("questionMath").innerHTML = "Soal: <b>" + data.question + "</b> | " + animalIcons[data.animal];
    
    const box = document.getElementById("animalBox");
    box.innerHTML = "";
    data.animals.forEach(a => {
      const div = document.createElement("div");
      div.className = "animal";
      div.setAttribute("data-emoji", animalIcons[a]);
      div.innerHTML = a;
      div.onclick = () => {
        document.querySelectorAll(".animal").forEach(b => b.classList.remove("active"));
        div.classList.add("active");
        selectedAnimal = a;
      };
      box.appendChild(div);
    });
  }catch(e){ document.getElementById("result").innerHTML = "❌ Gagal load challenge"; }
}

async function claim(){
  const username = document.getElementById("username").value.trim(); // <--- GANTI
  const token = window.turnstile? turnstile.getResponse() : null;
  const mathAnswer = document.getElementById("mathAnswer").value;

  if(!username || username.length < 3){ document.getElementById("result").innerHTML = "❌ Username min 3 huruf"; return; }
  if(!token ||!mathAnswer ||!selectedAnimal){ document.getElementById("result").innerHTML = "❌ Lengkapi semua data"; return; }

  document.getElementById("claimBtn").disabled = true;
  document.getElementById("result").innerHTML = "⏳ Processing...";

  try{
    const res = await fetch(API + "/api/claim", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        email: username, // <--- WORKER MAU NYA EMAIL
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

getChallenge();
loadHistory();