# Kitchentory

Kitchentory is a responsive household kitchen-inventory and recipe-recommendation prototype for CMPE 131A. It uses generic demo data only.

## Technology stack

- React 18+ with TypeScript
- Vite for local development and production builds
- CSS with a small responsive design system and Lucide icons
- Browser `localStorage` as the local persistence layer
- Vitest for application-logic tests

Required software: Node.js 20+ and npm 10+.

## Install and run

```bash
npm install
npm run dev
```

Build and test:

```bash
npm run build
npm test
```

No environment variables or database server are required. The app seeds demo inventory and recipes into localStorage on first load. To reset local data, clear site storage in the browser. The test date can be set in the browser console with `localStorage.setItem('kitchentory.testDate', '2026-11-18')` for deterministic expiration testing.

## Demo accounts

- Owner: `alex.rivera@kitchentory.test` / `Kitchen@131Test!`
- Member: `jordan.lee@kitchentory.test` / `Kitchen@131Test!`
- Member: `taylor.chen@kitchentory.test` / `Kitchen@131Test!`
- Nonmember: `casey.patel@kitchentory.test` / `Kitchen@131Test!`

These credentials are local demo credentials, not production secrets.

## Implemented features

The app includes protected demo login/logout, shared-household context, inventory search/add/discard with locations and expiration status, exact and estimated dates, two-day alerts, recipe generation with cuisine/diet/equipment/allergy filters, exact/partial matching and missing ingredients, saved recipes, full recipe instructions, barcode validation with recognized/unrecognized/invalid states, manual fallback, responsive navigation, and accessible labels.

## Mock services and limitations

Recipe and barcode data are seeded local mock services so the project works offline. Camera capture, OCR, live external recipe importing, password reset email delivery, multi-user synchronization, and server-side authorization are not connected. The local prototype still keeps household IDs on records and restricts the UI to the authenticated demo session; a production deployment should replace localStorage with a backend and secure password handling.

## Folder structure

```text
src/main.tsx       React pages and application UI
src/data.ts        demo users, household, inventory, recipes, barcode catalog
src/logic.ts       pure validation, expiration, and recommendation logic
src/logic.test.ts  Vitest tests for core requirements
src/styles.css     responsive visual design
```

## Troubleshooting

- If dependencies are stale, remove `node_modules` and run `npm install` again.
- If the page appears logged out after an update, clear localStorage and reload.
- If images are unavailable offline, recipe cards retain their names and metadata; the image URLs are decorative Unsplash references.
