const KUNCI_RAHASIA = "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p";

window.onload = () => {
  document.getElementById("tahun").textContent = new Date().getFullYear();
  bukaDanTampilkanData();
};

async function bukaDanTampilkanData() {
  const kotakInfo = document.getElementById("kotakInfo");
  const isiTabel = document.getElementById("isiTabel");

  try {
    kotakInfo.className = "kotak pesan-info";
    kotakInfo.textContent = "🔄 Memuat data terenkripsi...";

    const respon = await fetch("data-terkunci.json");
    if (!respon.ok) throw new Error("File data tidak ditemukan");

    const terenkripsi = await respon.json();
    kotakInfo.textContent = "🔐 Membuka kunci data...";

    const dekripsi = await dekripsiData(terenkripsi, KUNCI_RAHASIA);
    const data = JSON.parse(dekripsi);

    document.getElementById("judulUtama").textContent = data.info.title;
    document.title = data.info.title;
    document.getElementById("deskripsiSitus").textContent = data.info.description;

    isiTabel.innerHTML = "";
    kotakInfo.className = "kotak pesan-berhasil";
    kotakInfo.textContent = `✅ Berhasil memuat ${data.faucets.length} faucet terpercaya!`;

    data.faucets.forEach((item, idx) => {
      const baris = document.createElement("tr");
      baris.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${item.nama}</strong></td>
        <td><span class="lencana-koin">${item.koin}</span></td>
        <td><span class="bintang">${item.tingkat_kepercayaan}</span></td>
        <td class="info-hadiah">
          ${item.estimasi_hadiah}
          <span class="waktu">⏱️ ${item.jadwal_klaim}</span>
        </td>
        <td><a href="${item.tautan_rujukan}" target="_blank" rel="noopener noreferrer nofollow" class="tombol-klaim">Klaim Sekarang</a></td>
      `;
      isiTabel.appendChild(baris);
    });

  } catch (err) {
    kotakInfo.className = "kotak pesan-gagal";
    kotakInfo.textContent = `❌ Gagal: ${err.message}`;
    isiTabel.innerHTML = `<tr><td colspan="6" class="teks-tengah">Data tidak dapat ditampilkan</td></tr>`;
  }
}

async function dekripsiData(obj, sandi) {
  const iv = base64KeBiner(obj.iv);
  const ct = base64KeBiner(obj.ct);
  const iter = obj.iter;
  const ks = obj.ks;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sandi),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new Uint8Array(16), iterations: iter, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: ks },
    false,
    ["decrypt"]
  );

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ct
  );

  return new TextDecoder().decode(plain);
}

function base64KeBiner(base64) {
  const biner = atob(base64);
  const byte = new Uint8Array(biner.length);
  for (let i = 0; i < biner.length; i++) {
    byte[i] = biner.charCodeAt(i);
  }
  return byte.buffer;
}
