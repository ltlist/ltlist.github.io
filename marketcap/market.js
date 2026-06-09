async function loadMarket() {
  const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,dogecoin,ethereum,solana&order=market_cap_desc";

  try {
    const res = await fetch(url);
    const data = await res.json();

    let html = "";

    data.forEach((coin, index) => {

      let changeClass = coin.price_change_percentage_24h >= 0
        ? "price-up"
        : "price-down";

      html += `
        <tr>
          <td>${index + 1}</td>

          <td>
            <div class="coin">
              <img src="${coin.image}" />
              ${coin.name}
            </div>
          </td>

          <td>$${coin.current_price.toLocaleString()}</td>

          <td class="${changeClass}">
            ${coin.price_change_percentage_24h.toFixed(2)}%
          </td>

          <td>$${coin.market_cap.toLocaleString()}</td>
        </tr>
      `;
    });

    document.getElementById("coinTable").innerHTML = html;

  } catch (error) {
    document.getElementById("coinTable").innerHTML =
      `<tr><td colspan="5">Failed to load data</td></tr>`;
  }
}

loadMarket();
setInterval(loadMarket, 15000);