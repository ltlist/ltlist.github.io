const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-Aa_jwdcx4h86y_uW8Al0OKQZg6p3j5dVJHlEyr_mM2ykqXbGN09TgiDaMNXDruk5cPCQrLQWEW8-/pub?output=csv";

const tbody = document.getElementById("isiTabel");
const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

/* =========================
   NORMALIZER (ANTI ERROR)
========================= */
function normalize(obj){
  let fixed = {};

  for(let key in obj){
    let k = key.toLowerCase().trim();

    if(k === "id") fixed.id = obj[key];
    if(k === "name") fixed.name = obj[key];
    if(k === "coin") fixed.coin = obj[key];
    if(k === "link") fixed.link = obj[key];
    if(k === "cooldown") fixed.cooldown = obj[key];
  }

  return fixed;
}

/* =========================
   CSV PARSER
========================= */
function csvToJSON(csv){
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : "";
    });

    return normalize(obj);
  });
}

/* =========================
   TIMER SYSTEM
========================= */
function getLast(id){
  return localStorage.getItem("claim_" + id);
}

function setLast(id){
  localStorage.setItem("claim_" + id, Date.now());
}

function remaining(item){
  const last = getLast(item.id);
  if(!last) return 0;

  const diff = Math.floor((Date.now() - last) / 1000);
  const cooldown = (Number(item.cooldown) || 0) * 60;

  return Math.max(0, cooldown - diff);
}

function format(sec){
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

/* =========================
   LOAD DATA
========================= */
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    const csv = await res.text();

    data = csvToJSON(csv);

    document.getElementById("kotakPesan").innerText =
    "Data loaded ✔ Google Sheets Connected";

    render();

  }catch(e){
    document.getElementById("kotakPesan").innerText =
    "Failed load data ❌";
  }
}

/* =========================
   RENDER TABLE
========================= */
function render(){

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

  list.forEach((item,i)=>{

    const left = remaining(item);
    const ready = left === 0;

    tbody.innerHTML += `
    <tr>
      <td>${i+1}</td>
      <td>${item.name || "-"}</td>
      <td>${item.coin || "-"}</td>
      <td>
        ${
          ready
          ? `<a class="btn" href="${item.link}" target="_blank" onclick="setLast('${item.id}')">🟢 Claim</a>`
          : `<button class="btn" disabled>⏳ ${format(left)}</button>`
        }
      </td>
    </tr>`;
  });
}

/* =========================
   EVENTS
========================= */
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  render();
});

/* =========================
   AUTO REFRESH TIMER
========================= */
setInterval(render, 1000);

/* =========================
   INIT
========================= */
loadData();