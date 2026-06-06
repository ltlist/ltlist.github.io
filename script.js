const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const DATA_URL =
"https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// ================= TIMER =================
function getLast(id){
  return localStorage.getItem("claim_" + id);
}

function setLast(id){
  localStorage.setItem("claim_" + id, Date.now());
}

function remainingSeconds(item){
  const last = getLast(item.id);
  if(!last) return 0;

  const diff = Math.floor((Date.now() - last) / 1000);
  const cooldown = item.cooldown * 60;

  return Math.max(0, cooldown - diff);
}

function formatTime(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ================= SIMPLE STATUS (NO PING = NO FLICKER) =================
// Kita pakai heuristik ringan saja (berdasarkan cooldown + cache)
let statusCache = {};

function getStatus(item){

  // cache 10 menit
  if(statusCache[item.id] && Date.now() - statusCache[item.id].t < 600000){
    return statusCache[item.id].status;
  }

  // logika sederhana:
  // kalau cooldown kecil = kemungkinan LIVE
  // cooldown besar = UNKNOWN (biar tidak false DEAD)

  let status = "LIVE";

  if(item.cooldown >= 30){
    status = "UNKNOWN";
  }

  statusCache[item.id] = {
    status,
    t: Date.now()
  };

  return status;
}

// ================= LOAD DATA =================
async function loadData(){
  const res = await fetch(DATA_URL);
  data = await res.json();

  document.getElementById("kotakPesan").innerText =
  "System Stable Mode Active ✔";

  render();
}

// ================= RENDER ONCE =================
function render(){

  let list = [...data];

  const keyword = search.value.toLowerCase();
  if(keyword){
    list = list.filter(x =>
      x.nama.toLowerCase().includes(keyword)
    );
  }

  if(filterKoin.value !== "all"){
    list = list.filter(x => x.koin === filterKoin.value);
  }

  list.sort((a,b)=>
    sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
  );

  tbody.innerHTML = "";

  list.forEach((item,i)=>{

    const left = remainingSeconds(item);
    const ready = left === 0;

    const status = getStatus(item);

    let statusHTML = "";

    if(status === "LIVE"){
      statusHTML = `<span style="color:#00ff99;font-weight:bold">● LIVE</span>`;
    }else{
      statusHTML = `<span style="color:#ffaa00;font-weight:bold">● UNKNOWN</span>`;
    }

    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${item.nama}</td>
        <td>${item.koin}</td>
        <td>
          ${
            ready
            ? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">Claim</a>`
            : `<button class="btn disabled">⏳ ${formatTime(left)}</button>`
          }
        </td>
        <td>${statusHTML}</td>
      </tr>
    `;
  });
}

// ================= EVENTS =================
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  render();
});

// ================= LOOP (ONLY TIMER UPDATE) =================
setInterval(render, 1000);

// ================= INIT =================
loadData();