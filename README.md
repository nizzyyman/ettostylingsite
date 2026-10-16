# ETTO styling

A responsive, static frontend built from the ETTO Styling Site Figma member reference frame (84:22), with a matching stylist view and About manifesto.

## Run

Node.js 20 or newer. Install development dependencies before starting the local preview.

```sh
npm install
npm run dev
```

Open http://localhost:4173. Set PORT to choose another port.
The local preview includes the Agentation feedback toolbar. It does not appear in the published site.
To sync notes with an agent, run `npm run feedback` in another terminal while the preview is open. Feedback remains in the browser if the feedback server is not running.

## Build

```sh
npm run build
```

Deploy this project on Vercel. The build places the site under `dist/concierge/`; the signup endpoint runs as a Node.js function. The included development server is for local preview.

## What works

- Member/stylist radio selection updates the signup copy, form, and how-it-works steps.
- The shared navigation links to the About manifesto.
- Footer links open the matching path.
- Email and Instagram validation, inline errors, and keyboard navigation.
- Confirmation and form reset only after the submission is saved.
- Responsive layouts and reduced-motion support.

## Submission storage

Applications are sent through `/concierge/api/signup` to a private Google Apps Script receiver, which appends to the **ETTO Concierge Submissions** sheet owned by nisreen@etto.ai. The receiver is deployed and both member and stylist submissions were verified in the sheet.

Set these server-only environment variables in Vercel:

- `GOOGLE_SHEETS_WEBHOOK_URL`: deployed Apps Script web-app URL.
- `GOOGLE_SHEETS_TOKEN`: private token matching the receiver's stored hash.

For local testing, put the same values in ignored `.env.local` and restart the development server. Never put them in browser code. The receiver runs as the sheet owner; the endpoint requires the token and the sheet stays private. Submission IDs make retries idempotent. Failed writes retain the form and show an error.

Sheet: https://docs.google.com/spreadsheets/d/1RMls-mxmZpFt7lRYvKW0kdWy5NOBPn18zKMDuD0tfiM/edit

Run `node --test tests/signup.test.js` to check validation and receiver failure handling.

## Production routing

The new project serves `/concierge/` and `/concierge/about`. The existing etto.ai project has a published project-level regex rewrite from `^/concierge(/.*)?$` to `https://ettostyling-site.vercel.app/concierge$1`. This preserves the existing homepage and avoids rebuilding the old project. The public site is live at https://etto.ai/concierge. Two clearly labeled example.com launch-test rows remain in the submissions sheet.

## Brand assets

The hero, story, audience, and wordmark assets were downloaded from the Figma reference. Diatype regular, medium, and semi-mono fonts are served locally. All runtime assets are local to this project.
