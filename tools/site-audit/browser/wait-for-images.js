() => {
  const images = [...document.querySelectorAll("img")];
  if (images.length === 0) return true;

  const candidates = images.filter((img) => {
    const rect = img.getBoundingClientRect();
    return rect.width > 32 && rect.height > 32;
  });

  const targets = candidates.length > 0 ? candidates : images.slice(0, 40);
  const stillLoading = targets.filter((img) => !img.complete);

  return stillLoading.length === 0;
}
