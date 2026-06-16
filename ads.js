document.addEventListener("DOMContentLoaded", () => {

  let zerAdsLoaded = false;

  // =========================
  // BAIT ELEMENT
  // =========================
  const bait = document.createElement("div");

  bait.className = "ads adsbox ad-banner ad-container sponsored";

  bait.style.cssText = `
    position:absolute;
    left:-9999px;
    width:1px;
    height:1px;
  `;

  document.body.appendChild(bait);

  // =========================
  // INSERT ADS
  // =========================
  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.dataset.network;

    let iframe = "";

    // Desktop
    if (network === "zerads-468") {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          width="468"
          height="60"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;">
        </iframe>
      `;

    }

    // Mobile
    else if (network === "zerads-300") {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11338"
          width="300"
          height="250"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;">
        </iframe>
      `;

    }

    el.innerHTML = iframe;

    const frame = el.querySelector(".ad-frame");

    if (frame) {

      frame.onload = () => {
        zerAdsLoaded = true;
      };

    }

  });

  // =========================
  // CHECK ADBLOCK
  // =========================
  setTimeout(() => {

    const blockedByBait =
      bait.offsetHeight === 0 ||
      bait.offsetWidth === 0 ||
      getComputedStyle(bait).display === "none" ||
      getComputedStyle(bait).visibility === "hidden";

    if (!zerAdsLoaded || blockedByBait) {

      const overlay = document.createElement("div");

      overlay.id = "adblock-overlay";

      overlay.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.9);
        z-index:999999;
        display:flex;
        justify-content:center;
        align-items:center;
      `;

      overlay.innerHTML = `
        <div style="
          background:#111827;
          color:#fff;
          padding:25px;
          border-radius:12px;
          text-align:center;
          max-width:380px;
          width:90%;
        ">
          <h2>⚠ AdBlock Detected</h2>

          <p>
            Please disable AdBlock, AdGuard,
            Brave Shields or similar extensions
            to continue using this faucet.
          </p>

          <button
            onclick="location.reload()"
            style="
              padding:10px 20px;
              border:none;
              border-radius:8px;
              cursor:pointer;
              margin-top:10px;
            ">
            Reload Page
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

      document.body.style.overflow = "hidden";
    }

  }, 5000);

});