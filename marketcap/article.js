const id =
new URLSearchParams(location.search).get("id");

loadArticle();

async function loadArticle(){

  if(!id){
    document.getElementById("article").innerHTML =
    "Article not found";
    return;
  }

  try{

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}`
    );

    const coin = await res.json();

    const name = coin.name;
    const symbol = coin.symbol.toUpperCase();

    const price =
      coin.market_data.current_price.usd;

    const cap =
      coin.market_data.market_cap.usd;

    const rank =
      coin.market_cap_rank;

    document.title =
      `${name} Price Prediction & Analysis`;

    document.getElementById("metaDesc").content =
      `${name} live price, market cap and crypto analysis.`;

    document.getElementById("title").innerText =
      `${name} Analysis`;

    document.getElementById("article").innerHTML = `
      <img src="${coin.image.large}"
      width="80">

      <h2>${name} (${symbol})</h2>

      <p>
      ${name} is currently trading at
      <b>$${price.toLocaleString()}</b>.
      </p>

      <p>
      The coin is ranked
      <b>#${rank}</b>
      by market capitalization.
      </p>

      <p>
      Current market cap is
      <b>$${cap.toLocaleString()}</b>.
      </p>

      <h3>About ${name}</h3>

      <p>
      ${coin.description.en
      .substring(0,1000)}
      ...
      </p>

      <h3>Conclusion</h3>

      <p>
      ${name} remains one of the notable
      cryptocurrencies in the market.
      Investors should conduct their own
      research before investing.
      </p>
    `;

  }catch(err){

    document.getElementById("article").innerHTML =
      "Failed loading article";

  }

}