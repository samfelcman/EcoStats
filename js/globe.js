let autoRotating = true;
let currentHover = null;

const world = Globe()(document.getElementById('globeViz'))
  .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
  .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
  .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
  .showAtmosphere(true)
  .atmosphereColor('#1e34af')
  .atmosphereAltitude(0.22)
  .width(window.innerWidth)
  .height(window.innerHeight);

const controls = world.controls();
controls.autoRotate = true;
controls.autoRotateSpeed = 0.35;

window.addEventListener('resize', () => {
  world.width(window.innerWidth).height(window.innerHeight);
});

// Polygon data
fetch('https://unpkg.com/world-atlas/countries-110m.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Erro ao carregar países: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('World Atlas carregado');
    const countries = topojson.feature(
      data,
      data.objects.countries
    ).features;
    console.log(
      'Quantidade de países:',
      countries.length
    );

    world
      .polygonsData(countries)
      // Altura normal dos países
      .polygonAltitude(0.006)
      // Cor dos países
      .polygonCapColor(d => {
        if (d === currentHover) {
          return '#38bdf8';
        }
        return 'rgba(255,255,255,0.08)';
      })
      // Laterais
      .polygonSideColor(() => {
        return 'rgba(14,165,233,0.12)';
      })
      // Bordas
      .polygonStrokeColor(() => {
        return 'rgba(99,179,237,0.35)';
      })
      // Tooltip
      .polygonLabel(d => {
        const name =
          d.properties?.name || 'País';
        return `
          <div style="
            font-family: 'DM Mono', monospace;
            font-size: 11px;
            background: rgba(12,17,32,0.95);
            border: 1px solid rgba(99,179,237,0.3);
            border-radius: 6px;
            padding: 6px 10px;
            color: #e2e8f0;
          ">
            ${name}
          </div>
        `;
      })
      .onPolygonHover(d => {
        currentHover = d;
        world
          .polygonCapColor(country => {
            if (country === d) {
              return '#38bdf8';
            }
            return 'rgba(255,255,255,0.08)';
          })
          .polygonAltitude(country => {
            if (country === d) {
              return 0.02;
            }
            return 0.006;
          });
      })
      // Clique
      .onPolygonClick(async polygon => {
        console.log(
          'País clicado:',
          polygon
        );
        const properties =
          polygon.properties || {};
        console.log(
          'Properties:',
          properties
        );
        const countryName =
          properties.name ||
          properties.NAME ||
          properties.ADMIN ||
          'País desconhecido';

        console.log(
          'Nome:',
          countryName
        );
        // Aqui vamos resolver o ISO
        // posteriormente.
        //
        // Por enquanto apenas verificamos
        // se o país foi identificado.
        if (!countryName) {
          console.error(
            'Não foi possível identificar o país.'
          );
          return;
        }
        /*
         * IMPORTANTE:
         *
         * Não chame REST Countries aqui ainda
         * se o ISO estiver undefined.
         *
         * Primeiro vamos confirmar o mapa.
         */
        console.log(
          'Pronto para carregar dados de:',
          countryName
        );
      });
    // Posição inicial
    world.pointOfView({
      lat: 10,
      lng: 0,
      altitude: 1.8
    });
  })
  .catch(error => {
    console.error(
      'Erro ao carregar World Atlas:',
      error
    );
  });