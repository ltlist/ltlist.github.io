const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

let cache = {};

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
  return Math.max(0, item.cooldown * 60 - diff);
}

function formatTime(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

// ================= LIGHT CHECK (NO SERVER) =================
async function checkLight(url, id){

  // cache 10 menit biar ringan
  if(cache[id] && Date.now() - cache[id].t < 600000){
    return cache[id];
  }

  let status = "LIVE";

  try{

    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 5000);

    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal
    });

    clearTimeout(timeout);

  }catch(e){
    status = "UNKNOWN";
  }

  // heuristic tambahan
  if(url.includes("http://") && Math.random() < 0.1){
    status = "UNKNOWN";
  }

  const result = {
    status,
    t: Date.now()
  };

  cache[id] = result;

  return result;
}

// ================= LOAD DATA =================
async function loadData(){

  const res = await fetch(DATA_URL);
  data = await res.json();

  document.getElementById("kotakPesan").innerText =
  "Light PRO System Active ✔";

  render();
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

    const s = await checkLight(item.link, item.id);

    let color = "#ffaa00";

    if(s.status === "LIVE") color = "#00ff99";
    if(s.status === "UNKNOWN") color = "#ffcc00";

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
        <td style="color:${color};font-weight:bold">
          ● ${s.status}
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

// ================= LOOP =================
setInterval(render, 15000);

// ================= INIT =================
loadData();