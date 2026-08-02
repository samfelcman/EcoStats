function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;"
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    )
}

let converterOpen = false;
function toggleConverter() {
  converterOpen = !converterOpen;
  document.getElementById('converterPanel').classList.toggle('open', converterOpen);
  document.getElementById('bottomBar').classList.toggle('hidden', converterOpen);
}

let topOpen = false;
function toggleTop() {
  topOpen = !topOpen;
  document.getElementById('topPanel').classList.toggle('open', topOpen);
  if (topOpen) loadTopCountries();
}

let compareOpen = false;
function toggleCompare() {
  compareOpen = !compareOpen;
  document.getElementById('compareModal').style.display = compareOpen ? 'block' : 'none';
  document.getElementById('compareOverlay').style.display = compareOpen ? 'block' : 'none';
}

function setView(v) {
  document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));
  event.target.closest('.bar-btn').classList.add('active');
}

// NAV(Inicio, Sobre, Contato)
function setNav(view, li) {
  document.querySelectorAll('.nav-links li').forEach(b => b.classList.remove('active'));
  if (li) li.classList.add('active');

  const about = document.getElementeById('aboutPanel');
  const contact = document.getElementeById('contactPanel');

  about.classList.toggle('open', view === 'about');
  contact.classList.toggle('open', view === 'contact');

  //Fecha painéis flutuantes do globo para não sobrepor a nova aba
  if (view !== 'home') {
    converterOpen = false;
    topOpen = false;
    compareOpen = false;
    document.getElementById('converterPanel').classList.remove('open');
    document.getElementById('bottomBar').classList.remove('hidden');
    document.getElementById('topPanel').classList.remove('open');
    document.getElementById('compareModal').style.display = 'none';
    document.getElementById('compareOverlay').style.display = 'none';
  }
}

// Fecha as abas Sobre/Contato com a tecla Esc, por conveniência
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const homeLi = document.querySelector('.nav-links li[data-view="home"]');
    setNav('home', homeLi);
  }
});

// ─── TOP COUNTRIES ────────────────────────────────────────────────────────────
const TOP_GDP = [
  { name: 'United States', flag: '🇺🇸', gdp: '$27.4T' },
  { name: 'China', flag: '🇨🇳', gdp: '$17.7T' },
  { name: 'Germany', flag: '🇩🇪', gdp: '$4.1T' },
  { name: 'Japan', flag: '🇯🇵', gdp: '$4.2T' },
  { name: 'India', flag: '🇮🇳', gdp: '$3.7T' },
];

function loadTopCountries() {
  const body = document.getElementById('topBody');
  body.innerHTML = TOP_GDP.map((c, i) => `
    <div class="rank-row" onclick="loadCountryInfo('${c.name}')" style="cursor:pointer;">
      <span class="rank-num">${i+1}</span>
      <span class="rank-flag">${c.flag}</span>
      <span class="rank-name">${c.name}</span>
      <span class="rank-val">${c.gdp}</span>
    </div>
  `).join('');
}

// ─── COMPARE ─────────────────────────────────────────────────────────────────
async function loadCompare(side) {
  const input = document.getElementById(`cmp${side}`).value.trim();
  const result = document.getElementById(`cmp${side}Result`);
  if (!input) return;
  result.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(input)}`);
    const data = await res.json();
    const c = data[0];
    const pop = c.population?.toLocaleString('pt-BR');
    const cap = c.capital?.[0] || 'N/A';
    const area = c.area?.toLocaleString('pt-BR');
    const lang = Object.values(c.languages||{})[0] || 'N/A';
    const flag = c.flag || '🏳️';
    let gdp = 'N/A';
    try {
      const gr = await fetch(`https://api.worldbank.org/v2/country/${c.cca3}/indicator/NY.GDP.MKTP.CD?format=json&mrv=1`);
      const gd = await gr.json();
      if (gd[1]?.[0]?.value) {
        const v = gd[1][0].value;
        gdp = v >= 1e12 ? `$${(v/1e12).toFixed(2)}T` : `$${(v/1e9).toFixed(1)}B`;
      }
    } catch {}
    result.innerHTML = `
      <div style="font-size:1.5rem; margin-bottom:4px;">${flag} ${c.name.common}</div>
      👥 Pop: <strong>${pop}</strong><br>
      🏙️ Capital: <strong>${cap}</strong><br>
      📐 Área: <strong>${area} km²</strong><br>
      🗣️ Idioma: <strong>${lang}</strong><br>
      📊 PIB: <strong style="color:var(--accent);">${gdp}</strong>
    `;
  } catch {
    result.innerHTML = '<span style="color:var(--danger);">País não encontrado.</span>';
  }
}

// Enter para buscar, sem precisar clicar no botão
document.addEventListener('DOMContentLoaded', () => {
  ['A', 'B'].forEach(side => {
    const input = document.getElementById(`cmp${side}`);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') loadCompare(side);
      });
    }
  });
});