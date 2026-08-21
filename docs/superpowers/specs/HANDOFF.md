# Shrinkless — planning handoff (2026-08-20)

Session paused mid-brainstorm. Resume from "Next step" below.

## Path
Architectural brainstorming (superpowers): questions -> approaches -> sectioned design -> written spec -> writing-plans -> implementation.

## Decisions locked (do not re-ask)
| Topic | Decision |
|---|---|
| V1 scope | Full store, single brand. Shirts w/ variants, cart, guest + account checkout, Stripe + PayPal, order emails, admin panel. No reviews/wishlist/blog/multi-vendor. |
| Auth | One `users` collection + `role` field ('customer'\|'admin'); Auth.js v5 credentials, argon2, JWT cookie. Admins seeded/promoted, never self-signup. |
| Payments | Custom on-brand checkout: Stripe Payment Element + PayPal JS Buttons. Webhook-confirmed orders. No raw card storage (PCI) — tokens + last4 only. |
| Stack | Next.js 16 App Router, TypeScript, Tailwind v4 + vintage tokens, Mongoose, Zod, Motion + Lenis. |
| Fulfillment | Own stock, variant-level inventory (size x color; per-variant SKU/price/stock). |
| Vintage direction | 1970s workwear / heritage print shop. Condensed grotesque + slab serif, letterpress ink texture, halftone photography, hairline rules, warm off-white paper stock, white/black base. |
| Infra | Vercel + MongoDB Atlas + Cloudinary + Resend. |

## Open item
Shipping & tax rules — US-based store, user will decide later. Designed as a pluggable pricing module; default flat-rate zones + free-shipping threshold, Stripe Tax as a documented swap-in. Not blocking.

## Design sections
1. **Architecture & data model — APPROVED 2026-08-20.**
   - One Next.js app, route groups `(shop)` / `(account)` / `(admin)`.
   - Components never touch Mongoose; all data access via `lib/services/*` returning serializable DTOs. Server Actions/Route Handlers stay thin (Zod validate -> service -> result).
   - `proxy.ts` (Next 16 renamed `middleware` -> `proxy`) gates `/admin/*` by role AND every admin action re-checks role server-side.
   - 7 collections: `users`, `products`, `variants`, `carts`, `orders`, `payments`, `settings`.
   - Order items are denormalized snapshots; all money stored as integer cents.
2. **Storefront UX + vintage design system — APPROVED 2026-08-20.** Mini-cart drawer is the primary add-to-cart surface; filters live in a horizontal bar above the grid, held in searchParams.
3. **Admin panel — APPROVED 2026-08-20.** Own dense layout sharing storefront tokens (no texture/motion); auto-generated variant matrix in the product editor; signed direct-to-Cloudinary uploads; refunds link out to Stripe/PayPal; stock decrements on webhook confirmation, no cart reservations; `/admin` dashboard kept.
4. **Checkout & payment flow — APPROVED 2026-08-20.** Single-page `/checkout` with progressive sections; `lib/pricing` pure function is the only amount source; webhook-confirmed orders for both providers; event-ID unique index for idempotency; `/checkout/processing` polls rather than trusting the redirect. Apple Pay / Google Pay enabled via Payment Element; checkout uses a focused shell (no full header/footer).
5. **Roadmap, phases & directory structure — APPROVED 2026-08-20.**

## Next step

Phases 0–4 are DONE. The **Phase 6 design pass has also been pulled forward** and
applied; Phase 5 (checkout and payments) is the only thing standing between this
build and taking money.

### Phase 4 — admin panel (complete)

All 12 tasks landed on `phase-4-admin-panel`:

1–7 (previous session): role guards + `proxy.ts`, admin shell, admin product
DTOs/read services, pure variant matrix, product write service with variant
reconciliation, product list + editor UI, signed direct-to-Cloudinary uploads.

8. `lib/services/orders.ts` — `canTransition` (pure), `listOrders`,
   `getOrderById`, `transitionOrder`, `listOrdersForUser`, `InvalidTransitionError`.
   Spec §7.4 transition table; every move appends to `statusHistory` with the
   actor. Plus `scripts/seed-orders.ts` and `npm run seed:orders`.
9. Orders UI: `/admin/orders`, `/admin/orders/[id]`, `transitionOrderAction`,
   `FulfillmentPanel`. Refunds deep-link to Stripe/PayPal, as specified.
10. Customers (read-only): `listCustomers`, `getCustomerDetail`,
    `/admin/customers`, `/admin/customers/[id]`. Lifetime value counts only
    `paid | shipped | delivered`. No role control anywhere, by design.
11. Store settings: `settingsInputSchema`, `updateStoreSettings`,
    `saveSettingsAction`, `SettingsForm`, `/admin/settings`.
12. Dashboard: `lib/services/stats.ts` (`getAdminStats`, injectable `now`),
    rendered at `/admin`.

### Design pass (Phase 6, applied early)

Tokens live in `app/globals.css` under Tailwind v4 `@theme` and are the single
source of truth; `app/storefront.css` and `app/admin.css` consume them and
invent no colours of their own.

- Oswald (condensed grotesque) for headings/nav, Zilla Slab for body, tabular
  numerals everywhere money appears. Fixed six-step scale, no fluid clamps.
- Warm kraft paper stock, warm near-black ink (never `#000`), one saturated
  spot ink reserved for price, sale flags and the primary button.
- Generated SVG paper grain over the storefront; the admin is explicitly
  exempt (`body:has(.admin)::before { display: none }`) per spec §3.
- 12-column grid collapsing to 4, catalogue label rails, hairline rules, no
  shadows, no rounded corners.
- Signature device: the **spec strip** — four fixed workwear-tag fields
  (Fabric / Weight / Cut / Run) printed hairline-ruled under the hero.
- Entrance reveals are CSS-only and disabled under `prefers-reduced-motion`.

**Deviation from spec §6, flagged:** Motion and Lenis are *not* installed.
Smooth scroll and the staggered library-driven reveals were done with plain CSS
animation instead, to avoid adding two runtime dependencies during a design
pass. If Lenis smooth-scroll is wanted, it is an additive change.

### Verified

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npm run build` — succeeds; all 12 admin routes and the storefront compile.
  Compiled CSS carries every design class and token.

### NOT verified

- **The full test suite has not been run against Tasks 8–12.** The sandbox
  could not start `mongodb-memory-server`: the MongoDB 8.2.6 binary download
  was truncated at ~50% and `fastdl.mongodb.org` resolved intermittently
  (`EAI_AGAIN`). Test *code* for orders, customers, settings-update and stats
  is written and committed; it needs one green run on a machine with working
  DNS. Run `npm run test`.
- **No runtime walkthrough.** MongoDB Atlas is unreachable from this sandbox
  (`MongooseServerSelectionError` — the sandbox IP is not on the Atlas
  allowlist), so no page was exercised against real data. The Phase 4 plan's
  step-7 runtime checklist and step-8 proxy-bypass proof are both still owed.
- Guest -> account cart merge (carried over from Phase 3) is still unproven in
  a browser.

### Gotchas found this phase

- Mongoose 9 types query filters against the schema literal union. A
  `const X = ['paid', 'shipped']` widens to `string[]` and fails
  `$in`; annotate as `OrderStatus[]`. Same for test seed helpers — typing a
  `status` parameter as `string` will not compile.
- `PageProps<'/admin/orders/[id]'>` does not exist until route types are
  regenerated. Run `npx next typegen` after adding a dynamic route.
- `tests/setup/db.ts` used to crash in `afterAll` with "Cannot read properties
  of undefined (reading 'stop')" when `MongoMemoryServer.create()` failed,
  masking the real error. `server` is now optional and stopped with `?.`.

### Next: Phase 5 — checkout and payments

`lib/pricing`, `/checkout`, Stripe Payment Element, PayPal Buttons, both
webhooks, event-ID idempotency, `/checkout/processing` polling, order emails via
Resend. Riskiest phase; give it its own branch.

Note `/cart` already links to `/checkout`, which does not exist yet — that link
404s until Phase 5 lands.
