# ETTO styling

A responsive, dependency-free frontend based on the client/stylist flow at ko-fit.app/etto and the ETTO Styling Site Figma frame (1:6).

## Run

Node.js 18 or newer. No dependency installation needed.

```sh
npm run dev
```

Open http://localhost:4173. Set PORT to choose another port.

## Build

```sh
npm run build
```

Publish the generated `dist` directory on a static host. The included development server is for local preview.

## What works

- Client/stylist radio selection updates the form, how-it-works steps, and closing CTA.
- Footer links open the matching path.
- Email and Instagram validation, inline errors, and keyboard navigation.
- Preview confirmation and form reset.
- Responsive layouts and reduced-motion support.

No signup data is transmitted or persisted. The submit handler in app.js is the future backend integration point; the visible preview note and confirmation copy should be updated when it is connected.

## Brand assets

Original campaign image, ETTO wordmark, and stamp from the selected Figma frame. Diatype regular and semi-mono fonts reused from the existing ETTO website. All assets are served locally.
