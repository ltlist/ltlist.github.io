let adBlockDetected = false;
let checkInterval;

// 1. Bait: Bikin div palsu dengan class nama ads
function createBait() {
  const bait = document.createElement('div');
  bait.className = 'adsbox ad ads ad-banner ad-placement pub_300x250';
  bait.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-999px;';
  document.body.appendChild(bait);
  return bait;
}

function detectAdBlock() {
  return new Promise(resolve => {
    // Cek 1: Bait ketutup gak
    const bait = createBait();
    const baitBlocked = bait.offsetHeight === 0 || bait.offsetParent === null || 
                        window.getComputedStyle(bait).display === 'none';

    // Cek 2: Script FaucetPay/Ads ke load gak
    fetch('https://faucetpay.io/static/faucetpay.js', { 
      method: 'HEAD', 
      mode: 'no-cors', 
      cache: 'no-store' 
    }).then(() => {
      // Script lolos = kemungkinan gak pake adblock
      document.body.removeChild(bait);
      resolve(baitBlocked); // Tergantung bait aja
    }).catch(() => {
      // Script keblok = 99% pake adblock
      document.body.removeChild(bait);
      resolve(true);
    });

    // Cek 3: iframe zerads.com kamu
    const iframe = document.querySelector('iframe[src*="zerads.com"]');
    if (iframe) {
      const style = getComputedStyle(iframe);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0" || iframe.offsetWidth < 50) {
        resolve(true);
        return;
      }
    }
  });
}

function showBlock() {
  if (adBlockDetected) return;
  adBlockDetected = true;
  clearInterval(checkInterval);

  const overlay = document.getElementById("adblock-overlay");
  const main = document.getElementById("main");
  if (overlay) overlay.style.display = "flex";
  if (main) main.style.display = "none";
}

function hideBlock() {
  adBlockDetected = false;
  const overlay = document.getElementById("adblock-overlay");
  const main = document.getElementById("main");
  if (overlay) overlay.style.display = "none";
  if (main) main.style.display = "block";
}

async function checkAdBlock() {
  const isBlocked = await detectAdBlock();
  if (isBlocked) {
    showBlock();
  } else if (!adBlockDetected) { // biar gak kedip-kedip
    hideBlock();
  }
}

window.addEventListener("load", () => {
  // Cek pertama agak lama biar ads sempet ke-load
  setTimeout(checkAdBlock, 3000); 

  // Cek ulang tiap 7 detik, tapi cuma kalo belum ketauan
  checkInterval = setInterval(() => {
    if (!adBlockDetected) {
      checkAdBlock();
    }
  }, 7000);

  // Cek 4: Pantau kalo ada yg ngerubah DOM/iframe pas udah jalan
  const iframe = document.querySelector('iframe[src*="zerads.com"]');
  if (iframe && 'ResizeObserver' in window) {
    const ro = new ResizeObserver(() => {
      if (iframe.offsetWidth < 50 || iframe.offsetHeight < 20) {
        showBlock();
      }
    });
    ro.observe(iframe);
  }
});