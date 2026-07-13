(function () {
  const pdfButton = document.querySelector(".pdf-download");

  if (!pdfButton) {
    return;
  }

  // Only index.html's button carries this flag. Other pages (e.g. the
  // Shell Talent Card) fall through to a plain single-page print below.
  if (pdfButton.dataset.printScope !== "full-cv") {
    pdfButton.addEventListener("click", function () {
      window.print();
    });
    return;
  }

  // Pages merged into the full-CV export, in reading order. Deliberately
  // excludes talent-card/index.html, which is a separate, self-contained
  // experience and is never part of this export.
  const MERGE_PAGES = ["roles/digital.html", "roles/geoscience.html", "leadership/index.html"];
  const mergeContainer = document.getElementById("print-merge-pages");

  if (!mergeContainer) {
    pdfButton.addEventListener("click", function () {
      window.print();
    });
    return;
  }

  let mergePromise = null;

  function fetchMergedPage(url) {
    return fetch(url)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Request failed with status " + response.status);
        }
        return response.text();
      })
      .then(function (html) {
        const parsedDoc = new DOMParser().parseFromString(html, "text/html");
        const shell = parsedDoc.querySelector(".detail-shell");
        if (!shell) {
          throw new Error("No .detail-shell found in " + url);
        }

        const clone = shell.cloneNode(true);

        // The footer's "Back to CV timeline" link only makes sense when the
        // page is viewed standalone; it has no place (and a broken relative
        // href) inside the merged export, so drop it.
        const footer = clone.querySelector(".detail-footer");
        if (footer) {
          footer.remove();
        }

        // Source pages live one folder below index.html, so their asset
        // paths start with "../". Rewrite them to be correct from
        // index.html's own location before the clone is inserted here.
        clone.querySelectorAll("img[src^='../']").forEach(function (img) {
          img.setAttribute("src", img.getAttribute("src").replace("../", ""));
        });

        const wrapper = document.createElement("div");
        wrapper.className = parsedDoc.body ? parsedDoc.body.className : "detail-page editorial-detail";
        wrapper.appendChild(clone);
        return wrapper;
      })
      .catch(function (error) {
        console.warn("Full CV export: skipping " + url + " — " + error.message);
        return null;
      });
  }

  function buildMergedPages() {
    if (mergePromise) {
      return mergePromise;
    }

    mergePromise = Promise.all(MERGE_PAGES.map(fetchMergedPage)).then(function (wrappers) {
      wrappers.forEach(function (wrapper) {
        if (wrapper) {
          mergeContainer.appendChild(wrapper);
        }
      });
    });

    return mergePromise;
  }

  pdfButton.addEventListener("click", function () {
    pdfButton.disabled = true;
    pdfButton.setAttribute("aria-busy", "true");

    buildMergedPages()
      .catch(function (error) {
        console.warn("Full CV export: continuing with page one only — " + error.message);
      })
      .then(function () {
        window.print();
      })
      .then(function () {
        pdfButton.disabled = false;
        pdfButton.removeAttribute("aria-busy");
      });
  });
})();