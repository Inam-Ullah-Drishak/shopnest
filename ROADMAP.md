# ShopNest — Feature Roadmap

MERN e-commerce store. Portfolio project.

**Stack:** MongoDB (local → Atlas), Express 5, React 19 + Vite, Tailwind v4, JWT in httpOnly cookies.

Legend: `[x]` done · `[ ]` planned

---

## Phase 0 — Foundation ✅ COMPLETE

### Backend
- [x] Express server + nodemon
- [x] MongoDB connection (local)
- [x] Environment variables (dotenv)
- [x] CORS with credentials
- [x] Product model
- [x] Database seeder script

### Products
- [x] List all products
- [x] Get single product
- [x] Search by keyword (case-insensitive regex)
- [x] Filter by category
- [x] Pagination (8 per page)
- [x] Categories endpoint

### Auth
- [x] User model with bcrypt hashing
- [x] Register
- [x] Login
- [x] Logout
- [x] JWT in httpOnly cookie
- [x] `protect` middleware
- [x] `admin` middleware
- [x] Profile endpoint

### Cart & Checkout
- [x] Cart context with localStorage persistence
- [x] Add / update quantity / remove
- [x] Shipping address form
- [x] Order review page
- [x] Place order (server-side price recalculation)
- [x] Order confirmation page
- [x] My orders list

### Admin
- [x] Product list table
- [x] Create product (blank draft)
- [x] Edit product
- [x] Delete product
- [x] Order list
- [x] Mark delivered (decrements stock atomically)

### Frontend
- [x] React Router
- [x] Tailwind v4
- [x] Header with cart badge + auth state
- [x] Product grid + cards
- [x] Admin nav
- [x] URL-based filter state (shareable links)

---

## Phase 1 — Images

- [ ] Multer upload endpoint (admin only)
- [ ] File type + size validation
- [ ] Serve `/uploads` statically
- [ ] Image field in admin edit form
- [ ] Live upload preview
- [ ] Multiple images per product
- [ ] Set primary image
- [ ] Reorder images
- [ ] Product page gallery with thumbnails
- [ ] Real images on cards, cart, orders
- [ ] Placeholder fallback for missing images
- [ ] Delete file from disk when image removed

## Phase 2 — Product Variants ⚠️ hardest phase

- [ ] Variant sub-schema (size, colour, price, stock, SKU)
- [ ] Option types on product (e.g. Size: S/M/L)
- [ ] Auto-generate variant combinations
- [ ] Per-variant price override
- [ ] Per-variant stock
- [ ] Admin variant editor table
- [ ] Variant selector on product page
- [ ] Disable out-of-stock combinations
- [ ] Price updates on selection
- [ ] Cart stores variant, not just product
- [ ] Same product + different variant = separate cart lines
- [ ] Order items store variant snapshot
- [ ] Stock decrements the correct variant
- [ ] Price range display ("Rs 1200 – 1800")

## Phase 3 — Reviews & Ratings

- [ ] Review sub-schema
- [ ] Submit review (1–5 stars + comment)
- [ ] One review per user per product
- [ ] Verified purchase check (must have a delivered order)
- [ ] Average rating + review count on product
- [ ] Star component
- [ ] Ratings on cards and product page
- [ ] Review list with pagination
- [ ] Edit / delete own review
- [ ] Admin can delete any review
- [ ] Sort products by rating
- [ ] Filter by minimum rating

## Phase 4 — Discounts

- [ ] Coupon model
- [ ] Percentage and fixed-amount types
- [ ] Minimum order value
- [ ] Expiry date
- [ ] Total usage limit
- [ ] Per-user usage limit
- [ ] Active / inactive toggle
- [ ] Validate endpoint (server-side only)
- [ ] Apply at checkout
- [ ] Discount stored on order
- [ ] Admin coupon CRUD
- [ ] Usage stats per coupon
- [ ] Optional: restrict to categories or products

## Phase 5 — Order Pipeline & Inventory

- [ ] Replace booleans with status enum (pending → confirmed → processing → shipped → delivered → cancelled)
- [ ] Status history with timestamps
- [ ] Admin status dropdown
- [ ] Customer cancels while pending
- [ ] Restock on cancellation
- [ ] Refund flag + notes
- [ ] Tracking number field
- [ ] Order timeline UI for customer
- [ ] Low stock threshold per product
- [ ] Low stock badge in admin
- [ ] Out-of-stock products hidden or marked
- [ ] Reserve stock at order time (prevent overselling)
- [ ] Order notes (internal, admin only)
- [ ] Filter orders by status / date / customer
- [ ] Invoice as printable PDF

## Phase 6 — Discovery & Wishlist

- [ ] Wishlist model
- [ ] Add / remove from wishlist
- [ ] Heart icon on cards
- [ ] Wishlist page
- [ ] Move wishlist item to cart
- [ ] Collections model (curated product groups)
- [ ] Manual and rule-based collections
- [ ] Collection pages
- [ ] Featured collection on home page
- [ ] Sort: newest / price asc / price desc / rating / best selling
- [ ] Price range filter
- [ ] In-stock-only filter
- [ ] Multi-select category filter
- [ ] Related products on product page
- [ ] Recently viewed
- [ ] Search suggestions dropdown

## Phase 7 — Analytics Dashboard

- [ ] Aggregation: total revenue
- [ ] Aggregation: revenue by day / week / month
- [ ] Aggregation: order count by status
- [ ] Aggregation: best-selling products
- [ ] Aggregation: revenue by category
- [ ] Aggregation: new customers over time
- [ ] Average order value
- [ ] Date range picker
- [ ] Recharts line chart (revenue)
- [ ] Recharts bar chart (top products)
- [ ] Recharts pie chart (category split)
- [ ] KPI summary cards
- [ ] Low stock widget
- [ ] Recent orders widget
- [ ] Export CSV

## Phase 8 — Customers, Email & Guest Checkout

- [ ] Admin customer list
- [ ] Customer detail (orders, lifetime value)
- [ ] Toggle admin role
- [ ] Block / unblock customer
- [ ] Update own profile (name, email, password)
- [ ] Multiple saved addresses
- [ ] Default address
- [ ] Nodemailer setup (Gmail app password)
- [ ] Order confirmation email
- [ ] Shipping notification email
- [ ] Password reset flow (token + expiry)
- [ ] Guest checkout (order without account)
- [ ] Order lookup by ID + email
- [ ] Merge guest cart on login

## Phase 9 — Quality & Deploy

### Code quality
- [ ] Global error-handling middleware (remove repeated try/catch)
- [ ] `asyncHandler` wrapper
- [ ] 404 handler
- [ ] Input validation (express-validator or zod)
- [ ] Rate limit on auth routes
- [ ] Helmet security headers
- [ ] Consistent API response shape

### UX
- [ ] Loading skeletons instead of "Loading..."
- [ ] Toast notifications (react-hot-toast)
- [ ] Reusable Message / Loader / Modal components
- [ ] Replace `window.confirm` with real modals
- [ ] Form validation feedback
- [ ] Empty states for every list
- [ ] Mobile check on every page
- [ ] Footer
- [ ] 404 page
- [ ] Page titles
- [ ] Favicon + logo

### Deploy
- [ ] MongoDB Atlas free tier
- [ ] Cloudinary for images
- [ ] Backend on Render
- [ ] Frontend on Vercel
- [ ] Production env vars
- [ ] `sameSite: none` + `secure: true` for cross-domain cookies
- [ ] Seed demo data
- [ ] README with screenshots, features, setup, demo credentials
- [ ] Demo admin + customer accounts

---

## Deliberately out of scope

Real payment processing (Stripe test mode only), multi-vendor marketplace, multi-currency, multi-language, tax engine, live shipping rates, real-time chat, mobile app, microservices, Shopify's theme system.

---

## Notes to self

- Never trust prices from the client — always recalculate server-side from the database.
- `isAdmin` checks in React only hide UI; the middleware is the real guard.
- Use `$inc` for stock, never read-modify-write.
- Store price and name snapshots on order items so history doesn't change.
- Commit after each feature, not at the end of the day.
