document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    if (!form.checkValidity()) return;
    console.info("[contact.js] Form validation passed (static demo — no submit).");
  });
});
