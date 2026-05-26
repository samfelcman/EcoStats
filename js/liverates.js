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
const POPULAR = ['BRL','USD','EUR','GBP','JPY','ARS','CNY','CHF','CAD','AUD','MXN','INR','KRW','ZAR','CLP','COP'];
let ratesCache = {};

async function initConverter() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    ratesCache = data.rates || {};
    ratesCache['USD'] = 1;

    const from = document.getElementById('convFrom');
    const to = document.getElementById('convTo');
    const all = Object.keys(ratesCache).sort();

    POPULAR.forEach(c => {
      from.innerHTML += `<option value="${c}"${c==='USD'?' selected':''}>${c}</option>`;
      to.innerHTML += `<option value="${c}"${c==='BRL'?' selected':''}>${c}</option>`;
    });

    from.addEventListener('change', doConvert);
    to.addEventListener('change', doConvert);
    document.getElementById('convAmount').addEventListener('input', doConvert);
    doConvert();
  } catch {}
}

function doConvert() {
  const amount = parseFloat(document.getElementById('convAmount').value) || 0;
  const from = document.getElementById('convFrom').value;
  const to = document.getElementById('convTo').value;
  if (!ratesCache[from] || !ratesCache[to]) { document.getElementById('convResult').textContent = '—'; return; }
  const inUSD = amount / ratesCache[from];
  const result = inUSD * ratesCache[to];
  document.getElementById('convResult').textContent = `${result.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:4})} ${to}`;
}

function swapCurrencies() {
  const f = document.getElementById('convFrom');
  const t = document.getElementById('convTo');
  [f.value, t.value] = [t.value, f.value];
  doConvert();
}

initConverter();