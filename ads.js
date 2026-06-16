document.addEventListener("DOMContentLoaded", () => {

  let zerAdsLoaded = false;

  const isMobile = window.innerWidth <= 600;

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

    let iframe = "";

    if (isMobile) {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11338"
          width="300"
          height="250"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;max-width:100%;">
        </iframe>
      `;

    } else {

      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          width="468"
          height="60"
          scrolling="no"
          frameborder="0"
          style="border:0;overflow:hidden;max-width:100%;">
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
      getComputedStyle(bait).display === "none";

    if (!zerAdsLoaded || blockedByBait) {

      const overlay = document.createElement("div");

      overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
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
            Brave Shields, or similar tools.
          </p>

          <button
            onclick="location.reload()"
            style="
              padding:10px 20px;
              border:none;
              border-radius:8px;
              cursor:pointer;
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