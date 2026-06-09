# YAM — Youth Alive Meets

> _Young People Made Alive · Through God's Word_

A single-page website for **YAM (Youth Alive Meets)**, a Christian youth fellowship, featuring a **live audio stream** of the Sunday service. Visitors can land on the page, read about the community, and tune in to the live broadcast directly from their browser.

🔴 **Live every Sunday, 6:30 AM** — _YAM Sunday Service_

---

## Features

- **Live radio player** — embedded stream for the Sunday service, powered by [caster.fm](https://www.caster.fm).
- **Hero section** with a one-click _"Join Sunday Service"_ call-to-action that scrolls straight to the player.
- **About / mission** section describing the fellowship and what members can expect.
- **Animated waveform & live indicator** for a polished, on-air feel.
- **Responsive, single-file design** — no build step, no dependencies to install.
- Custom typography (Bebas Neue + DM Sans) and a warm, modern light theme.

## Project structure

```
radio_yam/
├── index.html      # The entire site (markup, styles, and player embed)
├── Assets/
│   └── YAM.png     # Logo / favicon
├── LICENSE         # MIT License
└── README.md
```

> The whole site lives in [`index.html`](index.html) — HTML, CSS, and the stream embed are all inline. The only external runtime dependencies are Google Fonts and the caster.fm player widget, both loaded over CDN.

## Getting started

Because the site is a static HTML page, there is **nothing to build**.

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

Any static host works — just publish the repository root:

- **GitHub Pages** — enable Pages on the `main` branch.
- **Netlify / Vercel / Cloudflare Pages** — point at the repo; no build command needed.

## License

Released under the [MIT License](LICENSE).

---

© 2026 YAM — Youth Alive Meets · _The Exemplary Youths_
