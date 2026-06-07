const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;
let cache = {};

/* ================= GOOGLE SHEETS CSV ================= */
const DATA_URL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-Aa_jwdcx4h86y_uW8Al0OKQZg6p3j5dVJHlEyr_mM2ykqXbGN09TgiDaMNXDruk5cPCQrLQWEW8-/pub?output=csv";

/* ================= CSV PARSER ================= */
function csvToJSON(csv){
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h.trim().toLowerCase()] = values[i] ? values[i].trim() : "";
    });

    return obj;
  });
}

/* ================= ANALYTICS ================= */
function getStats(id){
  return JSON.parse(localStorage.getItem("stats_" + id) || "{}");
}

function saveStats(id, stats){
  localStorage.setItem("stats_" + id, JSON.stringify(stats));
}

function trackClick(id){
  let s = getStats(id);
  s.clicks = (s.clicks || 0) + 1;
  saveStats(id, s);
}

/* ================= COOLDOWN ================= */
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
  const cooldown = (Number(item.cooldown) || 0) * 60;

  return Math.max(0, cooldown - diff);
}

function formatTime(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

/* ================= LIGHT STATUS CHECK (SAFE) ================= */
async function checkLight(url, id){

  if(cache[id] && Date.now() - cache[id].t < 300000){
    return cache[id];
  }

  let status = "LIVE";

  try{
    const res = await fetch(url, { method: "HEAD", mode: "no-cors" });
    // no-cors = kita anggap LIVE kalau tidak error jaringan
  }catch(e){
    status = "DEAD";
  }

  const result = { status, t: Date.now() };
  cache[id] = result;

  return result;
}

/* ================= SCORE ================= */
function calcScore(id, status){

  let s = getStats(id);

  if(!s.clicks) s.clicks = 0;
  if(!s.fail) s.fail = 0;
  if(!s.success) s.success = 0;

  if(status === "DEAD") s.fail++;
  else s.success++;

  const total = s.fail + s.success;

  let score = total === 0 ? 75 : Math.round((s.success / total) * 100);

  s.score = score;
  saveStats(id, s);

  return score;
}

/* ================= LOAD DATA ================= */
async function loadData(){
  const res = await fetch(DATA_URL);
  const csv = await res.text();

  data = csvToJSON(csv);

  document.getElementById("kotakPesan").innerText =
  "GOOGLE SHEETS SAAS ACTIVE ✔";

  render();
}

/* ================= RENDER ================= */
async function render(){

  let list = [...data];

  const keyword = search.value.toLowerCase();

  if(keyword){
    list = list.filter(x =>
      (x.name || "").toLowerCase().includes(keyword)
    );
  }

  if(filterKoin.value !== "all"){
    list = list.filter(x => x.coin === filterKoin.value);
  }

  list.sort((a,b)=>
    sortAsc
    ? (a.name||"").localeCompare(b.name||"")
    : (b.name||"").localeCompare(a.name||"")
  );

  tbody.innerHTML = "";

  let no = 1;

  for(let item of list){

    const left = remainingSeconds(item);
    const ready = left === 0;

    const statusObj = cache[item.id] || {status:"LIVE"};
    const score = calcScore(item.id, statusObj.status);

    let color = "#ffcc00";
    if(score >= 80) color = "#00ff99";
    else if(score >= 50) color = "#ffcc00";
    else color = "#ff4444";

    tbody.innerHTML += `
      <tr>
        <td>${no++}</td>

        <td onclick="trackClick('${item.id}')">
          ${item.name || "-"}
        </td>

        <td>${item.coin || "-"}</td>

        <td>
          ${
            ready
            ? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">🟢 Claim</a>`
            : `<button class="btn disabled">⏳ ${formatTime(left)}</button>`
          }
        </td>

        <td style="color:${color};font-weight:bold">
          ${score}% ${statusObj.status}
        </td>
      </tr>
    `;
  }
}

/* ================= EVENTS ================= */
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  render();
});

/* ================= LOOP ================= */
setInterval(render, 10000);

/* ================= INIT ================= */
loadData();