# Core Shell Migration Tracker

This tracker is for tools that already live on `simplekit.app/<slug>/` but do not yet use the shared SimpleKit Core header/footer shell.

Retirement Planner is intentionally excluded from this queue.

## Source Of Truth

Track status in [data/core-shell-migration-tracker.json](/Users/AshleySkinner/Documents/00_Engineering/04_Code/52_SimpleKit%20V4/data/core-shell-migration-tracker.json).

Each entry should move through:

- `pending`
- `in_progress`
- `completed`

## Current Queue

1. CPP Calculator
2. Net Worth Calculator
3. Mortgage Paydown vs Invest
4. Investment Fee Calculator
5. RRSP / TFSA Calculator
6. FIRE Calculator
7. Travel Planner

## Per-Tool Migration Checklist

1. Update the tool repo `index.html` to load:
   - `https://core.simplekit.app/core.css`
   - `https://core.simplekit.app/core.js`
2. Add or align `window.SimpleKitPage` config:
   - `activeNavHref`
   - `toolId`
   - support labels and any related shell config
3. Verify the shared Core shell renders the header and footer correctly.
4. Verify mobile and desktop spacing still feel right after Core mounts.
5. Refresh [52_SimpleKit V4](/Users/AshleySkinner/Documents/00_Engineering/04_Code/52_SimpleKit%20V4) from the updated tool repo if needed.
6. Mark the tracker entry `completed` only after visual QA passes.
