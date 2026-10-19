/* =========================================================
   AeroBMSCE — shared script
   Every feature checks that its elements exist first, so the
   same file can be loaded on every page safely.
   ========================================================= */

document.documentElement.classList.remove("no-js");

/* ---------- Mobile navigation toggle ---------- */
function setupNav() {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  if (!header || !toggle) return;

  toggle.addEventListener("click", function () {
    var isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen);
  });

  // Close the menu with Escape
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && header.classList.contains("nav-open")) {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.focus();
    }
  });
}

/* ---------- Fade sections in as they scroll into view ---------- */
function setupReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach(function (el) { observer.observe(el); });
}

/* ---------- Count-up numbers in the stats strip ---------- */
function setupCounters() {
  var counters = document.querySelectorAll("[data-count]");
  if (!counters.length || !("IntersectionObserver" in window)) return;

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function run(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target; return; }

    var start = null;
    var duration = 1200;
    function step(time) {
      if (!start) start = time;
      var progress = Math.min((time - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function (el) { observer.observe(el); });
}

/* ---------- Photo carousel (replaces the old 2-second image swap) ---------- */
function setupCarousel() {
  var carousel = document.querySelector(".carousel");
  if (!carousel) return;

  var track = carousel.querySelector(".carousel-track");
  var slides = carousel.querySelectorAll(".carousel-slide");
  var dotsBox = carousel.querySelector(".carousel-dots");
  var current = 0;
  var timer = null;

  // Build one dot per slide
  slides.forEach(function (_, index) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Show photo " + (index + 1));
    dot.addEventListener("click", function () { goTo(index); restart(); });
    dotsBox.appendChild(dot);
  });
  var dots = dotsBox.querySelectorAll("button");

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = "translateX(-" + current * 100 + "%)";
    dots.forEach(function (dot, i) {
      dot.setAttribute("aria-current", i === current ? "true" : "false");
    });
    slides.forEach(function (slide, i) {
      slide.setAttribute("aria-hidden", i === current ? "false" : "true");
    });
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { goTo(current + 1); }, 5000);
  }

  carousel.querySelector("[data-prev]").addEventListener("click", function () { goTo(current - 1); restart(); });
  carousel.querySelector("[data-next]").addEventListener("click", function () { goTo(current + 1); restart(); });

  // Pause while the user is looking at / interacting with it
  carousel.addEventListener("mouseenter", function () { clearInterval(timer); });
  carousel.addEventListener("mouseleave", restart);
  carousel.addEventListener("focusin", function () { clearInterval(timer); });

  goTo(0);
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) restart();
}

/* ---------- Filter achievements by season ---------- */
function setupSeasonFilter() {
  var buttons = document.querySelectorAll(".filter-btn");
  var seasons = document.querySelectorAll(".season");
  if (!buttons.length) return;

  buttons.forEach(function (button) {
    button.addEventListener("click", function () {
      var year = button.getAttribute("data-year");

      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === button); });
      seasons.forEach(function (season) {
        season.hidden = year !== "all" && season.getAttribute("data-year") !== year;
      });
    });
  });
}

/* ---------- Gallery lightbox (uses the native <dialog>) ---------- */
function setupLightbox() {
  var dialog = document.querySelector(".lightbox");
  if (!dialog || typeof dialog.showModal !== "function") return;

  var image = dialog.querySelector("img");

  document.querySelectorAll("[data-lightbox]").forEach(function (button) {
    button.addEventListener("click", function () {
      var thumb = button.querySelector("img");
      image.src = thumb.src;
      image.alt = thumb.alt;
      dialog.showModal();
    });
  });

  dialog.querySelector(".lightbox-close").addEventListener("click", function () { dialog.close(); });
  // Clicking the dark backdrop closes it too
  dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
  });
}

/* ---------- Footer year ---------- */
function setupYear() {
  var el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", function () {
  setupNav();
  setupReveal();
  setupCounters();
  setupCarousel();
  setupSeasonFilter();
  setupLightbox();
  setupYear();
});
