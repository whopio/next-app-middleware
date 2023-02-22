# simple i18n setup for next.js powered by `next-app-middleware`

This example uses next-app-middleware dynamic forwards to inject a static language parameter into every incoming request based on the incoming cookies or accept-language header.

The page at `/app/[locale]/page.tsx` is externally reachable at `/` while `/:locale/` is unreachable. This happens because the `/app/forward.dynamic.ts` file has a named `locale` export, indicating that an internal path forward is happening.
