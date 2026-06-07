const tbody = document.getElementById("isiTabel");

const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

let cache = {};
let hidden = JSON.parse(localStorage.getItem("hidden_faucet") || "[]");

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

/* ================= TIMER ================= */
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

/* ================= CHECK DEAD ================= */
async function checkLight(url, id){

  if(cache[id] && Date.now() - cache[id].t < 600000){
    return cache[id];
  }

  let status = "LIVE";

  try{
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors"
    });
  }catch(e){
    status = "DEAD";
  }

  cache[id] = {
    status,
    t: Date.now()
  };

  return cache[id];
}

/* ================= HIDE SYSTEM ================= */
function hideDead(id){
  if(!hidden.includes(id)){
    hidden.push(id);
    localStorage.setItem("hidden_faucet", JSON.stringify(hidden));
  }
}

function resetHidden(){
  localStorage.removeItem("hidden_faucet");
  hidden = [];
  render();
}

/* ================= LOAD DATA ================= */
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    const csv = await res.text();

    data = csvToJSON(csv);

    document.getElementById("kotakPesan").innerText =
    "Auto Remove DEAD System Active ✔";

    render();

  }catch(e){
    document.getElementById("kotakPesan").innerText =
    "Failed load data ❌";
  }
}

/* ================= RENDER ================= */
async function render(){

  let list = [...data];

  // remove hidden
  list = list.filter(x => !hidden.includes(x.id));

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

    const s = await checkLight(item.link, item.id);

    // AUTO REMOVE DEAD
    if(s.status === "DEAD"){
      hide