// Kunci rahasia
const KUNCI = "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p";

window.onload = function() {
  muatData();
};

async function muatData() {
  const pesan = document.getElementById("pesan");
  const tabel = document.getElementById("isiTabel");

  try {
    pesan.textContent = "🔄 Memuat data...";

    // Ambil file terenkripsi
    const res = await fetch("data-terkunci.json");
    if (!res.ok) throw new Error("File data tidak ditemukan");

    const terenkripsi = await res.json();

    // Dekripsi data
    const dekripsi = await dekripsiAES(terenkripsi, KUNCI);
    const data = JSON.parse(dekripsi);

    // Tampilkan data
    pesan.className = "kotak pesan-berhasil";
    pesan.textContent = `✅ Berhasil memuat ${data.faucet_list.length} faucet!`;

    tabel.innerHTML = "";
    data.faucet_list.forEach((item, i) => {
      const baris = document.createElement("tr");
      baris.innerHTML = `
        <td>${i+1}</td>
        <td><strong>${item.nama}</strong></td>
        <td><span class="lencana-koin">${item.koin}</span></td>
        <td><span class="bintang">${item.tingkat_kepercayaan}</span></td>
        <td>${item.estimasi_hadiah}<span class="waktu">⏱️ ${item.jadwal_klaim}</span></td>
        <td><a href="${item.tautan_rujukan}" target="_blank" class="tombol-klaim">Klaim</a></td>
      `;
      tabel.appendChild(baris);
    });

  } catch (err) {
    pesan.className = "kotak pesan-gagal";
    pesan.textContent = `❌ Gagal: ${err.message}`;
    tabel.innerHTML = `<tr><td colspan="6" class="teks-tengah">Data tidak dapat ditampilkan</td></tr>`;
  }
}

// Fungsi dekripsi yang pasti cocok
async function dekripsiAES(data, sandi) {
  const iv = base64KeBin(data.iv);
  const ct = base64KeBin(data.ct);
  const salt = base64KeBin(data.salt || "");

  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(sandi), {name: "PBKDF2"}, false, ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {name: "PBKDF2", salt: salt, iterations: 1000, hash: "SHA-256"},
    keyMaterial, {name: "AES-GCM", length: 256}, false, ["decrypt"]
  );

  const hasil = await crypto.subtle.decrypt({name: "AES-GCM", iv: iv}, key, ct);
  return new TextDecoder().decode(hasil);
}

function base64KeBin(str) {
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}
