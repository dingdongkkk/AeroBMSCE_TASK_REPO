# AeroBMSCE — Website Revamp

A rebuilt, responsive website for **AeroBMSCE**, the aerospace, aeromodelling and unmanned systems club of BMS College of Engineering. Built for the AeroBMSCE Web Development recruitment task.

**Live site:** https://aerobmsce-revamp.vercel.app

> Practice website for the recruitment task — not the official AeroBMSCE website.

## Pages

| Page | File | What's on it |
| --- | --- | --- |
| Home | `index.html` | Hero, key numbers, links into every section, latest result, tools ecosystem |
| Who We Are | `about.html` | Club history (est. 2012, Propel Lab–3), what we do, why it matters, vision |
| What We Build | `build.html` | The four competition teams, photo carousel, R&D initiatives |
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
style.css    – one stylesheet: design tokens at the top, then sections by component
script.js    – nav toggle, scroll reveal, counters, carousel, season filter, lightbox,
               progress bar, cursor ring, magnetic buttons, word-by-word headings, card tilt
logo3d.js    – Three.js scene: the AeroBMSCE eagle as a 3D object (ES module)
assets/logo-shape.json – the eagle traced from images/logo.png into vector outlines
images/      – assets provided with the task (large photos re-compressed)
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

**Concept — a "flight log".** The logo is a black eagle with a gold beak, so instead of the original maroon-and-dark theme I built the palette around the logo: warm drafting-paper off-white, ink black and that exact gold. Dark "night" sections are used for emphasis (page headers, R&D, vision, contact) so the page has rhythm instead of one flat colour. Inner page headers have a faint blueprint grid, and the home hero has a small flight-data style readout (base, coordinates, year founded) as a nod to aircraft instruments.

**Typography system.** Three fonts, each with one job: *Space Grotesk* for headings (technical but friendly), *Inter* for body text, and *JetBrains Mono* for small labels like `01 / WHO WE ARE`, stat captions and season labels — the "instrument readout" voice. All sizes come from a small scale with `clamp()` so headings shrink smoothly on smaller screens.

**One component system.** Every page is built from the same pieces defined once in `style.css`: section headers (mono label + heading + lead), cards, pill buttons, tick lists, the stats strip and a gold call-to-action band at the end of each page that leads to the next one. Colours, radii, spacing and fonts are CSS variables at the top of the file, so everything stays consistent.

**Information architecture.** I split the long scrolling pages into the five sections the brief asks for, and gave the nav a consistent order on every page with the current page highlighted. "Partner With Us" is styled as the primary button in the nav because that's the club's main goal for the site.

**Making the content easier to scan**
- Milestones went from a wall of `<br>` text to a timeline grouped by season, each result as a card with a gold/silver/bronze marker, and filter buttons to show one season at a time. The biggest result (2026, SAE Aero Design West) is highlighted.
- The four teams became cards with their focus area, and the R&D list became a numbered list on a dark background.
- Partnership tiers became four equal cards with a colour-coded top edge instead of a fixed-width table.
- Partner logos were all different colours and some were white-on-transparent, so they are shown as uniform white marks on dark tiles (more on this below).

**The 3D eagle (Three.js).** The centrepiece of the home page is the AeroBMSCE logo as a real 3D object, not a spinning image. I traced `images/logo.png` into vector outlines (the black eagle and the gold dart separately, saved in `assets/logo-shape.json`), then `logo3d.js` extrudes them with bevelled edges: a graphite-metal body and a raised, polished gold dart, lit like a studio product shot (environment reflections, warm key light, gold and cool rim lights, a light that follows the cursor and a subtle bloom on the gold). It "swoops" in on load, banks towards the mouse, and climbs away as you scroll, while light streaks rush past like a wind tunnel and a runway grid moves underneath. Flight-deck readouts in the corners (ALT / SPD / HDG) react to scrolling and the cursor. Smaller versions of the eagle sit in the headers of the inner pages.
It is built to be well-behaved: it only renders while it's on screen and the tab is visible, caps pixel ratio for performance, respects "reduce motion", and falls back to the flat logo image if WebGL isn't available.

**Finishing touches.** A gold reading-progress bar, a cursor ring that grows over links, buttons that lean towards the cursor, headings that reveal word by word, explore cards that tilt in 3D with a light sheen, an outlined marquee of the competitions we fly at, a scrolling partner-logo strip, a faint film grain over the site, and smooth fades between pages (View Transitions).

**Interaction.** Small and purposeful: sections fade in on scroll, numbers count up, the carousel has previous/next buttons and dots and pauses on hover/focus, gallery photos open in a lightbox (native `<dialog>`, closes with Esc or clicking outside), and on narrow screens the nav collapses into a menu button. All motion is turned off for users with "reduce motion" enabled.

**Accessibility.** Proper `lang`, alt text for meaningful images (empty alt for decorative ones), visible focus outlines, a skip link, `aria-current` on the active page, `aria-pressed` on the filter buttons, and colour contrast that's readable.

**Responsiveness.** Desktop was the priority as the brief says, but the layout is built on CSS Grid with a max-width container, so it also works down to phone widths with no horizontal scrolling.

## 3. A problem I ran into: the partner logos

**The problem.** The ecosystem section has ten partner logos. My first version put them on white tiles in greyscale (a common "logo wall" look) and a few tiles looked empty. When I checked, the Ansys, flow5, DRK Store and UAV Marketplace logos are **white artwork on a transparent background**, so on white they were invisible. Switching to dark tiles fixed those but made the black logos (SolidWorks, CSIR-NAL) disappear instead. The original site hid this because everything was on one dark background — and it squashed every logo to 140×60 so they also looked distorted.

**How I found it.** While checking the home page in the browser, two tiles in the logo wall looked blank. I put every logo on both a light and a dark background side-by-side to see which ones were light and which were dark.

**What I did.**
1. Stopped stretching logos: each one now uses `max-height`/`max-width` with `width: auto; height: auto; object-fit: contain`, so it keeps its real aspect ratio inside the tile.
2. Put all tiles on a dark background and applied `filter: brightness(0) invert(1)`. This turns every pixel of the artwork black and then inverts it to white, so every logo — whatever its original colours — becomes a clean white silhouette. That makes the wall look consistent and readable.
3. Checked again and found one edge case of the edge case: the DRDO emblem has a solid filled circle, so the filter turned it into a plain white disc. I gave that one image a `keep-colour` class that skips the filter, since its original artwork already reads well on a dark tile.

The lesson for me was to test with the real assets in the browser rather than assuming they'd all behave the same way.

---

Content and images are from the original task repository.
