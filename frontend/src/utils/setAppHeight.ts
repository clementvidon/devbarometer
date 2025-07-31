export function setAppHeight() {
  document.documentElement.style.setProperty(
    '--app-height',
    `${window.innerHeight}px`,
  );
}

export function setupAppHeightListener() {
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
}
