(function () {
  const pdfButton = document.querySelector(".pdf-download");

  if (pdfButton) {
    pdfButton.addEventListener("click", function () {
      window.print();
    });
  }
})();