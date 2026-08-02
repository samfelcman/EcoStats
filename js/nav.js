document.getElementById('btnRotate').addEventListener('click', () => {
  autoRotating = !autoRotating;
  controls.autoRotate = autoRotating;
  document.getElementById('btnRotate').classList.toggle('active', autoRotating);
});

document.getElementById('btnLiveData').addEventListener('click', () => {
  fetchLiveRates();
  loadTopCountries();
});

document.querySelectorAll('.nav-links li').forEach(li => {
  li.addEventListener('click', () => setNav(li.dataset.view, li));
})