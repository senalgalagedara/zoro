# ZORO — Expo mobile frontend

A React Native + TypeScript app for people seeking help with bills or expenses and people offering voluntary gifts. Brand: ZORO. The demo supports country and currency labels per request; all seeded examples use LKR.

## Run

Install Node.js 22 LTS or newer, then extract this project and run:

```bash
npm ci
npm start
```

Use an Expo Go version compatible with SDK 55, or an SDK 55 development build, to open the QR code. You can also run `npm run web` for a browser preview, `npm run android` with an Android emulator, or `npm run ios` on macOS with an iOS simulator.

## Included

- Welcome and explicit giver/requester role selection.
- Giver discovery feed with category filters and search.
- Request details, story, amount raised, goal and progress.
- Requester dashboard and request creation with validation.
- Country and three-letter currency code on requests, with per-currency display and precision.
- Native PDF/image picker, optional bill filename, removal and 10 MB limit.
- Demo gift confirmation, custom amounts, anonymous option and message.
- Gift activity, funding status, profiles and role switching.
- AsyncStorage persistence on the current device.
- Responsive layout, safe areas and keyboard handling.

## Try it

1. Choose **I want to give**, open a request, send a demo gift and check Activity.
2. Try an amount larger than the remaining goal: validation blocks it.
3. Open Profile and switch to requester. Create a bill request and check its details.
4. Restart the app: demo requests and gifts remain on the device.

Demo role switching represents the same local person. Your own requests are deliberately excluded from your giver feed; real multi-user sharing requires the backend. Seeded requests and raised amounts are fictional examples. No user is authenticated. Bill selection saves only a filename, not a durable uploaded document. Anonymous visibility is a UI preference in this prototype.

## Structure

- `App.tsx`: shared UI components, screens, modal flows and local state.
- `src/model.ts`: data types, sample data, amount validation and gift update logic.
- `src/model.test.ts`: validation and funding invariants.
- `app.json`: Expo application configuration.

## Checks

```bash
npm run typecheck
npm test
npx expo install --check
npx expo export --platform all
```

## Next implementation phase

Connect authentication and server-enforced requester/giver permissions; persist requests and gifts in a backend; implement private bill uploads and review; connect a payment provider available in the intended country, recipient onboarding and payouts; verify payment success via server webhooks before changing funding totals; add reporting and moderation. Never use local state or this demo's confirm button to authorize real transfers.

This is a frontend prototype: it does not collect payment credentials, charge money, verify identities or bills, or make payouts. Country and currency fields are informational only; they do not enable real transactions, foreign-exchange conversion, or country eligibility checks.
