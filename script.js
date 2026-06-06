const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

const DATA_URL =
"https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// cache status
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

// ================= SMART CHECKER =================
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

    const time = Date.now() - start;

    return {
      ok: true,
      time
    };

  }catch(e){
    return {
      ok: false,
      time: null
    };
  }
}

// retry system biar lebih akurat
async function checkFaucetSmart(url, id){

  if(statusCache[id] && Date.now() - statusCache[id].time < 300000){
    return statusCache[id];
  }

  let result1 = await ping(url);
  if(result1.ok){

    // cek 2x untuk validasi
    let result2 = await ping(url);

    let avgTime = result2.time ? (result1.time + result2.time) / 2 : result1.time;

    let status = "LIVE";

    if(avgTime > 4000){
      status = "SLOW";
    }

    const final = {
      status,
      time: avgTime
    };

    statusCache[id] = {
      ...final,
      cacheTime: Date.now()
    };

    return final;
  }

  // retry sekali lagi sebelum DEAD
  let retry = await ping(url);

  if(retry.ok){
    const final = {
      status: "SLOW",
      time: retry.time
    };

    statusCache[id] = {
      ...final,
      cacheTime: Date.now()
    };

    return final;
  }

  const final = {
    status: "DEAD",
    time: null
  };

  statusCache[id] = {
    ...final,
    cacheTime: Date.now()
  };

  return final;
}

// ================= LOAD DATA =================
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    data = await res.json();

    document.getElementById("kotakPesan").innerText =
    "Data loaded ✔ Smart Checker Active";

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

    const statusData = await checkFaucetSmart(item.link, item.id);

    let statusHTML = "";

    if(statusData.status === "LIVE"){
      statusHTML = `<span style="color:#00ff99;font-weight:bold">● LIVE</span>`;
    }
    else if(statusData.status === "SLOW"){
      statusHTML = `<span style="color:#ffaa00;font-weight:bold">● SLOW</span>`;
    }
    else{
      statusHTML = `<span style="color:#ff4444;font-weight:bold">● DEAD</span>`;
    }

    let speed = statusData.time ? `${statusData.time} ms` : "-";

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
        <td>
          ${statusHTML}<br>
          <small style="color:#888">${speed}</small>
        </td>
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
}, 300000);

// ================= INIT =================
loadData();
setInterval(render, 1000);