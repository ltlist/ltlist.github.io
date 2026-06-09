async function loadCoin(){

  try{

    if(!id){
      document.getElementById("fundamental").innerHTML =
        "❌ Coin ID tidak ditemukan";
      return;
    }

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}`
    );

    const data = await res.json();

    if(!data || !data.market_data){
      document.getElementById("fundamental").innerHTML =
        "❌ Data tidak tersedia";
      return;
    }

    document.getElementById("coinName").innerText = data.name;

    document.getElementById("priceBox").innerHTML = `
      <h2>$${data.market_data.current_price.usd}</h2>
      <p>Market Cap: $${data.market_data.market_cap.usd.toLocaleString()}</p>
      <p>24h: ${data.market_data.price_change_percentage_24h.toFixed(2)}%</p>
    `;

    document.getElementById("fundamental").innerHTML = `
      <p>Rank: #${data.market_cap_rank}</p>
      <p>ATH: $${data.market_data.ath.usd}</p>
      <p>ATL: $${data.market_data.atl.usd}</p>
      <p>Supply: ${data.market_data.circulating_supply.toLocaleString()}</p>
    `;

    loadChart();

  } catch(err){

    console.log(err);

    document.getElementById("fundamental").innerHTML =
      "❌ Gagal load data API";
  }
}