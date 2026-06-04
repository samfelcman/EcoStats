async function fetchLiveRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.rates) {
      const brl = data.rates.BRL?.toFixed(4) || '—';
      const eur = data.rates.EUR;
      const eurBrl = eur ? (data.rates.BRL / eur).toFixed(4) : '—';
      document.getElementById('rUSDtoBRL').textContent = `R$ ${brl}`;
      document.getElementById('rEURtoBRL').textContent = `R$ ${eurBrl}`;
    }
  } catch {}

  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const d = await r.json();
    if (d.bitcoin?.usd) {
      document.getElementById('rBTCtoBRL').textContent = `$${d.bitcoin.usd.toLocaleString('pt-BR')}`;
    }
  } catch {}

  const now = new Date();
  document.getElementById('statTime').textContent = now.toLocaleTimeString('pt-BR');
}

fetchLiveRates();
setInterval(fetchLiveRates, 30000);

// ─── CURRENCY CONVERTER ───────────────────────────────────────────────────────
