document.addEventListener("DOMContentLoaded", () => {

  let zerAdsLoaded = false;

  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.dataset.network;

    let iframe = "";

    // =========================
    // ZerAds 468x60
    // =========================
    if (network === "zerads-468") {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          width="468"
          height="60"
          scrolling="no"
          frameborder="0">
        </iframe>
      `;

    }

    // =========================
    // ZerAds 300x250
    // =========================
    else if (network === "zerads-300") {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11338"
          width="300"
          height="250"
          scrolling="no"
          frameborder="0">
        </iframe>
      `;

    }

    el.innerHTML = iframe;

    const frame = el.querySelector(".ad-frame");

    if(frame){

      frame.onload = () => {
        zerAdsLoaded = true;
      };

    }

  });

  // Cek setelah 5 detik
  setTimeout(() => {

    if(!zerAdsLoaded){

      const overlay = document.createElement("div");

      overlay.id = "adblock-overlay";

      overlay.innerHTML = `
        <div class="adb-box">
          <h2>⚠ AdBlock Detected</h2>
          <p>
            Please disable AdBlock or Brave Shields
            to continue using this faucet.
          </p>

          <button onclick="location.reload()">
            Reload Page
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

    }

  }, 5000);

});