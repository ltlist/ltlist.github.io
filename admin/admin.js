const PASS = "ltlist123";

let data = JSON.parse(localStorage.getItem("ltlist_admin") || "[]");
let editIndex = -1;

// ================= LOGIN =================
function login(){
  const p = document.getElementById("pass").value;

  if(p === PASS){
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
    render();
  }else{
    document.getElementById("msg").innerText = "Password salah";
  }
}

// ================= SAVE =================
function save(){

  const item = {
    id: Date.now().toString(),
    nama: nama.value,
    koin: koin.value,
    link: link.value,
    cooldown: Number(cooldown.value)
  };

  if(!item.nama || !item.link || !item.cooldown){
    alert("Lengkapi data");
    return;
  }

  if(editIndex === -1){
    data.push(item);
  }else{
    data[editIndex] = item;
  }

  localStorage.setItem("ltlist_admin", JSON.stringify(data));

  resetForm();
  render();
}

// ================= RESET =================
function resetForm(){
  nama.value = "";
  link.value = "";
  cooldown.value = "";
  editIndex = -1;
}

// ================= EDIT =================
function edit(i){
  editIndex = i;

  nama.value = data[i].nama;
  koin.value = data[i].koin;
  link.value = data[i].link;
  cooldown.value = data[i].cooldown;
}

// ================= DELETE =================
function del(i){
  data.splice(i,1);
  localStorage.setItem("ltlist_admin", JSON.stringify(data));
  render();
}

// ================= EXPORT JSON (SAAS CORE) =================
function exportJSON(){

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    {type:"application/json"}
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "faucet.json";
  a.click();
}

// ================= RENDER =================
function render(){

  const tbody = document.getElementById("list");
  const key = document.getElementById("search").value.toLowerCase();

  tbody.innerHTML = "";

  data
  .filter(x => x.nama.toLowerCase().includes(key))
  .forEach((x,i)=>{

    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${x.nama}</td>
        <td>${x.koin}</td>
        <td>${x.cooldown}</td>
        <td>
          <button onclick="edit(${i})">Edit</button>
          <button onclick="del(${i})">Del</button>
        </td>
      </tr>
    `;
  });
}