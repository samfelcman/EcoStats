const REST_COUNTRIES_API_KEY = 'rc_live_52df4e65d2cc49b1a9fc427db434210a';
async function loadCountryInfo(isoCode, countryName) {

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

    // ====================================================
    // REST COUNTRIES V5
    // ====================================================

    const countryUrl =
      `https://api.restcountries.com/countries/v5/codes.alpha_3/${encodeURIComponent(isoCode)}`;

    console.log('Consultando REST Countries:', countryUrl);

    const response = await fetch(countryUrl, {
      headers: {
        Authorization: `Bearer ${REST_COUNTRIES_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `REST Countries HTTP ${response.status}`
      );
    }

    const result = await response.json();

    console.log(
      "Reposta REST Countries:",
      result
    );

    const country =
      result?.data?.objects?.[0];

    if (!country) {
      throw new Error(
        `Pais com ISO "${isoCode}" não encontrado.`
      );
    }

    console.log(
      "País encontrado:",
      country
    );


    // ----------------------------------------------------
    // JSON
    // ----------------------------------------------------

    const result = await response.json();
    console.log(
      'Resposta REST Countries:',
      result
    );
    // REST Countries V5
    // Estrutura esperada:
    //
    // data
    //   └── objects
    //          └── país
    const country =
      result?.data?.objects?.[0];

    if (!country) {
      throw new Error(
        `País "${countryName}" não encontrado.`
      );
    }
    // ====================================================
    // DADOS DO PAÍS
    // ====================================================
    // ----------------------------------------------------
    // NOME
    // ----------------------------------------------------
    const name =
      country.names?.common ||
      countryName;
    // ----------------------------------------------------
    // POPULAÇÃO
    // ----------------------------------------------------
    const population =
      country.population
        ? Number(
          country.population
        ).toLocaleString('pt-BR')
        : 'N/A';
    // ----------------------------------------------------
    // ÁREA
    // ----------------------------------------------------
    const area =
      country.area
        ? Number(
          country.area
        ).toLocaleString('pt-BR') + ' km²'
        : 'N/A';
    // ----------------------------------------------------
    // CAPITAL
    // ----------------------------------------------------
    const capital =
      country.capitals?.[0] ||
      'N/A';
    // ----------------------------------------------------
    // REGIÃO
    // ----------------------------------------------------
    const region =
      country.subregion ||
      country.region ||
      'N/A';
    // ----------------------------------------------------
    // IDIOMA
    // ----------------------------------------------------
    const languageValues =
      Object.values(
        country.languages || {}
      );
    const language =
      languageValues.length > 0
        ? (
          languageValues[0]?.name ||
          languageValues[0]
        )
        : 'N/A';
    // ----------------------------------------------------
    // MOEDA
    // ----------------------------------------------------
    const currencyValues =
      Object.values(
        country.currencies || {}
      );

    const currencyObject =
      currencyValues[0] || {};

    const currency =
      currencyObject.name ||
      'N/A';

    const currencySymbol =
      currencyObject.symbol ||
      '';
    // ----------------------------------------------------
    // BANDEIRA
    // ----------------------------------------------------
    const flag =
      country.flag?.emoji ||
      country.flag ||
      '🌍';
    // ----------------------------------------------------
    // GINI
    // ----------------------------------------------------
    const giniValues =
      country.gini
        ? Object.values(country.gini)
        : [];

    const gini =
      giniValues.length > 0
        ? `${giniValues[0]}%`
        : 'N/A';
    // ----------------------------------------------------
    // TRÂNSITO
    // ----------------------------------------------------
    const drivingSide =
      country.car?.side ||
      'N/A';
    // ----------------------------------------------------
    // DOMÍNIO
    // ----------------------------------------------------
    const domain =
      country.tld?.[0] ||
      'N/A';
    // ----------------------------------------------------
    // COORDENADAS
    // ----------------------------------------------------
    const latitude =
      country.latlng?.[0];

    const longitude =
      country.latlng?.[1];
    // ====================================================
    // ISO ALPHA 3
    // ====================================================
    const isoCode =
      country.codes?.alpha_3 ||
      country.cca3 ||
      null;

    console.log(
      'ISO Alpha-3:',
      isoCode
    );
    // ====================================================
    // WORLD BANK
    // ====================================================
    let gdp = 'N/A';
    let gdpPerCapita = 'N/A';
    let gdpYear = '';

    if (isoCode) {
      try {
        const gdpUrl =
          `https://api.worldbank.org/v2/country/${encodeURIComponent(isoCode)}/indicator/NY.GDP.MKTP.CD?format=json&mrnev=1`;

        const gdpPerCapitaUrl =
          `https://api.worldbank.org/v2/country/${encodeURIComponent(isoCode)}/indicator/NY.GDP.PCAP.CD?format=json&mrnev=1`;

        const [
          gdpResponse,
          gdpPerCapitaResponse
        ] = await Promise.all([

          fetch(gdpUrl),

          fetch(gdpPerCapitaUrl)
        ]);

        if (
          !gdpResponse.ok ||
          !gdpPerCapitaResponse.ok
        ) {

          throw new Error(
            `World Bank HTTP ${gdpResponse.status}/${gdpPerCapitaResponse.status}`
          );
        }

        const [
          gdpData,
          gdpPerCapitaData
        ] = await Promise.all([

          gdpResponse.json(),

          gdpPerCapitaResponse.json()
        ]);
        // ------------------------------------------------
        // PIB
        // ------------------------------------------------
        const gdpRecord =
          Array.isArray(gdpData?.[1])
            ? gdpData[1].find(
              item =>
                item?.value !== null &&
                item?.value !== undefined
            )
            : null;
        // ------------------------------------------------
        // PIB PER CAPITA
        // ------------------------------------------------
        const gdpPerCapitaRecord =
          Array.isArray(
            gdpPerCapitaData?.[1]
          )
            ? gdpPerCapitaData[1].find(
              item =>
                item?.value !== null &&
                item?.value !== undefined
            )
            : null;
        // ------------------------------------------------
        // FORMATAR PIB
        // ------------------------------------------------
        if (gdpRecord) {
          const value =
            Number(
              gdpRecord.value
            );

          gdpYear =
            gdpRecord.date || '';

          if (value >= 1e12) {

            gdp =
              `$${(
                value / 1e12
              ).toFixed(2)} trilhões`;
          }

          else if (value >= 1e9) {
            gdp =
              `$${(
                value / 1e9
              ).toFixed(2)} bilhões`;
          }

          else if (value >= 1e6) {

            gdp =
              `$${(
                value / 1e6
              ).toFixed(2)} milhões`;

          }

          else {

            gdp =
              `$${Math.round(
                value
              ).toLocaleString(
                'en-US'
              )}`;

          }

        }


        // ------------------------------------------------
        // FORMATAR PIB PER CAPITA
        // ------------------------------------------------

        if (gdpPerCapitaRecord) {

          gdpPerCapita =
            `$${Math.round(
              Number(
                gdpPerCapitaRecord.value
              )
            ).toLocaleString(
              'en-US'
            )}`;

        }


      }

      catch (worldBankError) {

        console.warn(
          'Erro ao carregar dados do World Bank:',
          worldBankError
        );

        // Não interrompe o carregamento do país.

      }

    }


    // ====================================================
    // RENDERIZAR PAINEL
    // ====================================================

    box.innerHTML = `

            <div
                style="
                    text-align:center;
                    margin-bottom:6px;
                "
            >

                <div class="info-flag">
                    ${escapeHtml(flag)}
                </div>


                <div class="info-country-name">
                    ${escapeHtml(name)}
                </div>


                <div class="info-region">
                    ${escapeHtml(region)}
                </div>

            </div>


            <hr class="info-divider">


            <div class="info-grid">


                <!-- POPULAÇÃO -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        👥 População
                    </div>

                    <div class="info-metric-val accent">
                        ${escapeHtml(population)}
                    </div>

                </div>


                <!-- CAPITAL -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        🏙️ Capital
                    </div>

                    <div class="info-metric-val">
                        ${escapeHtml(capital)}
                    </div>

                </div>


                <!-- ÁREA -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        📐 Área
                    </div>

                    <div class="info-metric-val">
                        ${escapeHtml(area)}
                    </div>

                </div>


                <!-- IDIOMA -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        🗣️ Idioma
                    </div>

                    <div class="info-metric-val">
                        ${escapeHtml(language)}
                    </div>

                </div>


                <!-- MOEDA -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        💰 Moeda
                    </div>

                    <div class="info-metric-val green">
                        ${escapeHtml(currency)}
                        ${escapeHtml(currencySymbol)}
                    </div>

                </div>


                <!-- DOMÍNIO -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        🌐 Domínio
                    </div>

                    <div class="info-metric-val purple">
                        ${escapeHtml(domain)}
                    </div>

                </div>


                <!-- PIB -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        📊 PIB
                        ${gdpYear
        ? `(${escapeHtml(gdpYear)})`
        : ''
      }
                    </div>

                    <div class="info-metric-val accent">
                        ${escapeHtml(gdp)}
                    </div>

                </div>


                <!-- PIB PER CAPITA -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        💵 PIB per Capita
                    </div>

                    <div class="info-metric-val green">
                        ${escapeHtml(gdpPerCapita)}
                    </div>

                </div>


                <!-- GINI -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        📈 Gini
                    </div>

                    <div class="info-metric-val purple">
                        ${escapeHtml(gini)}
                    </div>

                </div>


                <!-- TRÂNSITO -->

                <div class="info-metric">

                    <div class="info-metric-label">
                        🚗 Trânsito
                    </div>

                    <div class="info-metric-val">
                        ${escapeHtml(drivingSide)}
                    </div>

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


    // ====================================================
    // BOTÃO CENTRALIZAR
    // ====================================================

    const flyButton =
      document.getElementById(
        'flyToBtn'
      );


    if (flyButton) {

      if (
        typeof latitude === 'number' &&
        Number.isFinite(latitude) &&
        typeof longitude === 'number' &&
        Number.isFinite(longitude)
      ) {

        flyButton.addEventListener(
          'click',
          () => {

            flyToCountry(
              latitude,
              longitude
            );

          }
        );

      }

      else {

        flyButton.disabled = true;

        flyButton.style.opacity =
          '0.4';

        flyButton.style.cursor =
          'not-allowed';

      }

    }

  }


  // ========================================================
  // ERRO
  // ========================================================

  catch (error) {

    console.error(
      `Erro ao carregar ${countryName}:`,
      error
    );


    box.innerHTML = `

            <div
                class="info-placeholder"
                style="color:var(--danger);"
            >

                ❌ Não foi possível carregar os dados de

                <strong>
                    ${escapeHtml(countryName)}
                </strong>


                <br><br>


                <small style="opacity:.75;">

                    ${escapeHtml(
      error.message ||
      'Erro desconhecido'
    )}

                </small>

            </div>

        `;

  }

}


// ============================================================
// CENTRALIZAR GLOBO NO PAÍS
// ============================================================

function flyToCountry(lat, lng) {

  if (
    typeof world !== 'undefined' &&
    typeof lat === 'number' &&
    typeof lng === 'number'
  ) {
    world.pointOfView(
      {
        lat: lat,
        lng: lng,
        altitude: 1.8
      },

      1200
    );
  }
}