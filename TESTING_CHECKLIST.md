# 🧪 NorthEats Testing Checklist

## Pre-Test Setup ✅

- [ ] MongoDB running (local or Atlas connection in .env)
- [ ] Backend `.env` configured with all secrets
- [ ] Frontend `.env` configured with API URLs
- [ ] Backend server started (`npm run dev` on port 5000)
- [ ] Frontend server started (`npm run dev` on port 5173)
- [ ] Browsers ready (Chrome/Firefox for testing)

---

## 1️⃣ LANDING PAGE (`http://localhost:5173/`)

- [ ] Page loads without errors
- [ ] All 13 sections visible:
  - [ ] Hero with state selector
  - [ ] How It Works (3-step process)
  - [ ] Featured Cities cards
  - [ ] Popular Categories grid
  - [ ] Top Vendors carousel
  - [ ] Trending Foods grid
  - [ ] Promo Banner animated
  - [ ] App Features blocks
  - [ ] Testimonials carousel
  - [ ] Vendor CTA section
  - [ ] Rider CTA section
  - [ ] Stats Bar with counters
  - [ ] Footer with links
- [ ] Framer Motion animations play smoothly
- [ ] Responsive on mobile (375px viewport)
- [ ] "Order Now" button routes to `/auth`
- [ ] "Become a Vendor" button routes to `/auth`

---

## 2️⃣ AUTHENTICATION (`http://localhost:5173/auth`)

### Register Flow
- [ ] Form accepts email, name, phone, password, address
- [ ] Role selection (Consumer, Vendor, Rider)
- [ ] State selection (Plateau, Bauchi, Kaduna)
- [ ] LGA selection appears based on state
- [ ] Password validation (min 6 chars)
- [ ] Submit creates user account
- [ ] JWT token stored in localStorage
- [ ] Redirects to appropriate dashboard based on role

### Login Flow
- [ ] Login with valid credentials works
- [ ] Token stored in httpOnly cookie
- [ ] Invalid credentials shows error toast
- [ ] "Forgot Password" link (placeholder)
- [ ] Login redirects to role-appropriate page

---

## 3️⃣ CONSUMER FLOW

### Consumer Home (`/home`)
- [ ] Page loads vendor list
- [ ] State/LGA filters work
- [ ] Category filter displays all options
- [ ] Search bar filters vendors
- [ ] Vendor cards show:
  - [ ] Cover image
  - [ ] Logo
  - [ ] Name & rating
  - [ ] Delivery fee & ETA
  - [ ] Open/Closed badge
- [ ] Clicking vendor navigates to menu page
- [ ] Cart icon shows item count
- [ ] User avatar in navbar

### Vendor Menu Page (`/vendor/:id`)
- [ ] Cover image displays
- [ ] Vendor logo overlays
- [ ] Sticky category tabs work (scroll-spy)
- [ ] Food items show:
  - [ ] Image
  - [ ] Name, description, price
  - [ ] Add to Cart button
- [ ] Add to Cart updates cart count
- [ ] Cart sidebar/drawer appears
- [ ] Remove from cart works
- [ ] Cart persists in Zustand store

### Checkout (`/checkout`)
- [ ] Order summary shows all items
- [ ] Delivery address input appears
- [ ] LGA dropdown populated from selected state
- [ ] Delivery fee calculated correctly
- [ ] Subtotal + Delivery Fee = Total
- [ ] Paystack button appears
- [ ] Paystack modal opens (test mode)
- [ ] Payment reference captured
- [ ] Order created with status "pending"
- [ ] Redirects to order tracking

### My Orders (`/orders`)
- [ ] Shows all consumer's past orders
- [ ] Order cards display:
  - [ ] Order ID
  - [ ] Vendor name
  - [ ] Order total
  - [ ] Order status
  - [ ] Date placed
- [ ] Click order navigates to tracking

### Order Tracking (`/orders/:id`)
- [ ] Progress stepper shows:
  - [ ] Placed → Confirmed → Preparing → Ready → Picked Up → Delivered
- [ ] Current step highlighted
- [ ] Rider info appears (name, phone, vehicle)
- [ ] Leaflet map displays (with or without live location)
- [ ] ETA countdown visible
- [ ] Socket.IO receives real-time updates
- [ ] Status changes reflect immediately

---

## 4️⃣ VENDOR FLOW

### Vendor Dashboard (`/vendor/dashboard`)
- [ ] Welcome message with vendor name
- [ ] Stats cards show:
  - [ ] Total Orders
  - [ ] Today's Orders
  - [ ] Revenue (NGN formatted)
  - [ ] Average Rating
- [ ] Weekly earnings chart renders (Recharts)
- [ ] Open/Close toggle works
  - [ ] Changes status in real-time
  - [ ] Toast confirms action
- [ ] New Order notifications appear via Socket.IO
- [ ] Live order queue updates in real-time
- [ ] Accept/Reject buttons work

### Menu Manager (`/vendor/menu`)
- [ ] List shows all vendor's food items
- [ ] Add Item form appears
- [ ] Image upload to Cloudinary works
- [ ] Edit existing items
- [ ] Delete items with confirmation
- [ ] Availability toggle works
- [ ] Category selection functions
- [ ] Pricing in NGN displayed correctly

### Vendor Orders (`/vendor/orders`)
- [ ] All vendor's orders listed
- [ ] Filters by status work
- [ ] Accept order updates status to "confirmed"
- [ ] Reject shows reason prompt
- [ ] Order timeline shows progression
- [ ] Customer info visible (name, phone, address)

---

## 5️⃣ RIDER FLOW

### Rider Dashboard (`/rider/dashboard`)
- [ ] Page loads successfully
- [ ] Online/Offline toggle works
  - [ ] Green indicator when online
  - [ ] Gray indicator when offline
- [ ] When online, available deliveries list shows:
  - [ ] Pickup location (vendor name)
  - [ ] Drop-off location
  - [ ] Distance estimate
  - [ ] Earnings amount (NGN)
- [ ] Accept Delivery button works
  - [ ] Removes from available list
  - [ ] Adds to active deliveries
- [ ] Active delivery shows:
  - [ ] Customer details
  - [ ] Full address
  - [ ] Items to deliver
  - [ ] Step controls (Picked Up → Delivered)
- [ ] Mark as Delivered completes order
- [ ] Earnings summary visible
- [ ] Real-time Socket.IO updates

---

## 6️⃣ ADMIN DASHBOARD (`http://localhost:5173/admin`)

### Admin Login (`/admin/login`)
- [ ] Email field works
- [ ] Password field (with show/hide toggle)
- [ ] Login with `admin@northeats.com` / `Admin@NorthEats2026`
- [ ] Redirects to `/admin` overview
- [ ] Non-admin users blocked from access

### Overview (`/admin`)
- [ ] All 6 KPI cards display
  - [ ] Total Orders
  - [ ] Total Revenue (NGN formatted)
  - [ ] Active Vendors
  - [ ] Active Riders
  - [ ] Registered Consumers
  - [ ] Pending Approvals
- [ ] 4 Recharts visualizations:
  - [ ] Daily Orders (line chart, 30 days)
  - [ ] Revenue by State (bar chart)
  - [ ] Orders by Status (pie chart with colors)
  - [ ] User Signups (area chart)
- [ ] Recent Orders table shows latest 10
- [ ] Recent Vendors table shows pending approvals
- [ ] Quick action buttons work

### Vendors List (`/admin/vendors`)
- [ ] All vendors display in table
- [ ] Filters:
  - [ ] By Status (All, Pending, Approved, Suspended)
  - [ ] By State (Plateau, Bauchi, Kaduna)
  - [ ] By Search (business name)
- [ ] Approve button visible for pending vendors
- [ ] Suspend button visible for approved vendors
- [ ] Unsuspend button visible for suspended vendors
- [ ] Actions work and update table
- [ ] Pagination works (prev/next)

### Vendor Detail (`/admin/vendors/:id`)
- [ ] Full vendor profile displays
- [ ] Logo and cover image show
- [ ] Business info visible:
  - [ ] Location (LGA, State)
  - [ ] Phone, Email
  - [ ] Menu items count
- [ ] Status badge shows correct state
- [ ] Action buttons:
  - [ ] Approve (for pending)
  - [ ] Suspend (for approved)
  - [ ] Unsuspend (for suspended)
- [ ] Recent orders list shows vendor's orders
- [ ] Revenue stats calculate correctly
- [ ] Back button works

### Pending Approvals (`/admin/vendors/pending`)
- [ ] Shows only pending vendors
- [ ] Approve button does quick approval
- [ ] Reject shows reason input
- [ ] Page updates after action
- [ ] Flash toast confirms action

### Riders List (`/admin/riders`)
- [ ] All riders display
- [ ] Filters by Status, State
- [ ] Approve button for pending riders
- [ ] Suspend button for approved riders
- [ ] Columns show:
  - [ ] Name
  - [ ] Vehicle type
  - [ ] State/LGA
  - [ ] Total deliveries
  - [ ] Rating
  - [ ] Status badge
- [ ] Pagination works

### Rider Detail (`/admin/riders/:id`)
- [ ] Rider profile displays
- [ ] Avatar with initials
- [ ] Basic info (name, phone, email)
- [ ] Stats:
  - [ ] Total Deliveries
  - [ ] Total Earnings (NGN)
- [ ] Action buttons:
  - [ ] Approve (if pending)
  - [ ] Suspend (if active)
  - [ ] **Unsuspend** ✅ NEW (if suspended)
- [ ] Details section shows:
  - [ ] Vehicle type
  - [ ] State/LGA
  - [ ] Online status
  - [ ] Average rating
  - [ ] Bank info (if provided)
  - [ ] Registration date

### Consumers List (`/admin/consumers`)
- [ ] All consumers displayed
- [ ] Search by name/email works
- [ ] Table shows:
  - [ ] Name
  - [ ] Email/Phone
  - [ ] State
  - [ ] Total Orders
  - [ ] Total Spent (NGN formatted)
  - [ ] Registration date
- [ ] Suspend button works (with reason)
- [ ] Unsuspend button appears for suspended users
- [ ] Pagination functional

### Orders List (`/admin/orders`)
- [ ] All platform orders display
- [ ] Advanced filters:
  - [ ] By State
  - [ ] By Order Status (6 states)
  - [ ] By Payment Status (3 states)
  - [ ] By Date Range (from/to)
- [ ] Table shows:
  - [ ] Order ID (short format)
  - [ ] Consumer name
  - [ ] Vendor name
  - [ ] Rider name (if assigned)
  - [ ] Amount (NGN, orange accent)
  - [ ] Payment Status badge
  - [ ] Order Status badge
  - [ ] Date
- [ ] Click row navigates to order detail
- [ ] Pagination works

### Order Detail (`/admin/orders/:id`)
- [ ] Order breakdown displays
- [ ] Items list with:
  - [ ] Item image
  - [ ] Name × quantity
  - [ ] Unit price & total
- [ ] Cost breakdown:
  - [ ] Subtotal
  - [ ] Delivery fee
  - [ ] **Total** (highlighted in orange)
- [ ] Status section:
  - [ ] Order status badge
  - [ ] Payment status badge
  - [ ] Override Status button
  - [ ] Refund button (if paid)
- [ ] People cards show:
  - [ ] Consumer info
  - [ ] Vendor info
  - [ ] Rider info (if assigned)
- [ ] Back button works

### Transactions (`/admin/payments`)
- [ ] Revenue summary cards:
  - [ ] Gross Revenue (green)
  - [ ] Platform Commission 10% (blue)
  - [ ] Paystack Fees est. 1.5% (orange)
  - [ ] Net Payout (purple)
- [ ] Filters work:
  - [ ] By State
  - [ ] By Payment Status
  - [ ]  By Date Range
- [ ] Export CSV button downloads file
- [ ] Table shows:
  - [ ] Payment Reference
  - [ ] Consumer name
  - [ ] Vendor name
  - [ ] Amount, Delivery Fee
  - [ ] Channel (Paystack, etc.)
  - [ ] Payment Status badge
  - [ ] Date
- [ ] Pagination functional

### Review Moderation (`/admin/reviews`)
- [ ] Reviews display as cards
- [ ] Filter: Show flagged only toggle
- [ ] Review cards show:
  - [ ] Consumer avatar
  - [ ] Rating (stars)
  - [ ] Comment text (limited lines)
  - [ ] Target type (vendor/rider)
  - [ ] Date posted
- [ ] Delete button removes review
- [ ] Flagged indicator visible on flagged reviews
- [ ] Popup pagination works

### Promotions Manager (`/admin/promotions`)
- [ ] Existing promotions list displays
- [ ] Add Promotion button opens modal
- [ ] Form fields:
  - [ ] Title input
  - [ ] Description
  - [ ] Image upload (drag & drop works)
  - [ ] Discount Type (% or flat NGN)
  - [ ] Discount Value
  - [ ] State selection (checkboxes)
  - [ ] Valid Until date
  - [ ] Promo Code input
- [ ] Save creates/updates promotion
- [ ] Edit button prefills form
- [ ] Delete button removes with confirmation
- [ ] Inactive toggle works
- [ ] Toast confirms actions

### Platform Settings (`/admin/settings`)
- [ ] Commission rate input works
- [ ] Support contact fields:
  - [ ] Phone
  - [ ] Email
- [ ] Maintenance Mode toggle
- [ ] Delivery Fees table by LGA:
  - [ ] Each state section
  - [ ] LGA rows with fee input
  - [ ] Add new LGA button
  - [ ] Delete LGA button
- [ ] Save Settings button persists changes
- [ ] Toast confirms save

---

## 7️⃣ RESPONSIVE DESIGN

### Mobile Testing (375px - 640px)
- [ ] Landing page responsive
- [ ] Admin sidebar collapses to hamburger
- [ ] All tables convert to scrollable cards
- [ ] Buttons remain clickable
- [ ] Forms stack vertically
- [ ] Images scale properly

### Tablet Testing (640px - 1024px)
- [ ] Two-column layouts work
- [ ] Admin sidebar still visible
- [ ] Tables partially visible with scroll

### Desktop Testing (1024px+)
- [ ] Full layouts as designed
- [ ] All columns visible
- [ ] Animations smooth

---

## 8️⃣ REAL-TIME FEATURES (via Socket.IO)

- [ ] Vendor receives "new_order" notification in real-time
- [ ] Consumer sees order status updates live
- [ ] Rider location broadcasts to order consumers
- [ ] Multiple admin tabs reflect updates simultaneously
- [ ] No page refresh needed for live data

---

## 9️⃣ ERROR HANDLING

- [ ] Network error shows toast
- [ ] 401 Unauthorized triggers re-login
- [ ] 404 Not Found handled gracefully
- [ ] Form validation prevents invalid submissions
- [ ] Duplicate email on registration blocked
- [ ] Empty cart checkout blocked
- [ ] Suspended users cannot access platform

---

## 🔟 PERFORMANCE

- [ ] Page load time < 3 seconds
- [ ] Images lazy-loaded
- [ ] Chart rendering smooth (Recharts)
- [ ] Animation frame rate 60fps
- [ ] No console errors
- [ ] No memory leaks on navigation
- [ ] CSV export completes in < 5 seconds

---

## 1️⃣1️⃣ BROWSER COMPATIBILITY

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## TEST DATA CREATION

### Create Test Admin
```bash
cd northeats/server
node scripts/seedAdmin.js
```

### Create Test Vendors
```javascript
// POST /api/auth/register
{
  "name": "Test Vendor",
  "email": "vendor@test.com",
  "phone": "+234900000001",
  "password": "Test@1234",
  "role": "vendor",
  "address": "123 Main St",
  "state": "plateau",
  "lga": "Jos North",
  "businessName": "Test Restaurant",
  "description": "A quality test restaurant"
}
```

### Create Test Consumers
```javascript
// POST /api/auth/register
{
  "name": "John Consumer",
  "email": "consumer@test.com",
  "phone": "+234900000002",
  "password": "Test@1234",
  "role": "consumer",
  "address": "456 Oak Ave",
  "state": "kaduna",
  "lga": "Kaduna North"
}
```

### Create Test Riders
```javascript
// POST /api/auth/register
{
  "name": "James Rider",
  "email": "rider@test.com",
  "phone": "+234900000003",
  "password": "Test@1234",
  "role": "rider",
  "state": "bauchi",
  "lga": "Bauchi Metro",
  "vehicleType": "motorcycle"
}
```

---

## ✅ FINAL SIGN-OFF

When all checkboxes are marked, the NorthEats platform is **production-ready**!

- [ ] All tests passed
- [ ] No critical bugs found
- [ ] Admin fully functional
- [ ] Consumer flow smooth
- [ ] Vendor tools working
- [ ] Rider app responsive
- [ ] Real-time features active
- [ ] Performance acceptable
- [ ] Mobile-friendly
- [ ] Error handling robust

**Date Tested**: _______________  
**Tested By**: _______________  
**Status**: _______________

---

## Bug Report Template

If issues are found:

```
### Bug Title
[Clear, concise title]

### Page/Feature
[Which page or feature]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Result
[What should happen]

### Actual Result
[What actually happens]

### Browser/Device
[Chrome, Safari, iPhone X, etc.]

### Screenshot/Console Error
[Paste error message or screenshot]

### Severity
[Critical / High / Medium / Low]
```

---

**Happy Testing! 🚀**
