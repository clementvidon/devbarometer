export function setAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${String(window.innerHeight)}px`,
  );
}

export function setupAppHeightListener() {
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
}
