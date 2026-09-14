# ShopNest

A full-stack e-commerce store built with the MERN stack — jewellery and accessories,
priced in PKR, with cash on delivery.

It covers the whole shape of a real store rather than a demo slice: product variants,
stock that is actually reserved at checkout, coupons with usage limits, an order
lifecycle with a status machine, customer reviews, wishlists, and an admin panel with
analytics and CSV import/export.

---

## Contents

- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Seeding demo data](#seeding-demo-data)
- [Creating an admin account](#creating-an-admin-account)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Design notes](#design-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)

---

## Screenshots

> Replace these placeholders with real screenshots before sharing the repo.
> A `docs/` folder with 4–6 images is plenty: home page, shop with filters,
> product page, cart, admin dashboard, admin product form.

| Storefront | Admin |
| --- | --- |
| ![Home page](docs/home.png) | ![Dashboard](docs/dashboard.png) |
| ![Product page](docs/product.png) | ![Product list](docs/admin-products.png) |

---

## Tech stack

### Frontend

| Tool | Purpose |
| --- | --- |
| React 19 | UI library |
| Vite 8 | Dev server and build tool |
| React Router 7 | Client-side routing |
| Tailwind CSS 4 | Styling, via `@tailwindcss/vite` |
| Axios | HTTP client, with cookies enabled |
| Recharts | Dashboard charts |
| Lucide React | Icon set |
| ESLint 10 | Linting, with the React Hooks plugin |

State is handled with React Context — no Redux. There are five providers:
toast, confirm dialog, auth, wishlist and cart.

### Backend

| Tool | Purpose |
| --- | --- |
| Node.js + Express 5 | HTTP server and routing |
| MongoDB + Mongoose 9 | Database and schema layer |
| JSON Web Tokens | Auth, stored in an httpOnly cookie |
| bcryptjs | Password hashing |
| Multer | Multipart upload handling, in memory |
| Cloudinary | Image storage and on-the-fly resizing |
| Helmet | Security headers |
| express-rate-limit | Throttling, tighter on auth routes |
| cookie-parser, cors, dotenv | Supporting middleware |
| Nodemon | Auto-restart in development |

### Theme

Brand colours are defined once in `client/src/index.css` as Tailwind v4 theme
tokens, so `bg-navy`, `text-teal` and friends work anywhere:

```css
@theme {
  --color-navy: #1E3A5F;   /* primary — buttons, headings */
  --color-teal: #2C96AA;   /* accent — links, badges */
  --color-amber: #DDA15E;  /* promotions — sale badges */
}
```

---

## Features

### Storefront

- **Product catalogue** with pagination, and product variants (colour, size, or any
  option set) each with their own price, stock, SKU and image
- **Search** from the header on any page, or from the shop page, matching names and tags
- **Filters** — category (including subcategories), price range, in-stock only,
  on-sale only; all held in the URL so results can be bookmarked and shared
- **Sorting** — newest, best selling, best rated, name, price
- **Collections** — curated groups of products with their own pages
- **Product page** with an image gallery, variant picker, stock-aware quantity input,
  star ratings, reviews and a "You may also like" row
- **Reviews** — one per customer per product, with verified-purchase badges,
  a star breakdown and rating filters
- **Wishlist** with optimistic hearts that roll back if a request fails
- **Cart** that survives a refresh and re-checks prices and stock against the server,
  so the total you review is the total you are charged
- **Checkout** — multiple saved addresses with a default, coupon codes, free shipping
  over a threshold, and cash on delivery
- **Orders** — a status timeline, tracking number, and self-service cancellation
  while an order is still pending or confirmed

### Admin panel

- **Dashboard** — revenue, orders, customers and stock at a glance, a revenue line
  chart, top products, revenue by category, low-stock and recent-order widgets, all
  driven by one date range with presets or a custom window
- **Products** — create and edit with a variant matrix generator, multi-image upload
  to Cloudinary, tags, draft/active status, and bulk activate, draft or delete
- **CSV import/export** — Shopify-style one-row-per-variant format, with a downloadable
  template and a dry run that reports what would change before anything is written
- **Categories** — one level of nesting, with product counts and safe deletes
- **Collections** — build curated groups from a product picker
- **Coupons** — percentage or fixed, minimum spend, maximum discount, start and expiry
  dates, total usage cap and a per-customer cap, with a redemption log
- **Orders** — filter by status and date, update status along a legal path only,
  add tracking and internal notes, issue refunds, export to CSV
- **Customers** — search and sort by lifetime value, see a customer's full history,
  grant or revoke admin, block or unblock

### Under the hood

- **Stock is reserved atomically at checkout.** The quantity check is part of the
  update filter, so two customers racing for the last unit cannot both win
- **Prices are always recalculated server-side.** The client sends a coupon code, never
  a discount amount
- **Order status is a state machine** — `pending → confirmed → processing → shipped →
  delivered`, with `cancelled` available until it ships, and terminal states enforced
- **Cancelling returns stock and refunds the coupon use**
- **Auth uses an httpOnly cookie**, so the token is not reachable from JavaScript
- **Input is sanitised** against MongoDB operator injection, and anything reaching a
  `$regex` is escaped
- **CSV exports are guarded** against spreadsheet formula injection

---

## Getting started

### Prerequisites

| Requirement | Notes |
| --- | --- |
| Node.js 20.19+ or 22.12+ | Vite 8 requires this. Check with `node -v` |
| MongoDB | A local install, or a free MongoDB Atlas cluster |
| Cloudinary account | Free tier. Only needed to upload images from the admin panel |

### 1. Clone and install

The frontend and backend are separate packages, so install twice:

```bash
git clone <your-repo-url> shopnest
cd shopnest

cd server && npm install
cd ../client && npm install
```

### 2. Configure the server

Create `server/.env` — see [Environment variables](#environment-variables) for what
goes in it.

### 3. Load demo data

```bash
cd server
npm run data:import
```

### 4. Run both halves

Two terminals, one each:

```bash
# terminal 1
cd server && npm run dev     # http://localhost:5000

# terminal 2
cd client && npm run dev     # http://localhost:5173
```

Open **http://localhost:5173**.

The Vite dev server proxies `/api` and `/uploads` to port 5000, so there is no CORS
setup to do locally.

### 5. Sign in

```
Email:    ayesha@example.com
Password: password123
```

That is a customer account. For admin access see
[Creating an admin account](#creating-an-admin-account).

---

## Environment variables

Create `server/.env`:

```ini
# Server
PORT=5000
NODE_ENV=development

# Database — local, or an Atlas connection string
MONGO_URI=mongodb://127.0.0.1:27017/shopnest

# Any long random string. Changing it signs everyone out.
JWT_SECRET=replace-me-with-a-long-random-string

# Where the frontend runs. Used for CORS.
CLIENT_URL=http://localhost:5173

# Cloudinary — only needed for image uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: which timezone the dashboard groups days by.
# Defaults to the server's own timezone.
REPORT_TIMEZONE=Asia/Karachi
```

**Never commit this file.** It is already in `.gitignore`. If a key ever leaks, rotate
it in the Cloudinary dashboard rather than just deleting the file from a commit.

The client needs no `.env` for local development. For a production build, set
`VITE_API_URL` to the deployed API's origin.

---

## Seeding demo data

```bash
cd server

npm run data:import    # load the demo catalogue
npm run data:destroy   # wipe it again
```

The import gives you:

| Data | Count |
| --- | --- |
| Categories | 28 (parents and subcategories) |
| Collections | 8 |
| Products | 168, many with variants |
| Reviews | 2,622 |
| Orders | 64, spread over past dates so the charts have a shape |
| Demo customers | 10 |

Two things worth knowing. Demo customers are only added if the email is not already
taken, and **your own accounts are never touched** — so re-importing will not delete
the admin you made. Orders are inserted with their original dates so the dashboard's
revenue chart is not a single spike.

There is also a one-off repair script:

```bash
npm run data:backfill
```

This recalculates every product's `unitsSold` from existing orders. Run it once after
a fresh import, or after any manual database edit, so the "Best selling" sort is
accurate. It sets an absolute figure rather than adding to one, so it is safe to
re-run.

---

## Creating an admin account

The seed data deliberately contains no admin, so a public repo cannot hand anyone
admin access. Make your own:

1. Register normally at http://localhost:5173/register
2. Flip the flag on that account in the database:

**MongoDB Compass** — open the `users` collection, find your email, set
`isAdmin` to `true`.

**Shell** — `mongosh`:

```js
use shopnest
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```

3. Sign out and back in. An **Admin** link appears in the account menu, and
   `/admin` becomes reachable.

After that, further admins can be promoted from **Admin → Customers** in the UI.

---

## Available scripts

### `server/`

| Command | What it does |
| --- | --- |
| `npm run dev` | Start with nodemon, restarting on save |
| `npm run data:import` | Load the demo catalogue |
| `npm run data:destroy` | Delete all seeded data |
| `npm run data:backfill` | Recalculate `unitsSold` from orders |

### `client/`

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | Run ESLint over `src/` |

Note that `npm run preview` has no dev proxy, so the API must be reachable at
`VITE_API_URL` for it to work.

---

## Project structure

```
shopnest/
├── client/
│   ├── public/                 # favicon, logo
│   └── src/
│       ├── components/         # shared UI
│       │   └── admin/          # admin-only widgets
│       ├── context/            # auth, cart, wishlist, toast, confirm
│       ├── hooks/              # usePageTitle
│       ├── pages/              # one file per route
│       │   └── admin/          # admin routes
│       ├── utils/              # formatting, uploads, constants
│       ├── App.jsx             # route table
│       ├── index.css           # Tailwind import + theme tokens
│       └── main.jsx            # providers, axios defaults
│
└── server/
    ├── config/                 # db, cloudinary, store constants
    ├── controllers/            # request handlers
    ├── data/                   # seed JSON
    ├── middleware/             # auth, errors, sanitising, rate limits
    ├── models/                 # Mongoose schemas
    ├── routes/                 # route definitions
    ├── scripts/                # one-off maintenance scripts
    ├── utils/                  # helpers: csv, tokens, pagination, regex escaping
    ├── seeder.js
    └── server.js               # entry point
```

---

## API reference

All routes are prefixed with `/api`. Auth travels in an httpOnly `jwt` cookie, so no
`Authorization` header is needed — just send credentials with the request.

**Access key:** 🌐 public · 🔒 signed in · 🛡️ admin

### Users — `/api/users`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/` | 🌐 | Register |
| POST | `/login` | 🌐 | Sign in |
| POST | `/logout` | 🌐 | Clear the cookie |
| GET | `/profile` | 🔒 | Own profile |
| PUT | `/profile` | 🔒 | Update name, email or password |
| GET | `/addresses` | 🔒 | List saved addresses |
| POST | `/addresses` | 🔒 | Add one |
| PUT | `/addresses/:addressId` | 🔒 | Edit one |
| DELETE | `/addresses/:addressId` | 🔒 | Remove one |
| PUT | `/addresses/:addressId/default` | 🔒 | Set the default |

### Products — `/api/products`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/` | 🌐 | List, filter, sort, paginate |
| GET | `/categories` | 🌐 | Distinct category names |
| GET | `/:id` | 🌐 | One product |
| GET | `/:id/related` | 🌐 | Suggestions |
| GET | `/:id/reviews` | 🌐 | Reviews, with a star breakdown |
| POST | `/:id/reviews` | 🔒 | Write a review |
| GET | `/:id/reviews/mine` | 🔒 | Own review, if any |
| POST | `/` | 🛡️ | Create |
| PUT | `/:id` | 🛡️ | Update |
| DELETE | `/:id` | 🛡️ | Delete, with cleanup |
| POST | `/bulk` | 🛡️ | Bulk activate, draft or delete |
| GET | `/export` | 🛡️ | Export CSV |
| GET | `/template` | 🛡️ | Download the import template |
| POST | `/import` | 🛡️ | Import CSV, with a dry-run mode |

Useful query parameters on `GET /`: `keyword`, `category`, `stock`, `onSale`,
`minPrice`, `maxPrice`, `sort`, `pageNumber`, `pageSize`, `includeDrafts`.

### Orders — `/api/orders`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/` | 🔒 | Place an order |
| GET | `/mine` | 🔒 | Own orders |
| GET | `/:id` | 🔒 | One order — owner or admin |
| PUT | `/:id/cancel` | 🔒 | Cancel your own |
| GET | `/` | 🛡️ | All orders, filtered |
| GET | `/export` | 🛡️ | Export CSV |
| PUT | `/:id/status` | 🛡️ | Move along the status machine |
| PUT | `/:id/details` | 🛡️ | Tracking, courier, internal notes |
| PUT | `/:id/refund` | 🛡️ | Mark refunded |

### Everything else

| Prefix | Notes |
| --- | --- |
| `/api/categories` | 🌐 read · 🛡️ write |
| `/api/collections` | 🌐 read (`/:slug`) · 🛡️ write and `/id/:id` |
| `/api/coupons` | 🔒 `POST /validate` · 🛡️ everything else |
| `/api/wishlist` | 🔒 throughout |
| `/api/reviews/:id` | 🔒 delete — owner or admin |
| `/api/dashboard/*` | 🛡️ summary, revenue, top-products, by-category, low-stock, recent-orders |
| `/api/upload` | 🛡️ single and `/multiple`, to Cloudinary |
| `/api/config` | 🌐 shipping price and free-shipping threshold |

---

## Design notes

A few decisions that are not obvious from reading the code:

**Stock is taken when the order is placed, not when it ships.** Accepting an order
means committing the inventory. The quantity check lives inside the update filter,
which makes check-and-decrement a single atomic operation — a separate read then write
would let two customers both buy the last unit.

**Orders snapshot everything.** Name, price, image and variant label are copied onto
the order line. Deleting or re-pricing a product later never rewrites history, which
is why deleting a product does not touch past orders.

**Coupons are stored as text on the order, not as a reference.** The order still reads
correctly after a coupon is deleted or renamed.

**Both a category reference and a category name live on each product.** The reference
supports nesting and parent-includes-children filtering; the denormalised name keeps
string filters and the CSV export simple.

**The dashboard groups days in a configured timezone.** MongoDB's `$dateToString`
defaults to UTC, which puts a 1am order in Karachi on the previous day. `REPORT_TIMEZONE`
controls this.

---

## Troubleshooting

**`ERR_MODULE_NOT_FOUND` on start** — a file an import points at is missing. The path in
the error message is the one to check.

**`DB Error: connect ECONNREFUSED 127.0.0.1:27017`** — MongoDB is not running. Start the
service, or point `MONGO_URI` at Atlas.

**Login succeeds but every other request returns 401** — the `jwt` cookie is not coming
back. Locally, make sure you are on `http://localhost:5173` and not `127.0.0.1:5173`;
the two are different origins to the browser.

**Products show but images do not** — Cloudinary keys are missing or wrong. The
catalogue works without them; uploads do not.

**"Best selling" puts everything in the wrong order** — run `npm run data:backfill`.

**Vite fails to start with an engine warning** — Vite 8 needs Node 20.19+ or 22.12+.
`node -v` to check.

**Port 5000 already in use** — change `PORT` in `.env`, and update the proxy target in
`client/vite.config.js` to match.

---

## Roadmap

Built and working: everything in [Features](#features).

Not built yet:

- Transactional email — order confirmation and shipping notifications
- Password reset
- Guest checkout and order lookup by ID plus email
- Recently viewed products
- Multi-select category filter and search suggestions
- Rule-based collections (currently manual product lists)
- Online payment — cash on delivery only for now

See `ROADMAP.md` for the longer list.

---

## Licence

Built as a learning project. Use it however is useful to you.
