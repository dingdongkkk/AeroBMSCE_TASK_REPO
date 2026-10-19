# AeroBMSCE — Website Revamp

A rebuilt, responsive website for **AeroBMSCE**, the aerospace, aeromodelling and unmanned systems club of BMS College of Engineering. Built for the AeroBMSCE Web Development recruitment task.

**Live site:** https://aerobmsce-revamp.vercel.app

> Practice website for the recruitment task — not the official AeroBMSCE website.

## Pages

| Page | File | What's on it |
| --- | --- | --- |
| Home | `index.html` | 3D eagle hero, manifesto, key numbers, drone model, links into every section, latest result, ecosystem |
| Who We Are | `about.html` | Club history (est. 2012, Propel Lab–3), what we do, why it matters, vision |
| What We Build | `build.html` | The four competition teams, a sideways-scrolling photo reel, CAD, R&D initiatives |
| Our Achievements | `achievements.html` | Season-by-season results 2018–2026 with a season filter, photo gallery with lightbox |
| Partner With Us | `partners.html` | Upcoming competitions, how partners help, collaboration tiers, outcomes, ecosystem logos, contact |

`journey.html` (the old page name) redirects to `achievements.html` so old links still work.

## Running it

It's plain HTML, CSS and JavaScript with no build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Deployed on Vercel as a static site (no build step): https://aerobmsce-revamp.vercel.app

## Project structure

```
index.html, about.html, build.html, achievements.html, partners.html
style.css            – one stylesheet: design tokens at the top, then sections by component
script.js            – nav, scroll reveals, counters, season filter, lightbox, progress bar,
                       word-by-word headings, manifesto highlight, photo reel, parallax, row previews
world.js             – the shared 3D sky behind every page (dust, wind streaks, runway grid)
logo3d.js            – the home hero: the AeroBMSCE eagle as a 3D object
page-scenes.js       – mounts a 3D model into every [data-scene] element (heroes and inline stages)
aerospace-models.js  – the procedural models: eagle emblem, turbine, multirotor, aircraft, satellite
assets/logo-shape.json – the eagle traced from images/logo.png into vector outlines
images/eagle.svg     – the same outlines as an SVG, used for the header mark and favicon
images/              – assets provided with the task (large photos re-compressed)
```

---

## 1. Flaws of the original website

The most noticeable problems I found while exploring the broken site:

**Navigation and links**
- The nav was different on every page: different order (Journey / Home / Partners on one page, Home / Journey / Partners on another) and different items.
- `contact.html` was linked from the home page but doesn't exist (404).
- Links to the current page pointed to `#`, and "Who We Are" only existed as an anchor on the home page.
- Required sections like "What we build" and "Our achievements" didn't exist as pages — the content was buried in long lists.

**Layout and images**
- Everything was fixed-width (`.wrap { width: 1480px }`, a 1440px table) so the site scrolled sideways on any normal laptop screen, and there was no viewport meta tag.
- The header logo (1688×454) was forced into 420×200, so it was visibly squashed, and the header was 220px tall.
- The banner photo (3000×2000) was squashed into 160px of height, gallery photos and every partner logo were forced to fixed sizes (`140×60`) and stretched.
- The hero text sat on a random texture image (`bg.jpg`), and the journey slideshow was floated next to text it pushed around.
- Large, uncompressed photos (some over 1 MB).

**Typography, colour and consistency**
- Four different font families (Times New Roman, Arial, Trebuchet MS, Impact) and 10–13px body text.
- Grey `#707070` text on `#141414` is hard to read; the milestones were tiny maroon text with `<br>` used for all spacing.
- Headings mixed `h1`/`h4` arbitrarily and in mixed case ("OUR JOURNEY" vs "Our Milestones").
- Partnership tiers were a table with bullet characters typed by hand.

**Accessibility and code**
- No `alt` text anywhere, no `lang` attribute, focus outlines removed (`a:focus { outline: none }`).
- The slideshow swapped images every 2 seconds with no way to pause or control it, and the script was loaded in `<head>` without `defer`.

**Content errors**
- The list of teams came *before* the sentence that introduces it ("…represent us at various prestigious events:").
- Typos: "TeamFlying Phantoms", "show cased", "Ecosytem", "lll South India Exhibition", a dangling comma in "(SAE competitions, IIT techfests, )".
- "16+ years" in the credibility summary contradicts "Established in 2012" — I used "Est. 2012" instead.

## 2. Design route and UI/UX decisions

**Concept — "night flight".** The whole site is one continuous dark sky. A single fixed Three.js canvas (`world.js`) sits behind every page: gold dust drifting past, wind streaks that speed up while you scroll, and a runway grid sliding underneath, with the camera climbing as you scroll. Content floats on top of it instead of sitting in boxes, so moving between sections and pages feels like one flight rather than a stack of panels. The palette comes straight from the logo: near-black, warm ivory text and the eagle's gold.

**Open, editorial layout — no boxed cards.** An earlier version leaned on cards and tinted panels and felt "boxed in". This version replaces them with:
- **Hairline rows** for teams, R&D projects, upcoming competitions and the site index. On the home page, hovering a row shows a photo that follows the cursor.
- **Huge numbers separated by thin rules** instead of stat boxes.
- **Full-bleed photos** that fade into the dark at top and bottom and move slightly slower than the page (parallax).
- A **manifesto** paragraph whose words light up as you scroll through it.
- A **horizontal photo reel** on the Build page: scrolling down moves the photos sideways while the section stays pinned.
- **Tiers as columns divided by rules**, partner logos as plain white marks, and a huge "Partner with us ↗" link instead of a banner.
- A giant outlined **AEROBMSCE wordmark** in the footer.

**Three.js everywhere.**
- *Home hero:* the AeroBMSCE logo as a real 3D object. I traced `images/logo.png` into vector outlines (eagle and gold dart separately, `assets/logo-shape.json`), and `logo3d.js` extrudes them into a graphite-metal eagle with a raised, polished gold dart. It is lit like a studio product shot, swoops in on load, banks towards the mouse and climbs away as you scroll. Flight-deck readouts (ALT / SPD / HDG) react to scrolling and the cursor.
- *Inner page heroes:* a model per page, full-bleed behind the headline — a swept-blade turbine (Who We Are), a multirotor (What We Build), a cambered-wing aircraft (Achievements) and a satellite (Partner With Us). They are built procedurally in `aerospace-models.js` and are illustrative, not engineering simulations.
- *Inline stages:* the same models also appear inside sections — the drone beside "What we build" on the home page, the turbine next to R&D, and the eagle emblem next to the vision and the contact details. Each stage has transparent edges that fade into the sky, so the models float in it rather than sitting in frames.

All scenes are built to behave: they pause when off screen or when the tab is hidden, cap the pixel ratio, offer a pause button, respect "reduce motion", and fall back to a still image if WebGL isn't available.

**Typography system.** Three fonts, each with one job: *Space Grotesk* for big headings, *Inter* for body text, and *JetBrains Mono* for small labels like `01 / WHO WE ARE` — the "instrument readout" voice. Sizes use `clamp()` so they scale smoothly with the screen. Headings reveal word by word as they scroll into view.

**One component system.** Every page is built from the same pieces defined once in `style.css` (section heads, rows, numbers, stages, photo bands, buttons, big CTA), with colours, spacing and fonts as CSS variables at the top. The five pages share an identical header and footer, and each page ends with a large link to the next one.

**Making the content easier to scan.** Milestones went from a wall of `<br>` text to a season-by-season timeline with big outlined year numbers, gold/silver/bronze medals and filter buttons for each season. The biggest result (2026, SAE Aero Design West) is the first and largest entry.

**Interaction.** A gold reading-progress bar, a header that turns to frosted glass once you scroll, numbers that count up, a gallery whose photos open in a lightbox (native `<dialog>`, Esc or click outside to close), scrolling marquees of competitions and partner logos, and smooth fades between pages (View Transitions). On narrow screens the nav collapses into a menu and the photo reel becomes a swipeable row. All motion is turned off for users with "reduce motion" enabled.

**Accessibility.** Proper `lang`, alt text for meaningful images (empty alt for decorative ones), visible focus outlines, a skip link, `aria-current` on the active page, `aria-pressed` on filter and pause buttons, and readable contrast on the dark background.

**Responsiveness.** Desktop was the priority as the brief says, but every layout collapses to a single column at phone width with no horizontal scrolling.

## 3. A problem I ran into: the partner logos

**The problem.** The ecosystem section has ten partner logos. My first version put them on white tiles in greyscale (a common "logo wall" look) and a few tiles looked empty. When I checked, the Ansys, flow5, DRK Store and UAV Marketplace logos are **white artwork on a transparent background**, so on white they were invisible. Switching to dark tiles fixed those but made the black logos (SolidWorks, CSIR-NAL) disappear instead. The original site hid this because everything was on one dark background — and it squashed every logo to 140×60 so they also looked distorted.

**How I found it.** While checking the home page in the browser, two tiles in the logo wall looked blank. I put every logo on both a light and a dark background side-by-side to see which ones were light and which were dark.

**What I did.**
1. Stopped stretching logos: each one now uses `max-height`/`max-width` with `width: auto; height: auto; object-fit: contain`, so it keeps its real aspect ratio.
2. Showed them on the dark background and applied `filter: brightness(0) invert(1)`. This turns every pixel of the artwork black and then inverts it to white, so every logo — whatever its original colours — becomes a clean white silhouette. That makes the wall look consistent and readable.
3. Checked again and found one edge case of the edge case: the DRDO emblem has a solid filled circle, so the filter turned it into a plain white disc. I gave that one image a `keep-colour` class that skips the filter, since its original artwork already reads well on dark.

The lesson for me was to test with the real assets in the browser rather than assuming they'd all behave the same way.

---

Content and images are from the original task repository.

