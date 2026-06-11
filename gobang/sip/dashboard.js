window.scanDeadFaucets = async function () {

  let deadCount = 0;

  showToast("Scanning faucet...", "warning");

  for (let f of allFaucets) {

    if (f.status !== "active") continue;

    let isAlive = true;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      // PRO CHECK (lebih ketat)
      const res = await fetch(f.url, {
        method: "GET",
        mode: "no-cors",
        signal: controller.signal
      });

      clearTimeout(timeout);

      // no-cors tidak bisa baca status,
      // jadi kita pakai fallback check
      if (!res) isAlive = false;

    } catch (e) {
      isAlive = false;
    }

    if (!isAlive) {

      await updateDoc(doc(db, "faucets", f.id), {
        status: "inactive",
        rank: 9999,
        uptime: 0
      });

      deadCount++;

      showToast("Dead detected: " + f.name, "error");
    }
  }

  await autoReRank();
  await loadFaucets();

  showToast(`Scan selesai. Dead: ${deadCount}`);
};