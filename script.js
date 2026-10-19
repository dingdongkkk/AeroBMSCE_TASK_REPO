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

/* ---------- Gold reading-progress bar at the top ---------- */
function setupProgressBar() {
  var bar = document.createElement("div");
  bar.className = "progress-bar";
  document.body.appendChild(bar);

  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? window.scrollY / max : 0;
    bar.style.transform = "scaleX(" + progress + ")";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

/* ---------- Cursor ring that follows the mouse (desktop only) ---------- */
function setupCursor() {
  var finePointer = window.matchMedia("(pointer: fine)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reduceMotion) return;

  var ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.appendChild(ring);

  var target = { x: 0, y: 0 };
  var pos = { x: 0, y: 0 };

  window.addEventListener("pointermove", function (event) {
    target.x = event.clientX;
    target.y = event.clientY;
    ring.classList.add("is-on");
    var interactive = event.target.closest("a, button, [data-lightbox]");
    ring.classList.toggle("is-hover", !!interactive);
  }, { passive: true });
  document.addEventListener("pointerleave", function () { ring.classList.remove("is-on"); });

  (function follow() {
    // ease the ring towards the pointer for a smooth trailing effect
    pos.x += (target.x - pos.x) * 0.2;
    pos.y += (target.y - pos.y) * 0.2;
    ring.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
    requestAnimationFrame(follow);
  })();
}

/* ---------- Buttons that lean towards the cursor ---------- */
function setupMagnetic() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll(".magnetic").forEach(function (el) {
    el.addEventListener("pointermove", function (event) {
      var rect = el.getBoundingClientRect();
      var dx = event.clientX - (rect.left + rect.width / 2);
      var dy = event.clientY - (rect.top + rect.height / 2);
      el.style.transform = "translate(" + dx * 0.22 + "px," + dy * 0.32 + "px)";
    });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  });
}

/* ---------- Headings reveal word by word ---------- */
function setupSplitHeadings() {
  var headings = document.querySelectorAll(".section-head h2, .page-hero h1, .cta-band h2");
  if (!headings.length || !("IntersectionObserver" in window)) return;

  var wordIndex = 0;

  // Wrap each word of every text node in <span class="split-word"><span>word</span></span>
  function wrapWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var parts = child.textContent.split(/(\s+)/);
        var fragment = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            fragment.appendChild(document.createTextNode(part));
            return;
          }
          var outer = document.createElement("span");
          outer.className = "split-word";
          var inner = document.createElement("span");
          inner.style.setProperty("--i", wordIndex++);
          inner.textContent = part;
          outer.appendChild(inner);
          fragment.appendChild(outer);
        });
        node.replaceChild(fragment, child);
      } else if (child.nodeType === 1) {
        wrapWords(child);
      }
    });
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  headings.forEach(function (heading) {
    wordIndex = 0;
    wrapWords(heading);
    heading.classList.add("split-heading");
    observer.observe(heading);
  });
}

/* ---------- Explore cards tilt in 3D under the pointer ---------- */
function setupTilt() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll(".explore-card").forEach(function (card) {
    card.addEventListener("pointermove", function (event) {
      var rect = card.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width;  // 0..1
      var y = (event.clientY - rect.top) / rect.height; // 0..1
      card.style.setProperty("--ry", (x - 0.5) * 10 + "deg");
      card.style.setProperty("--rx", (0.5 - y) * 10 + "deg");
      card.style.setProperty("--mx", x * 100 + "%");
      card.style.setProperty("--my", y * 100 + "%");
    });
    card.addEventListener("pointerleave", function () {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
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
  setupProgressBar();
  setupCursor();
  setupMagnetic();
  setupSplitHeadings();
  setupTilt();
});
