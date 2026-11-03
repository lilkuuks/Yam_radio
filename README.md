# YAM — Youth Alive Meets

> _Young People Made Alive · Through God's Word_

A single-page website for **YAM (Youth Alive Meets)**, a Christian youth fellowship, featuring a **live audio stream** of the Sunday service. Visitors can land on the page, read about the community, and tune in to the live broadcast directly from their browser.

🔴 **Live every Sunday, 6:30 PM** — _YAM Sunday Service_

---

## Features

- **Live radio player** — embedded stream for the Sunday service, powered by [caster.fm](https://www.caster.fm).
- **Hero section** with a one-click _"Join Sunday Service"_ call-to-action that scrolls straight to the player.
- **About / mission** section describing the fellowship and what members can expect.
- **Animated waveform & live indicator** for a polished, on-air feel.
- **Responsive static design** — a dependency-free Node build copies the public site into `dist/client`.
- **Travail 3.0 event & program** — event details and an overnight countdown at `/travailProgram`. Confirmed for 13–14 November 2026, 9 PM–6 AM GMT; the full running order is pending.
- **YAM Minstrels songbook** — original song titles, expandable lyrics, and configurable purchase links.
- **Admin publishing** — manage the service schedule, announcements, SMS drafts, and Minstrels songs locally or through Supabase.
- Custom typography (Bebas Neue + DM Sans) and a warm, modern light theme.

## Project structure

```
radio_yam/
├── index.html      # Site markup and player embed
├── styles.css      # Site styling and responsive layout
├── minstrels.html  # YAM Minstrels songs and lyrics
├── minstrels.css   # Songbook styling
├── minstrels.js    # Song loading and lyric expansion
├── travailProgram/ # Travail 3.0 event and program route
├── travail-program.css
├── travail-program.js
├── admin.html      # Protected content administration
├── Assets/
│   └── YAM.png     # Logo / favicon
├── LICENSE         # MIT License
└── README.md
```

> The site is built from [`index.html`](index.html) and [`styles.css`](styles.css). The only external runtime dependencies are Google Fonts and the caster.fm player widget, both loaded over CDN.

## Getting started

The site uses static HTML, CSS, and JavaScript. No npm dependencies need to be installed. For a deployable copy, run `npm run build`; the output is `dist/client`.

### Option 1 — Open directly

Double-click `index.html`, or open it in your browser:

```bash
# from the project root
start index.html      # Windows
open  index.html      # macOS
xdg-open index.html   # Linux
```

### Option 2 — Serve locally (recommended)

Serving over HTTP avoids browser restrictions on local files and best mirrors production:

```bash
# Python 3
python -m http.server 8000

# or Node
npx serve .
```

Then visit <http://localhost:8000>.

## Configuration

Run `node scripts/configure.mjs` after setting either Supabase credentials or the local admin username and password in the ignored `.env` file. The local password is converted to a salted hash before any browser configuration is generated.

The live stream is configured via the player embed in `index.html`. To point it at a different station, update the `data-*` attributes on the `cstrEmbed` element:

```html
<div data-type="newStreamPlayer"
     data-publicToken="YOUR_PUBLIC_TOKEN"
     data-channelId="YOUR_CHANNEL_ID"
     data-theme="dark"
     data-color="e81e4d"
     class="cstrEmbed">
</div>
```

| Attribute          | Description                                    |
| ------------------ | ---------------------------------------------- |
| `data-publicToken` | Your caster.fm public token                    |
| `data-channelId`   | The channel/station to stream                  |
| `data-theme`       | Player theme (`dark` / `light`)                |
| `data-color`       | Accent color (hex, no `#`)                     |

Swap the logo by replacing `Assets/YAM.png`.

## Deployment

Run `npm run build` and publish `dist/client` on a static host:

- **GitHub Pages** — enable Pages on the `main` branch.
- **Netlify / Vercel / Cloudflare Pages** — build command: `npm run build`; output directory: `dist/client`.

## License

Released under the [MIT License](LICENSE).

---

© 2026 YAM — Youth Alive Meets · _The Exemplary Youths_
