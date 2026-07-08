(function () {
  const storageKey = "rafael-cv-theme";
  const button = document.querySelector(".theme-toggle");

  if (!button) {
    return;
  }

  const label = button.querySelector(".toggle-text");

  function applyTheme(theme) {
    document.body.dataset.theme = theme;
    button.setAttribute("aria-pressed", String(theme === "light"));
    button.setAttribute("aria-label", theme === "light" ? "Switch to dark theme" : "Switch to light theme");
    if (label) {
      label.textContent = theme === "light" ? "Dark" : "Light";
    }
  }

  const savedTheme = localStorage.getItem(storageKey);
  applyTheme(savedTheme === "light" ? "light" : "dark");

  button.addEventListener("click", function () {
    const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
})();
