async function loadCountryInfo(countryName) {
  const box = document.getElementById('infobox');
  box.innerHTML = `<div class="info-placeholder"><span class="spinner"></span><br><br>Buscando dados de<br><strong>${escapeHtml(countryName)}</strong><span class="loading-dots"></span></div>`;

  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=false`);
    if (!res.ok) throw new Error('country not found');
    const data = await res.json();
    const c = data[0];

    const pop = c.population ? c.population.toLocaleString('pt-BR') : 'N/A';
    const area = c.area ? c.area.toLocaleString('pt-BR') + ' km²' : 'N/A'; // corrigido: antes exibia "undefined km²"
    const capital = c.capital?.[0] || 'N/A';
    const lang = Object.values(c.languages || {})[0] || 'N/A';
    const currency = Object.values(c.currencies || {})[0]?.name || 'N/A';
    const currSymbol = Object.values(c.currencies || {})[0]?.symbol || '';
    const region = `${c.subregion || c.region || ''}`;
    const flag = c.flag || '🏳️';
    const gini = c.gini ? Object.values(c.gini)[0] + '%' : 'N/A';
    const drive = c.car?.side || 'N/A';
    const tld = c.tld?.[0] || 'N/A';
    const lat = c.latlng?.[0];
    const lng = c.latlng?.[1];

    // GDP via World Bank
    let gdp = 'N/A', gdpPerCapita = 'N/A', gdpYear = '';
    try {
      const code = c.cca3;
      const [gdpRes, pcRes] = await Promise.all([
        fetch(`https://api.worldbank.org/v2/country/${code}/indicator/NY.GDP.MKTP.CD?format=json&mrv=1`),
        fetch(`https://api.worldbank.org/v2/country/${code}/indicator/NY.GDP.PCAP.CD?format=json&mrv=1`)
      ]);
      const [gdpData, pcData] = await Promise.all([gdpRes.json(), pcRes.json()]);
      if (gdpData[1]?.[0]?.value) {
        const v = gdpData[1][0].value;
        gdpYear = gdpData[1][0].date;
        gdp = v >= 1e12 ? `$${(v/1e12).toFixed(2)}T` : `$${(v/1e9).toFixed(1)}B`;
      }
      if (pcData[1]?.[0]?.value) {
        gdpPerCapita = `$${Math.round(pcData[1][0].value).toLocaleString('pt-BR')}`;
      }
    } catch {}

    // Segurança: todo texto vindo da API externa passa por escapeHtml()
    // antes de virar innerHTML, evitando injeção de HTML/JS (XSS).
    box.innerHTML = `
      <div style="text-align:center; margin-bottom:6px;">
        <div class="info-flag">${escapeHtml(flag)}</div>
        <div class="info-country-name">${escapeHtml(c.name.common)}</div>
        <div class="info-region">${escapeHtml(region)}</div>
      </div>
      <hr class="info-divider">
      <div class="info-grid">
        <div class="info-metric">
          <div class="info-metric-label">👥 População</div>
          <div class="info-metric-val accent">${escapeHtml(pop)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">🏙️ Capital</div>
          <div class="info-metric-val">${escapeHtml(capital)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">📐 Área</div>
          <div class="info-metric-val">${escapeHtml(area)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">🗣️ Idioma</div>
          <div class="info-metric-val">${escapeHtml(lang)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">💰 Moeda</div>
          <div class="info-metric-val green">${escapeHtml(currency)} ${escapeHtml(currSymbol)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">🌐 Domínio</div>
          <div class="info-metric-val purple">${escapeHtml(tld)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">📊 PIB ${gdpYear ? `(${escapeHtml(gdpYear)})` : ''}</div>
          <div class="info-metric-val accent">${escapeHtml(gdp)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">💵 PIB per Capita</div>
          <div class="info-metric-val green">${escapeHtml(gdpPerCapita)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">📈 Gini</div>
          <div class="info-metric-val purple">${escapeHtml(gini)}</div>
        </div>
        <div class="info-metric">
          <div class="info-metric-label">🚗 Trânsito</div>
          <div class="info-metric-val">${escapeHtml(drive)}</div>
        </div>
      </div>
      <hr class="info-divider">
      <button id="flyToBtn" style="width:100%; padding:9px; border-radius:10px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); color:var(--accent); font-family:'DM Mono',monospace; font-size:0.72rem; cursor:pointer; letter-spacing:0.05em; text-transform:uppercase;">
        🎯 Centralizar no Globo
      </button>
    `;

    // Listener adicionado via JS (em vez de onclick inline com valores interpolados)
    // — mais seguro e evita erros quando lat/lng não existem.
    const flyBtn = document.getElementById('flyToBtn');
    if (flyBtn) {
      if (lat !== undefined && lng !== undefined) {
        flyBtn.addEventListener('click', () => flyToCountry(lat, lng));
      } else {
        flyBtn.disabled = true;
        flyBtn.style.opacity = '0.4';
        flyBtn.style.cursor = 'not-allowed';
      }
    }
  } catch (err) {
    box.innerHTML = `<div class="info-placeholder" style="color:var(--danger);">❌ Não foi possível carregar os dados de <strong>${escapeHtml(countryName)}</strong>.</div>`;
  }
}

function flyToCountry(lat, lng) {
  if (lat && lng) world.pointOfView({ lat, lng, altitude: 1.8 }, 1200);
}