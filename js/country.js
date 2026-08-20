const REST_COUNTRIES_API_KEY = 'rc_live_52df4e65d2cc49b1a9fc427db434210a';
const REST_COUNTRIES_BASE_URL = 'https://api.restcountries.com/countries/v5';
const WORLD_BANK_BASE_URL = 'https://api.worldbank.org/v2/country';

const COUNTRY_RESPONSE_FIELDS = [
  'names.common',
  'population',
  'area.kilometers',
  'capitals',
  'region',
  'subregion',
  'languages',
  'currencies',
  'flag.emoji',
  'economy.gini_coefficient',
  'cars.driving_side',
  'tlds',
  'coordinates.lat',
  'coordinates.lng',
  'codes.alpha_3',
].join(',');

async function loadCountryInfo(countryName) {
  const box = document.getElementById('infobox');

  // --------------------------------------------------------
  // LOADING
  // --------------------------------------------------------
  box.innerHTML = `
    <div class="info-placeholder">
      <span class="spinner"></span>
      <br><br>
      Buscando dados de
      <br>
      <strong>${escapeHtml(countryName)}</strong>
      <span class="loading-dots"></span>
    </div>
  `;

  try {
    const country = await fetchCountry(countryName);
    const info = extractCountryInfo(country, countryName);
    const economics = await fetchWorldBankData(info.isoCode);

    renderCountryPanel(box, info, economics);
  } catch (error) {
    console.error(`Erro ao carregar ${countryName}:`, error);
    renderErrorPanel(box, countryName, error);
  }
}

// ============================================================
// BUSCA NA REST COUNTRIES (v5)
// ============================================================
async function restCountriesGet(path) {
  const url = `${REST_COUNTRIES_BASE_URL}${path}`;
  let response;

  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${REST_COUNTRIES_API_KEY}` },
    });
  } catch (networkError) {
    // Geralmente cai aqui quando o hostname não está liberado
    // nas origens da API key (bloqueio de CORS).
    throw new Error(
      'Falha de rede/CORS ao acessar a REST Countries. Verifique se o hostname deste site está liberado nas origens da sua API key em restcountries.com/api-keys.'
    );
  }

  if (response.status === 401) {
    throw new Error('API key da REST Countries ausente ou inválida.');
  }
  if (response.status === 403) {
    throw new Error('Cota da REST Countries excedida ou campo bloqueado no plano atual.');
  }
  if (response.status === 429) {
    throw new Error('Muitas requisições à REST Countries em pouco tempo. Tente novamente em instantes.');
  }
  if (!response.ok) {
    throw new Error(`REST Countries HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchCountry(countryName) {
  const encodedName = encodeURIComponent(countryName);

  // 1) Tenta correspondência exata pelo nome comum (case-insensitive)
  try {
    const exact = await restCountriesGet(
      `/names.common/${encodedName}?response_fields=${COUNTRY_RESPONSE_FIELDS}`
    );
    const match = exact?.data?.objects?.[0];
    if (match) return match;
  } catch (exactError) {
    // Se não for erro de "não encontrado", propaga (ex: 401, CORS, 429...)
    if (!/HTTP 404/.test(exactError.message)) throw exactError;
  }

  // 2) Fallback: busca por aproximação (nomes do globo às vezes
  // diferem do nome oficial, ex: "United States of America")
  const search = await restCountriesGet(
    `/name?q=${encodedName}&limit=5&response_fields=${COUNTRY_RESPONSE_FIELDS}`
  );
  const candidates = search?.data?.objects || [];

  if (candidates.length === 0) {
    throw new Error(`País "${countryName}" não encontrado.`);
  }

  const normalized = countryName.trim().toLowerCase();
  const bestMatch =
    candidates.find(c => c.names?.common?.toLowerCase() === normalized) ||
    candidates.find(c => normalized.includes(c.names?.common?.toLowerCase() || '\u0000')) ||
    candidates[0];

  return bestMatch;
}

// ============================================================
// NORMALIZA OS CAMPOS RETORNADOS PELA API
// ============================================================
function extractCountryInfo(country, fallbackName) {
  const name = country.names?.common || fallbackName;

  const population = country.population
    ? Number(country.population).toLocaleString('pt-BR')
    : 'N/A';

  const area = country.area?.kilometers
    ? `${Number(country.area.kilometers).toLocaleString('pt-BR')} km²`
    : 'N/A';

  const capital = country.capitals?.[0]?.name || 'N/A';
  const region = country.subregion || country.region || 'N/A';

  const languageValues = Array.isArray(country.languages) ? country.languages : [];
  const language = languageValues.length > 0 ? (languageValues[0]?.name || 'N/A') : 'N/A';

  const currencyValues = Object.values(country.currencies || {});
  const currencyObject = currencyValues[0] || {};
  const currency = currencyObject.name || 'N/A';
  const currencySymbol = currencyObject.symbol || '';

  const flag = country.flag?.emoji || '🌍';

  // gini_coefficient vem como { "2019": 53.4, ... } — pega o ano mais recente
  const giniData = country.economy?.gini_coefficient || {};
  const giniYears = Object.keys(giniData).sort().reverse();
  const gini = giniYears.length > 0 ? `${giniData[giniYears[0]]}%` : 'N/A';

  const drivingSideRaw = country.cars?.driving_side;
  const drivingSide = drivingSideRaw === 'left' ? 'Esquerda' : drivingSideRaw === 'right' ? 'Direita' : 'N/A';

  const domain = country.tlds?.[0] || 'N/A';

  const latitude = country.coordinates?.lat;
  const longitude = country.coordinates?.lng;

  const isoCode = country.codes?.alpha_3 || null;

  return {
    name, population, area, capital, region, language,
    currency, currencySymbol, flag, gini, drivingSide, domain,
    latitude, longitude, isoCode,
  };
}

// ============================================================
// BUSCA PIB / PIB PER CAPITA NA WORLD BANK API
// ============================================================
async function fetchWorldBankData(isoCode) {
  const result = { gdp: 'N/A', gdpPerCapita: 'N/A', gdpYear: '' };

  if (!isoCode) return result;

  try {
    const gdpUrl = `${WORLD_BANK_BASE_URL}/${encodeURIComponent(isoCode)}/indicator/NY.GDP.MKTP.CD?format=json&mrnev=1`;
    const gdpPerCapitaUrl = `${WORLD_BANK_BASE_URL}/${encodeURIComponent(isoCode)}/indicator/NY.GDP.PCAP.CD?format=json&mrnev=1`;

    const [gdpResponse, gdpPerCapitaResponse] = await Promise.all([
      fetch(gdpUrl),
      fetch(gdpPerCapitaUrl),
    ]);

    if (!gdpResponse.ok || !gdpPerCapitaResponse.ok) {
      throw new Error(`World Bank HTTP ${gdpResponse.status}/${gdpPerCapitaResponse.status}`);
    }

    const [gdpData, gdpPerCapitaData] = await Promise.all([
      gdpResponse.json(),
      gdpPerCapitaResponse.json(),
    ]);

    const gdpRecord = Array.isArray(gdpData?.[1])
      ? gdpData[1].find(item => item?.value !== null && item?.value !== undefined)
      : null;

    const gdpPerCapitaRecord = Array.isArray(gdpPerCapitaData?.[1])
      ? gdpPerCapitaData[1].find(item => item?.value !== null && item?.value !== undefined)
      : null;

    if (gdpRecord) {
      result.gdp = formatGdp(Number(gdpRecord.value));
      result.gdpYear = gdpRecord.date || '';
    }

    if (gdpPerCapitaRecord) {
      result.gdpPerCapita = `$${Math.round(Number(gdpPerCapitaRecord.value)).toLocaleString('en-US')}`;
    }
  } catch (worldBankError) {
    console.warn('Erro ao carregar dados do World Bank:', worldBankError);
    // Não interrompe o carregamento do país — apenas os campos de PIB ficam N/A.
  }

  return result;
}

function formatGdp(value) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)} trilhões`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)} bilhões`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)} milhões`;
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

// ============================================================
// RENDERIZAÇÃO DO PAINEL
// ============================================================
function renderCountryPanel(box, info, economics) {
  const gdpYearLabel = economics.gdpYear ? ` (${escapeHtml(economics.gdpYear)})` : '';

  box.innerHTML = `
    <div style="text-align:center; margin-bottom:6px;">
      <div class="info-flag">${escapeHtml(info.flag)}</div>
      <div class="info-country-name">${escapeHtml(info.name)}</div>
      <div class="info-region">${escapeHtml(info.region)}</div>
    </div>

    <hr class="info-divider">

    <div class="info-grid">
      <div class="info-metric">
        <div class="info-metric-label">👥 População</div>
        <div class="info-metric-val accent">${escapeHtml(info.population)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">🏙️ Capital</div>
        <div class="info-metric-val">${escapeHtml(info.capital)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">📐 Área</div>
        <div class="info-metric-val">${escapeHtml(info.area)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">🗣️ Idioma</div>
        <div class="info-metric-val">${escapeHtml(info.language)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">💰 Moeda</div>
        <div class="info-metric-val green">${escapeHtml(info.currency)} ${escapeHtml(info.currencySymbol)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">🌐 Domínio</div>
        <div class="info-metric-val purple">${escapeHtml(info.domain)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">📊 PIB${gdpYearLabel}</div>
        <div class="info-metric-val accent">${escapeHtml(economics.gdp)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">💵 PIB per Capita</div>
        <div class="info-metric-val green">${escapeHtml(economics.gdpPerCapita)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">📈 Gini</div>
        <div class="info-metric-val purple">${escapeHtml(info.gini)}</div>
      </div>

      <div class="info-metric">
        <div class="info-metric-label">🚗 Trânsito</div>
        <div class="info-metric-val">${escapeHtml(info.drivingSide)}</div>
      </div>
    </div>

    <hr class="info-divider">

    <button
      id="flyToBtn"
      style="
        width:100%;
        padding:9px;
        border-radius:10px;
        background:rgba(56,189,248,0.1);
        border:1px solid rgba(56,189,248,0.25);
        color:var(--accent);
        font-family:'DM Mono',monospace;
        font-size:0.72rem;
        cursor:pointer;
        letter-spacing:0.05em;
        text-transform:uppercase;
      "
    >
      🎯 Centralizar no Globo
    </button>
  `;

  bindFlyToButton(info.latitude, info.longitude);
}

function bindFlyToButton(latitude, longitude) {
  const flyButton = document.getElementById('flyToBtn');
  if (!flyButton) return;

  const hasCoords = typeof latitude === 'number' && Number.isFinite(latitude)
    && typeof longitude === 'number' && Number.isFinite(longitude);

  if (hasCoords) {
    flyButton.addEventListener('click', () => flyToCountry(latitude, longitude));
  } else {
    flyButton.disabled = true;
    flyButton.style.opacity = '0.4';
    flyButton.style.cursor = 'not-allowed';
  }
}

function renderErrorPanel(box, countryName, error) {
  box.innerHTML = `
    <div class="info-placeholder" style="color:var(--danger);">
      ❌ Não foi possível carregar os dados de
      <strong>${escapeHtml(countryName)}</strong>
      <br><br>
      <small style="opacity:.75;">${escapeHtml(error.message || 'Erro desconhecido')}</small>
    </div>
  `;
}

// ============================================================
// CENTRALIZAR GLOBO NO PAÍS
// ============================================================
function flyToCountry(lat, lng) {
  if (typeof world !== 'undefined' && typeof lat === 'number' && typeof lng === 'number') {
    world.pointOfView({ lat, lng, altitude: 1.8 }, 1200);
  }
}
