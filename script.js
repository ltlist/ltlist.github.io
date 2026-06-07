const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

let cache = {};

const DATA_URL =
"https://raw.githubusercontent.com/ltlist/ltlist.github.io/main/faucet.json";

// ================= LOCAL ANALYTICS =================
function getStats(id){
  return JSON.parse(localStorage.getItem("stats_" + id) || "{}");
}

function saveStats(id, stats){
  localStorage.setItem("stats_" + id, JSON.stringify(stats));
}

// ================= CLICK TRACKING =================
function trackClick(id){
  let s = getStats(id);

  s.clicks = (s.clicks || 0) + 1;

  saveStats(id, s);
}

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

// ================= LIGHT CHECK =================
async function checkLight(url, id){

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
    status = "DEAD";
  }

  const result = {
    status,
    t: Date.now()
  };

  cache[id] = result;

  return result;
}

// ================= STABILITY SCORE =================
function calcScore(id, status){

  let s = getStats(id);

  if(!s.clicks) s.clicks = 0;
  if(!s.fail) s.fail = 0;
  if(!s.success) s.success = 0;

  if(status === "DEAD"){
    s.fail++;
  }else{
    s.success++;
  }

  const total = s.success + s.fail;

  let score = total === 0 ? 50 : Math.round((s.success / total) * 100);

  s.score = score;

  saveStats(id, s);

  return score;
}

// ================= LOAD =================
async function loadData(){
  const res = await fetch(DATA_URL);
  data = await res.json();

  document.getElementById("kotakPesan").innerText =
  "SAAS ANALYTICS SYSTEM ACTIVE ✔";

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

  let no = 1;

  for(let item of list){

    const left = remainingSeconds(item);
    const ready = left === 0;

    const s = await checkLight(item.link, item.id);

    const score = calcScore(item.id, s.status);

    let color = "#ffaa00";

    if(score >= 80) color = "#00ff99";
    else if(score >= 50) color = "#ffcc00";
    else color = "#ff4444";

    tbody.innerHTML += `
      <tr>
        <td>${no++}</td>
        <td onclick="trackClick('${item.id}')">${item.nama}</td>
        <td>${item.koin}</td>
        <td>
          ${
            ready
            ? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">Claim</a>`
            : `<button class="btn disabled">⏳ ${formatTime(left)}</button>`
          }
        </td>
        <td style="color:${color};font-weight:bold">
          ${score}% STABLE
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