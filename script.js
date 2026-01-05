async function scan() {
  const out = document.getElementById("output");
  out.textContent = "🔍 Scanning BSC tokens (new + old)...\n\n";

  try {
    // Query returns MANY old + new BSC pairs
    const res = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=bsc"
    );
    const data = await res.json();

    let results = [];
    let checked = 0;

    for (const pair of data.pairs) {
      if (pair.chainId !== "bsc") continue;

      checked++;

      const price = parseFloat(pair.priceUsd || 0);
      const liquidity = pair.liquidity?.usd ?? 0;
      const fdv = pair.fdv ?? 0;

      const veryLowPrice = price > 0 && price < 0.001;
      const lowLiquidity = liquidity >= 0 && liquidity < 5000;
      const absurdFDV = fdv > 5_000_000;

      if (veryLowPrice && lowLiquidity && absurdFDV) {
        results.push({
          name: pair.baseToken.name,
          symbol: pair.baseToken.symbol,
          address: pair.baseToken.address,
          price,
          liquidity,
          fdv,
          pairAge: pair.pairCreatedAt
            ? new Date(pair.pairCreatedAt).toISOString().split("T")[0]
            : "unknown"
        });
      }

      // prevent browser freeze
      if (results.length >= 50) break;
    }

    if (results.length === 0) {
      out.textContent += "✅ No fake-price candidates found.";
      return;
    }

    out.textContent +=
      `🚨 Found ${results.length} suspicious BSC tokens\n` +
      `(scanned ${checked} pairs)\n\n`;

    results.forEach((t, i) => {
      out.textContent +=
`#${i + 1}
Token: ${t.name} (${t.symbol})
Address: ${t.address}
DEX Price: $${t.price}
Liquidity: $${t.liquidity}
FDV: $${t.fdv}
Pair Created: ${t.pairAge}

`;
    });

    out.textContent +=
"⚠️ These tokens frequently show FAKE HIGH prices in wallets like Trust Wallet.\n" +
"Recommended: Report as fake-priced / dust scam.\n";

  } catch (err) {
    out.textContent = "❌ Error fetching BSC token data";
  }
}
