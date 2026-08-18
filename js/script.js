/*!
 * Pension 48 — vanilla JS
 * Bez závislostí. Obsahuje: sticky header, mobilní menu, scroll animace,
 * lightbox galerie, validaci poptávkového formuláře a sticky mobilní CTA.
 */
(function () {
  "use strict";

  /* -----------------------------------------------------------------
     Sticky header — stín po odscrollování
  ----------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScrollHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScrollHeader();
    window.addEventListener("scroll", onScrollHeader, { passive: true });
  }

  /* -----------------------------------------------------------------
     Mobilní hamburger menu
  ----------------------------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navPrimary = document.querySelector(".nav-primary");

  if (navToggle && navPrimary) {
    var closeNav = function () {
      navToggle.setAttribute("aria-expanded", "false");
      navPrimary.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    var openNav = function () {
      navToggle.setAttribute("aria-expanded", "true");
      navPrimary.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };

    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Zavřít menu po kliknutí na odkaz (scroll na sekci)
    navPrimary.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    // Zavřít klávesou ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeNav();
      }
    });

    // Při zvětšení okna na desktop šířku menu vždy zavřít/resetovat
    window.addEventListener("resize", function () {
      if (window.innerWidth > 960) {
        closeNav();
      }
    });
  }

  /* -----------------------------------------------------------------
     Animace prvků při scrollování (IntersectionObserver)
  ----------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.setProperty("--stagger-index", i % 6);
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* -----------------------------------------------------------------
     Sticky mobilní CTA — zobrazit po odscrollování hero sekce,
     skrýt když je viditelný poptávkový formulář
  ----------------------------------------------------------------- */
  var mobileCta = document.querySelector(".mobile-cta");
  var hero = document.querySelector(".hero");
  var inquirySection = document.getElementById("poptavka");

  if (mobileCta && hero) {
    var heroObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          mobileCta.classList.toggle("is-visible", !entry.isIntersecting);
        });
      },
      { threshold: 0 }
    );
    heroObserver.observe(hero);

    if (inquirySection) {
      var formObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              mobileCta.classList.remove("is-visible");
            }
          });
        },
        { threshold: 0.3 }
      );
      formObserver.observe(inquirySection);
    }
  }

  /* -----------------------------------------------------------------
     Galerie + Lightbox
  ----------------------------------------------------------------- */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var lightbox = document.querySelector(".lightbox");

  if (galleryItems.length && lightbox) {
    var lbImg = lightbox.querySelector(".lightbox-figure img");
    var lbCaption = lightbox.querySelector(".lightbox-caption");
    var lbCounter = lightbox.querySelector(".lightbox-counter");
    var lbClose = lightbox.querySelector(".lightbox-close");
    var lbPrev = lightbox.querySelector(".lightbox-prev");
    var lbNext = lightbox.querySelector(".lightbox-next");
    var currentIndex = 0;
    var lastFocusedEl = null;

    var updateSlide = function (index) {
      currentIndex = (index + galleryItems.length) % galleryItems.length;
      var item = galleryItems[currentIndex];
      var fullSrc = item.getAttribute("data-full") || item.querySelector("img").src;
      var caption = item.getAttribute("data-caption") || item.querySelector("img").alt || "";
      lbImg.src = fullSrc;
      lbImg.alt = caption;
      lbCaption.textContent = caption;
      lbCounter.textContent = (currentIndex + 1) + " / " + galleryItems.length;
    };

    var openLightbox = function (index) {
      lastFocusedEl = document.activeElement;
      updateSlide(index);
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    var closeLightbox = function () {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lbImg.src = "";
      if (lastFocusedEl) {
        lastFocusedEl.focus();
      }
    };

    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function () {
        openLightbox(index);
      });
    });

    lbClose.addEventListener("click", closeLightbox);
    lbPrev.addEventListener("click", function () {
      updateSlide(currentIndex - 1);
    });
    lbNext.addEventListener("click", function () {
      updateSlide(currentIndex + 1);
    });

    // Klik mimo obrázek zavře lightbox
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Ovládání klávesnicí: ESC, šipky
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") updateSlide(currentIndex + 1);
      if (e.key === "ArrowLeft") updateSlide(currentIndex - 1);
    });
  }

  /* -----------------------------------------------------------------
     Poptávkový formulář — frontend validace
     Struktura je připravena pro snadné napojení na:
       - PHP mailer (upravit action + method, případně fetch níže)
       - Formspree / jiná služba (nastavit action="https://formspree.io/f/XXXX")
     TODO: doplnit skutečné odeslání na server / formulářovou službu.
  ----------------------------------------------------------------- */
  var form = document.getElementById("inquiry-form");

  if (form) {
    var statusBox = form.querySelector(".form-status");

    var showError = function (field, message) {
      var wrapper = field.closest(".form-field");
      wrapper.classList.add("has-error");
      var errorEl = wrapper.querySelector(".field-error");
      if (errorEl) errorEl.textContent = message;
    };

    var clearError = function (field) {
      var wrapper = field.closest(".form-field");
      wrapper.classList.remove("has-error");
      var errorEl = wrapper.querySelector(".field-error");
      if (errorEl) errorEl.textContent = "";
    };

    var validateField = function (field) {
      clearError(field);

      if (field.hasAttribute("required") && !field.value.trim()) {
        showError(field, field.dataset.errorRequired || "Toto pole je povinné.");
        return false;
      }

      if (field.type === "email" && field.value.trim()) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(field.value.trim())) {
          showError(field, field.dataset.errorEmail || "Zadejte platný e-mail.");
          return false;
        }
      }

      if (field.type === "date" && field.value) {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var val = new Date(field.value);
        if (val < today) {
          showError(field, field.dataset.errorDate || "Zvolte prosím budoucí datum.");
          return false;
        }
      }

      return true;
    };

    // Ověření, že odjezd je po příjezdu
    var validateDateRange = function () {
      var arrival = form.querySelector("#arrival");
      var departure = form.querySelector("#departure");
      if (arrival && departure && arrival.value && departure.value) {
        if (new Date(departure.value) <= new Date(arrival.value)) {
          showError(departure, departure.dataset.errorRange || "Datum odjezdu musí být po datu příjezdu.");
          return false;
        }
      }
      return true;
    };

    var fields = form.querySelectorAll("input, textarea, select");
    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        validateField(field);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var isValid = true;
      fields.forEach(function (field) {
        if (!validateField(field)) {
          isValid = false;
        }
      });

      if (isValid) {
        isValid = validateDateRange();
      }

      if (!isValid) {
        if (statusBox) {
          statusBox.textContent = form.dataset.errorSummary || "Zkontrolujte prosím vyplněné údaje.";
          statusBox.classList.remove("success");
          statusBox.classList.add("error", "is-visible");
        }
        var firstError = form.querySelector(".has-error input, .has-error textarea, .has-error select");
        if (firstError) firstError.focus();
        return;
      }

      // TODO: zde napojit skutečné odeslání (fetch na PHP endpoint / Formspree apod.)
      // Příklad napojení na Formspree nebo vlastní PHP skript:
      //
      // fetch(form.action, {
      //   method: "POST",
      //   body: new FormData(form),
      //   headers: { Accept: "application/json" },
      // })
      //   .then(function (response) {
      //     if (response.ok) { showSuccess(); } else { showFailure(); }
      //   })
      //   .catch(showFailure);

      if (statusBox) {
        statusBox.textContent = form.dataset.successMessage || "Děkujeme! Vaši poptávku jsme přijali a brzy se ozveme.";
        statusBox.classList.remove("error");
        statusBox.classList.add("success", "is-visible");
      }
      form.reset();
    });
  }

  /* -----------------------------------------------------------------
     Aktuální rok v patičce (element #year)
  ----------------------------------------------------------------- */
  var yearEls = document.querySelectorAll("#year");
  yearEls.forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* -----------------------------------------------------------------
     Nastavení minimálního data v poli "Příjezd" na dnešek
  ----------------------------------------------------------------- */
  var arrivalInput = document.getElementById("arrival");
  var departureInput = document.getElementById("departure");
  if (arrivalInput) {
    var todayStr = new Date().toISOString().split("T")[0];
    arrivalInput.setAttribute("min", todayStr);
    if (departureInput) departureInput.setAttribute("min", todayStr);

    arrivalInput.addEventListener("change", function () {
      if (departureInput) departureInput.setAttribute("min", arrivalInput.value);
    });
  }
})();
