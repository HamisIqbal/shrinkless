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
| Stack | Next.js 15 App Router, TypeScript, Tailwind v4 + vintage tokens, Mongoose, Zod, Motion + Lenis. |
| Fulfillment | Own stock, variant-level inventory (size x color; per-variant SKU/price/stock). |
| Vintage direction | 1970s workwear / heritage print shop. Condensed grotesque + slab serif, letterpress ink texture, halftone photography, hairline rules, warm off-white paper stock, white/black base. |
| Infra | Vercel + MongoDB Atlas + Cloudinary + Resend. |

## Open item
Shipping & tax rules — US-based store, user will decide later. Designed as a pluggable pricing module; default flat-rate zones + free-shipping threshold, Stripe Tax as a documented swap-in. Not blocking.

## Design sections
1. **Architecture & data model — APPROVED 2026-08-20.**
   - One Next.js app, route groups `(shop)` / `(account)` / `(admin)`.
   - Components never touch Mongoose; all data access via `lib/services/*` returning serializable DTOs. Server Actions/Route Handlers stay thin (Zod validate -> service -> result).
   - `middleware.ts` gates `/admin/*` by role AND every admin action re-checks role server-side.
   - 7 collections: `users`, `products`, `variants`, `carts`, `orders`, `payments`, `settings`.
   - Order items are denormalized snapshots; all money stored as integer cents.
2. **Storefront UX + vintage design system — PRESENTED, awaiting approval.**
3. Admin panel — NOT YET PRESENTED
4. Checkout & payment flow — NOT YET PRESENTED
5. Roadmap, phases & project directory structure — NOT YET PRESENTED

## Next step
Section 1 approved. Section 2 presented — await approval, then present Section 3 (admin panel).
