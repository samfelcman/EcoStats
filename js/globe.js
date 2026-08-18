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
  .then(r => r.json())
  .then(data => {
    console.log('World Atlas carregada:', data);
    const countries = topojson.feature(data, data.objects.countries).features;

    console.log(
      'Países carregados:',
      countries.length
    );

    world
    .polygonsData(countries)
    .polygonsAltitude(0.01)
    .polygonCapColor(d => d === currentHover ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.09)')
    .polygonSideColor(() => 'rgba(14,165,233,0.12)')
    .polygonStrokeColor(() => 'rgba(99,179,237,0.3)')
    .polygonLabel(d => `<div style="font-family:'DM Mono',monospace; font-size:11px; background:rgba(12,17,32,0.9); border:1px solid rgba(99,179,237,0.2); border-radius:6px; padding:5px 10px; color:#e2e8f0;">${d.properties.name || '—'}</div>`)
    .onPolygonHover(d => {
      currentHover = d;
      world.polygonCapColor(p => p === d ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.09)');
      world.polygonAltitude(p => p === d ? 0.025 : 0.01);
    })
    .onPolygonClick(async polygon => {
        console.log("País clicado:", polygon);
        const properties = polygon.properties || {};

        const isocode = 
          properties.ISO_A3 ||
          properties.ISO3 ||
          properties.ADM0_A3 ||
          properties.iso_a3 ||
          properties.ISO_A3_EH;

        const countryName =
          properties.ADMIN ||
          properties.NAME ||
          properties.name ||
          properties.NAME_EN;

        console.log("Nome:", countryName);
        console.log("ISO:", isoCode);

        if (!isoCode || isocode === "-99") {
          console.error(
            "Não foi possivel encontrar a ISO do país:",
            properties
          );

          return;
        }

        await loadCountryInfo(
          isoCode,
          countryName
        );
      });
  })
  // Fly to point of view (Go to the country you click on)
world.pointOfView({ lat: 10, lng: 0, altitude: 1.8 });