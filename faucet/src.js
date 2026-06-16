const overlay = document.getElementById("adblock-overlay");
const main = document.getElementById("main");

function lockPage() {
  overlay.style.display = "flex";
  main.style.display = "none";
}

function unlockPage() {
  overlay.style.display = "none";
  main.style.display = "block";
}

function detectByBait() {
  const bait = document.createElement("div");

  bait.className =
    "ads ad adsbox ad-banner ad-container banner-ad sponsor-ad";

  bait.style.cssText =
    "width:1px;height:1px;position:absolute;left:-9999px;";

  document.body.appendChild(bait);

  const blocked =
    bait.offsetHeight === 0 ||
    bait.clientHeight === 0 ||
    getComputedStyle(bait).display === "none" ||
    getComputedStyle(bait).visibility === "hidden";

  bait.remove();

  return blocked;
}

function detectAdsbyGoogle() {
  return typeof window.adsbygoogle === "undefined";
}

function detectBlockedScript() {
  return !document.querySelector(
    'script[src*="googlesyndication"],script[src*="doubleclick"]'
  );
}

function detectAdBlock() {

  let score = 0;

  if (detectByBait()) score++;
  if (detectAdsbyGoogle()) score++;
  if (detectBlockedScript()) score++;

  return score >= 2;
}

function checkAdBlock() {

  setTimeout(() => {

    if (detectAdBlock()) {
      lockPage();
    } else {
      unlockPage();
    }

  }, 500);

}

window.addEventListener("load", () => {

  checkAdBlock();

  setInterval(() => {

    if (detectAdBlock()) {
      lockPage();
    }

  }, 5000);

});