const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_ANON_KEY";

async function save(){

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

  const res = await fetch(`${SUPABASE_URL}/rest/v1/faucets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify(item)
  });

  if(res.ok){
    alert("Saved ✔ (Auto Sync Active)");
    render();
    resetForm();
  }else{
    alert("Error saving data");
  }
}

// ================= LOAD DATA =================
async function load(){

  const res = await fetch(`${SUPABASE_URL}/rest/v1/faucets`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  window.data = await res.json();

  render();
}

// ================= DELETE =================
async function del(id){

  await fetch(`${SUPABASE_URL}/rest/v1/faucets?id=eq.${id}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });

  load();
}