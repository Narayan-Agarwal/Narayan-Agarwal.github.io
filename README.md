# narayan agarwal — portfolio

Personal portfolio website, live at **https://narayan-agarwal.github.io/**

A single-page static site: plain HTML, CSS and vanilla JavaScript.
No framework, no build step, no npm, no external JS libraries, no tracking.
One Google Font (Space Grotesk) and a canvas particle field are the only
non-essential extras.

## What's inside

| File | Purpose |
|---|---|
| `index.html` | All content, in order: hero → manifesto → about → projects → skills → education → experience & credentials → contact |
| `styles.css` | Design tokens for the dark/light themes, layout, marquee, responsive + reduced-motion rules |
| `script.js` | Theme toggle, scroll fade-in, and the particle canvas (with a performance watchdog) |
| `resume.pdf` | Resume, linked from the hero button |
| `photo.jpg` | Portrait used in the About section |
| `favicon.svg` | Small "n" icon |

## How to edit the content

Everything you might want to change lives in `index.html`. Each section is
marked with a comment banner like `<!-- ===== PROJECTS ===== -->`, so search
for the section name and edit the text between the tags. Project cards are
`<article class="project">` blocks — copy one to add a new project.

Colors, fonts and spacing are CSS variables at the top of `styles.css`
(`--bg`, `--accent`, `--text`, …). Changing `--accent` recolors the whole site.

## Run it locally

No tooling needed — just open `index.html` in a browser
(double-click it, or `start index.html` on Windows).

If you prefer a local server (identical to how GitHub Pages serves it):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

## Notes

- Dark mode is the default; the toggle in the header remembers your choice
  (stored locally in your browser only — no cookies, no analytics).
- The particle background disables itself automatically for users with
  "reduce motion" enabled, pauses when the tab is hidden, and switches
  itself off if the frame rate drops too low on weak hardware.
- Built with AI coding assistance.
