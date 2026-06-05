async () => {
  const stepDelayMs = 250;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const viewportHeight = window.innerHeight || 800;
  const step = Math.max(viewportHeight * 0.85, 400);
  const maxY =
    Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) -
    viewportHeight;

  let y = 0;
  while (y < maxY) {
    y = Math.min(y + step, maxY);
    window.scrollTo(0, y);
    await delay(stepDelayMs);
  }

  window.scrollTo(0, maxY > 0 ? maxY : document.body.scrollHeight);
  await delay(stepDelayMs);
}
