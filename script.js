/* =========================================================
   AeroBMSCE — shared script
   Every feature checks that its elements exist first, so the
   same file can be loaded on every page safely.
   ========================================================= */

// (the "js" class is set by an inline script in <head> before first paint)

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

/* ---------- Helper: reveal elements that are already on screen ----------
   IntersectionObserver can miss its first callback while the browser is
   still fading the new page in (view transitions), so anything already in
   view on load is revealed directly as a safety net. */
function revealOnScreenSoon(elements) {
  function check() {
    elements.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("is-visible");
    });
  }
  window.addEventListener("load", check);
  setTimeout(check, 600);
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
  revealOnScreenSoon(items);
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

  counters.forEach(function (el) {
    // start from 0 while the numbers are still hidden, so they never jump back
    if (!reduceMotion) el.textContent = "0";
    observer.observe(el);
  });
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

/* ---------- Header turns to frosted glass once you scroll ---------- */
function setupHeaderState() {
  var header = document.querySelector(".site-header");
  if (!header) return;
  function update() { header.classList.toggle("is-scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- Headings reveal word by word ---------- */
function setupSplitHeadings() {
  var headings = document.querySelectorAll(".section-head h2, .page-hero h1, .bleed-caption h2, .split h2");
  if (!headings.length || !("IntersectionObserver" in window)) return;

  // Wrap each word of every text node in <span class="split-word"><span>word</span></span>
  function wrapWords(node, counter) {
    Array.prototype.slice.call(node.childNodes).forEach(function (child) {
      if (child.nodeType === 3) {
        var fragment = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
          var outer = document.createElement("span");
          var inner = document.createElement("span");
          outer.className = "split-word";
          inner.style.setProperty("--i", counter.i++);
          inner.textContent = part;
          outer.appendChild(inner);
          fragment.appendChild(outer);
        });
        node.replaceChild(fragment, child);
      } else if (child.nodeType === 1 && child.tagName !== "BR") {
        wrapWords(child, counter);
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
    wrapWords(heading, { i: 0 });
    heading.classList.add("split-heading");
    observer.observe(heading);
  });  revealOnScreenSoon(headings);
}

/* ---------- Manifesto: words light up as you scroll through it ---------- */
function setupManifesto() {
  var block = document.querySelector(".manifesto");
  if (!block) return;

  // split into word spans, keeping <em> words gold
  var words = [];
  Array.prototype.slice.call(block.childNodes).forEach(function (child) {
    var isGold = child.nodeType === 1;
    var fragment = document.createDocumentFragment();
    child.textContent.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { fragment.appendChild(document.createTextNode(part)); return; }
      var span = document.createElement("span");
      span.className = "w" + (isGold ? " w-gold" : "");
      span.textContent = part;
      words.push(span);
      fragment.appendChild(span);
    });
    block.replaceChild(fragment, child);
  });
  block.classList.add("is-split");

  function update() {
    var rect = block.getBoundingClientRect();
    // 0 when the block enters from the bottom, 1 when it reaches the upper third
    var progress = (window.innerHeight * 0.85 - rect.top) / (rect.height + window.innerHeight * 0.35);
    var lit = Math.round(Math.max(0, Math.min(1, progress)) * words.length);
    words.forEach(function (word, i) { word.classList.toggle("is-lit", i < lit); });
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/* ---------- Horizontal reel: vertical scrolling moves the photos sideways ---------- */
function setupReel() {
  var reel = document.querySelector(".reel");
  if (!reel) return;
  var track = reel.querySelector(".reel-track");

  function layout() {
    if (window.innerWidth <= 860) { reel.style.height = ""; return; }
    // make the section tall enough to scroll the full width of the track
    var distance = track.scrollWidth - window.innerWidth;
    reel.style.height = (window.innerHeight + distance) + "px";
    update();
  }
  function update() {
    if (window.innerWidth <= 860) return;
    var rect = reel.getBoundingClientRect();
    var distance = track.scrollWidth - window.innerWidth;
    var progress = Math.max(0, Math.min(1, -rect.top / Math.max(rect.height - window.innerHeight, 1)));
    track.style.transform = "translateX(" + (-distance * progress) + "px)";
  }
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  layout();
}

/* ---------- Full-bleed photos drift slower than the page (parallax) ---------- */
function setupParallax() {
  var images = document.querySelectorAll(".bleed img");
  if (!images.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  function update() {
    images.forEach(function (img) {
      var rect = img.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      var offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -0.12;
      img.style.transform = "translateY(" + offset + "px)";
    });
  }
  window.addEventListener("scroll", update, { passive: true });
  update();
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
  setupSeasonFilter();
  setupLightbox();
  setupYear();
  setupProgressBar();
  setupHeaderState();
  setupSplitHeadings();
  setupManifesto();
  setupReel();
  setupParallax();
});
