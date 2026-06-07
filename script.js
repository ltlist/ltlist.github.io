const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ-Aa_jwdcx4h86y_uW8Al0OKQZg6p3j5dVJHlEyr_mM2ykqXbGN09TgiDaMNXDruk5cPCQrLQWEW8-/pub?output=csv";

const tbody = document.getElementById("isiTabel");
const search = document.getElementById("search");
const filterKoin = document.getElementById("filterKoin");
const sortBtn = document.getElementById("sortBtn");

let data = [];
let sortAsc = true;

// CSV PARSER
function csvToJSON(csv){
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map(line => {
    const values = line.split(",");
    let obj = {};

    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : "";
    });

    return obj;
  });
}

// LOAD DATA
async function loadData(){
  try{
    const res = await fetch(DATA_URL);
    const csv = await res.text();

    data = csvToJSON(csv);

    document.getElementById("kotakPesan").innerText =
    "Data loaded ✔ Google Sheets";

    render();

  }catch(e){
    document.getElementById("kotakPesan").innerText =
    "Failed load data ❌";
  }
}

// TIMER SIMPLE (COOLDOWN LOCAL)
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
    sortAsc ? a.nama.localeCompare(b.nama)
            : b.nama.localeCompare(a.nama)
  );

  tbody.innerHTML = "";

  list.forEach((item,i)=>{

    tbody.innerHTML += `
    <tr>
      <td>${i+1}</td>
      <td>${item.nama}</td>
      <td>${item.koin}</td>
      <td><a class="btn" href="${item.link}" target="_blank">Claim</a></td>
    </tr>`;
  });
}

// EVENTS
search.addEventListener("input", render);
filterKoin.addEventListener("change", render);

sortBtn.addEventListener("click", ()=>{
  sortAsc = !sortAsc;
  render();
});

// INIT
loadData();