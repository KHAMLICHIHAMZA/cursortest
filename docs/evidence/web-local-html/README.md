# Web Screenshots Pack (Local Static)

This folder contains automatically generated screenshots from local static HTML pages under `frontend-web/.next/server/app`.

## Purpose

- Provide broad visual coverage of MALOC web screens for executive/MOA documentation.
- Accelerate first-pass documentation before full connected-session capture.

## Important Notes

- Screenshots are generated from local built HTML, not a live authenticated session.
- Dynamic routes (like `[id]`) may be missing and must be captured manually in-app.
- Data shown may be partial or static depending on pre-rendered artifacts.

## Generation

Run:

```bash
node scripts/capture-web-screenshots-local-html.mjs
```

