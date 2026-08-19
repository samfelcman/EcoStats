function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function setView(view, btn) {
  document.querySelectorAll('.bar-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
}

// ─── NAVEGAÇÃO (Início / Sobre / Contato) ────────────────────────────────────
function setNav(view, li) {
  document.querySelectorAll('.nav-links li').forEach(item => item.classList.remove('active'));
  if (li) li.classList.add('active');

  const about = document.getElementById('aboutPanel');
  const contact = document.getElementById('contactPanel');

  about.classList.toggle('open', view === 'about');
  contact.classList.toggle('open', view === 'contact');

  // Fecha painéis flutuantes do globo para não sobrepor a nova aba
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
    <div class="rank-row" data-country="${escapeHtml(c.name)}" style="cursor:pointer;">
      <span class="rank-num">${i+1}</span>
      <span class="rank-flag">${escapeHtml(c.flag)}</span>
      <span class="rank-name">${escapeHtml(c.name)}</span>
      <span class="rank-val">${escapeHtml(c.gdp)}</span>
    </div>
  `).join('');

  // Listener via JS em vez de onclick inline
  body.querySelectorAll('.rank-row').forEach(row => {
    row.addEventListener('click', () => loadCountryInfo(row.dataset.country));
  });
}

// ─── COMPARE ─────────────────────────────────────────────────────────────────
// Reaproveita a mesma API (v5) e a mesma chave configuradas em country.js.
const COMPARE_RESPONSE_FIELDS = [
  'names.common', 'population', 'capitals', 'area.kilometers',
  'languages', 'flag.emoji', 'codes.alpha_3',
].join(',');

async function loadCompare(side) {
  const input = document.getElementById(`cmp${side}`).value.trim();
  const result = document.getElementById(`cmp${side}Result`);
  if (!input) return;
  result.innerHTML = '<span class="spinner"></span>';

  try {
    const c = await fetchCountry(input);

    const pop = c.population ? Number(c.population).toLocaleString('pt-BR') : 'N/A';
    const cap = c.capitals?.[0]?.name || 'N/A';
    const area = c.area?.kilometers ? `${Number(c.area.kilometers).toLocaleString('pt-BR')} km²` : 'N/A';
    const lang = Array.isArray(c.languages) && c.languages.length > 0 ? c.languages[0].name : 'N/A';
    const flag = c.flag?.emoji || '🏳️';
    const isoCode = c.codes?.alpha_3 || null;

    let gdp = 'N/A';
    if (isoCode) {
      try {
        const gr = await fetch(`https://api.worldbank.org/v2/country/${isoCode}/indicator/NY.GDP.MKTP.CD?format=json&mrv=1`);
        const gd = await gr.json();
        if (gd[1]?.[0]?.value) {
          const v = gd[1][0].value;
          gdp = v >= 1e12 ? `$${(v/1e12).toFixed(2)}T` : `$${(v/1e9).toFixed(1)}B`;
        }
      } catch {}
    }

    // Todos os campos vindos da API são escapados antes de entrar no innerHTML
    result.innerHTML = `
      <div style="font-size:1.5rem; margin-bottom:4px;">${escapeHtml(flag)} ${escapeHtml(c.names?.common || input)}</div>
      👥 Pop: <strong>${escapeHtml(pop)}</strong><br>
      🏙️ Capital: <strong>${escapeHtml(cap)}</strong><br>
      📐 Área: <strong>${escapeHtml(area)}</strong><br>
      🗣️ Idioma: <strong>${escapeHtml(lang)}</strong><br>
      📊 PIB: <strong style="color:var(--accent);">${escapeHtml(gdp)}</strong>
    `;
  } catch (error) {
    console.error(`Erro ao comparar ${input}:`, error);
    result.innerHTML = `<span style="color:var(--danger);">${escapeHtml(error.message || 'País não encontrado.')}</span>`;
  }
}

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
