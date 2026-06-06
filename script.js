const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

let statusCache = {};
let rowMap = {};

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

// ================= PING CHECK =================
async function ping(url){
  const start = Date.now();

  try{
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 6000);

    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal
    });

    clearTimeout(timeout);

    return { ok:true, time: Date.now() - start };

  }catch(e){
    return { ok:false, time:null };
  }
}

async function checkSmart(url, id){

  if(statusCache[id] && Date.now() - statusCache[id].t < 300000){
    return statusCache[id];
  }

  let r1 = await ping(url);

  if(r1.ok){
    let r2 = await ping(url);
    let avg = r2.time ? (r1.time + r2.time)/2 : r1.time;

    let status = "LIVE";
    if(avg > 4000) status = "SLOW";

    return cache(id, status, avg);
  }

  let retry = await ping(url);
  if(retry.ok){
    return cache(id, "SLOW", retry.time);
  }

  return cache(id, "DEAD", null);
}

function cache(id, status, time){
  const obj = {status, time, t:Date.now()};
  statusCache[id] = obj;
  return obj;
}

// ================= BUILD TABLE ONCE =================
async function buildTable(){

  tbody.innerHTML = "";
  rowMap = {};

  for(let i=0;i<data.length;i++){

    const item = data[i];

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${item.nama}</td>
      <td>${item.koin}</td>
      <td class="action"></td>
      <td class="status"></td>
    `;

    tbody.appendChild(tr);

    rowMap[item.id] = {
      item,
      action: tr.querySelector(".action"),
      status: tr.querySelector(".status")
    };
  }

  updateAll();
}

// ================= UPDATE ONLY =================
async function updateAll(){

  const list = Object.values(rowMap);

  for(let i=0;i<list.length;i++){

    const {item, action, status} = list[i];

    const left = remainingSeconds(item);
    const ready = left === 0;

    const s = await checkSmart(item.link, item.id);

    action.innerHTML = ready
      ? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">Claim</a>`
      : `<button class="btn disabled">⏳ ${formatTime(left)}</button>`;

    let html = "";

    if(s.status === "LIVE"){
      html = `<span class="status-live">● LIVE</span>`;
    }else if(s.status === "SLOW"){
      html = `<span class="status-slow">● SLOW</span>`;
    }else{
      html = `<span class="status-dead">● DEAD</span>`;
    }

    status.innerHTML = html;
  }
}

// ================= LOAD DATA =================
async function loadData(){
  const res = await fetch(DATA_URL);
  data = await res.json();

  document.getElementById("kotakPesan").innerText =
  "Smart PRO System Active ✔";

  buildTable();
}

// ================= EVENTS =================
search.addEventListener("input", ()=>{
  location.reload(); // simple filter reset biar stabil
});

filterKoin.addEventListener("change", ()=>{
  location.reload();
});

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  data.sort((a,b)=>
    sortAsc ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama)
  );
  buildTable();
});

// ================= LOOP =================
setInterval(updateAll, 15000);
setInterval(()=> statusCache = {}, 300000);

// ================= INIT =================
loadData();