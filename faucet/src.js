// first number is number of seconds
  document.getElementById('click').innerHTML = "<b><p>↓ Click on the ad to Claim ↓</p></b>";
  var tim3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1 = 7;
  var monitor = setInterval(function(){
  var elem = document.activeElement;
  if(elem && elem.tagName == 'IFRAME'){
  document.getElementById('click').innerHTML = "<b><p>↓ Click on the ad to Claim ↓</p></b>";
  clearInterval(monitor);
  str3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1();
  }
  },100);
  function str3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1() {
  setInterval(function() {
    if(tim3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1 <= 0){
        clearInterval(tim3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1);
        document.getElementById("click").innerHTML = "<b><p>Ad Click Completed. Thank You!</p></b>";
        document.title = "Thanks!";
        document.getElementById('3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1').style.display = "block";
        document.getElementById('s3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1').style.display = "block";
    } else {
        timm = tim3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1;
        document.getElementById("click").innerHTML = "<b><p>Keep the ad open for " + timm + " more seconds to continue.</p></b>";
        if(document.hasFocus()==false){
        document.title = timm + " seconds left";
        tim3ba75fd550d12b36f0c4a1e8f808f74a6aee881ef65da32b98573e9fd7a76ad1 -= 1;
        } else {
        document.title = "You are not viewing the ad!";
        document.getElementById("click").innerHTML = "<b><p>You must click on the ad to continue!</p></b>";
        }
    }
  }, 1000);
  }