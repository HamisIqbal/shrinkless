# Shrinkless — planning handoff (2026-08-20)

Session paused mid-brainstorm. Resume from "Next step" below.

## Path
Architectural brainstorming (superpowers): questions -> approaches -> sectioned design -> written spec -> writing-plans -> implementation.
**No code written yet, by user instruction.**

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
Phases 0-2 are DONE and merged to main. 64 tests, tsc/lint/build clean.

Phase 2 shipped: shop layout, home, /shop grid with URL-driven filters,
/product/[slug] with variant picker, /cart with quantity editing. All unstyled
by design. Verified at runtime against live Atlas: all routes 200, seeded
products render, filters change results, cart cookie round-trips, unknown slug 404s.

Bugs found and fixed during Phase 2:
- No service ever called connectToDatabase(). Tests connected via the harness so
  it was invisible; with bufferCommands:false every page would have thrown.
- Size/colour filters matched sold-out variants, sending shoppers to dead ends.
  A variant must now be enabled AND in stock to satisfy a filter.

Scope moved out of Phase 2 (user-approved):
- Mini-cart drawer -> Phase 6 (it is a design artifact; building it unstyled means
  building it twice).
- Guest->account cart merge -> Phase 3 (needs login to trigger).

Known state:
- Every route is dynamic because the shop layout reads the cart cookie. If static
  rendering or PPR matters later, move the cart count into a client island.
- /checkout 404s until Phase 5. /about is linked in the nav but does not exist yet.
- The add-to-cart Server Action's cookie WRITE was never verified in a real browser;
  everything else was verified by script.

Next: Phase 3 (auth) or Phase 4 (admin). Write the plan before touching code, and
read node_modules/next/dist/docs/ for anything App Router.
