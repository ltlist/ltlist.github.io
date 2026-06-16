// src.js

window.addEventListener("load", function () {

  const warning = document.getElementById("block-adb-enabled");
  const main = document.getElementById("main");

  const checkAdblock = () => {

    if (
      document.getElementById("ToZQWzAfsUC") &&
      document.getElementById("HoZQWzAfsUCj")
    ) {

      if (main) main.style.display = "block";
      if (warning) warning.style.display = "none";

    } else {

      if (warning) warning.style.display = "block";
      if (main) main.style.display = "none";

      alert("Disable AdBlock to claim rewards!");

    }

  };

  setTimeout(checkAdblock, 3000);

});