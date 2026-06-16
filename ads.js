document.addEventListener("DOMContentLoaded", () => {

  let zerAdsLoaded = false;

  document.querySelectorAll(".ad-slot").forEach(el => {

    const network = el.dataset.network;
    let iframe = "";

    if (network === "zerads-468") {
      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=468&ref=11338"
          width="468"
          height="60"
          frameborder="0"
          scrolling="no">
        </iframe>
      `;
    }

    else if (network === "zerads-300") {
      iframe = `
        <iframe
          class="ad-frame"
          src="https://zerads.com/ad/ad.php?width=300&ref=11338"
          width="300"
          height="250"
          frameborder="0"
          scrolling="no">
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

  setTimeout(() => {

    if (!zerAdsLoaded) {

      const overlay = document.createElement("div");

      overlay.style.cssText = `
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,.85);
        z-index:999999;
        display:flex;
        justify-content:center;
        align-items:center;
      `;

      overlay.innerHTML = `
        <div style="
          background:#111827;
          color:#fff;
          padding:20px;
          border-radius:12px;
          text-align:center;
          max-width:350px;
        ">
          <h2>AdBlock Detected</h2>
          <p>Please disable AdBlock and reload page.</p>
          <button onclick="location.reload()">
            Reload
          </button>
        </div>
      `;

      document.body.appendChild(overlay);

    }

  }, 5000);

});