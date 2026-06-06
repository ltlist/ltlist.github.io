const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const DATA_URL =
"https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// cache status biar tidak spam request
let statusCache = {};

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

// ================= FAUCET CHECKER =================
async function checkFaucet(url, id){

  const cache = statusCache[id];
  if(cache && Date.now() - cache.time < 300000){
    return cache.status;
  }

  try{
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 5000);

    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal
    });

    clearTimeout(timeout);

    statusCache[id] = {status:"LIVE", time:Date.now()};
    return "LIVE";

  }catch(e){
    statusCache[id] = {status:"DEAD", time:Date.now()};
    return "DEAD";
  }
}

// ================= LOAD DATA =================
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    data = await res.json();

    document.getElementById("kotakPesan").innerText =
    "Data loaded ✔";

    render();

  }catch(e){
    document.getElementById("kotakPesan").innerText =
    "Failed load data ❌";
  }
}

// ================= RENDER =================
async function render(){

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

  for(let i=0;i<list.length;i++){

    const item = list[i];

    const left = remainingSeconds(item);
    const ready = left === 0;

    const status = await checkFaucet(item.link, item.id);

    let statusHTML = "";

    if(status === "LIVE"){
      statusHTML = `<span class="status-live">● LIVE</span>`;
    }else{
      statusHTML = `<span class="status-dead">● DEAD</span>`;
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
  }
}

// ================= EVENTS =================
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  render();
});

// ================= AUTO REFRESH =================
setInterval(()=>{
  statusCache = {};
  render();
}, 300000); // 5 menit

// ================= INIT =================
loadData();
setInterval(render, 1000);