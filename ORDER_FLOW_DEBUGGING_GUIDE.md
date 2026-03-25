# Order Flow Debugging Guide - Order #F53FBA0B

## Complete Order Lifecycle

```
1. CONSUMER CREATES ORDER
   └─ Order created in DB with status: pending, paymentStatus: pending
   └─ Vendor receives Socket.io notification "new_order"

2. CONSUMER PAYS (Paystack redirect)
   └─ Payment verified by callback
   └─ Order updated: orderStatus='confirmed', paymentStatus='paid'
   └─ Vendor receives notification

3. VENDOR MARKS PREPARING (via Dashboard or Orders page)
   └─ Vendor Dashboard > Recent Orders > "Mark Preparing" button
   └─ OR: Vendor Dashboard > Quick Actions > "View Orders" > "Start Preparing"
   └─ Order status changes to: 'preparing'

4. VENDOR MARKS READY (via Dashboard or Orders page)
   └─ Vendor Dashboard > Recent Orders > "Mark Ready" button
   └─ OR: Vendor Orders page > "Mark Ready" button
   └─ Order status changes to: 'ready'

5. RIDER SEES AVAILABLE DELIVERIES
   └─ Rider must be: APPROVED, NOT SUSPENDED, ONLINE
   └─ Rider Dashboard fetches: GET /orders/rider/available
   └─ Query filter: orderStatus='ready' AND riderId=null AND paymentStatus='paid'
   └─ Order appears in list

6. RIDER ACCEPTS DELIVERY
   └─ Rider clicks "Accept Delivery" 
   └─ Order assigned to rider: riderId = rider._id
   └─ Rider Dashboard shows "My Deliveries"

7. RIDER MARKS PICKED UP & DELIVERED
   └─ Status transitions: ready → picked_up → delivered
   └─ Consumer sees real-time updates via Socket.io
```

---

## Debugging Order #F53FBA0B

### Step 1: Check Admin Order Detail View
1. Go to **Admin Dashboard** > **Orders**
2. Search for order ending in **F53FBA0B** (or scroll to find it)
3. Click the order to view full details
4. **Check these fields:**
   - **Order Status**: Should be `ready` (not `pending`, `confirmed`, or `preparing`)
   - **Payment Status**: Should be `paid` (not `pending`)
   - **Rider ID**: Should be empty/null (not assigned yet)

**Expected Values for Rider to See It:**
```
Status Card: ready, paid
No rider assigned yet
```

---

### Step 2: If Status is WRONG

#### Case A: Status is "confirmed" or "pending"
**Problem**: Vendor hasn't clicked the status update buttons yet
**Solution**:
1. Go to **Vendor Dashboard**
2. Find the order in the **Recent Orders** table
3. Click **"Mark Preparing"** button (if status is "confirmed")
4. Then click **"Mark Ready"** button (if status is now "preparing")
5. **Verify**: Go back to Admin, order should now show "ready"

#### Case B: Status is "preparing"
**Problem**: Vendor clicked "Start Preparing" but not "Mark Ready"
**Solution**:
1. Go to **Vendor Dashboard**
2. Find order in **Recent Orders table** (will show "preparing" status)
3. Click **"Mark Ready"** button
4. **Verify**: Admin page should now show "ready"

#### Case C: Status shows "ready" but Admin Override needed
**Problem**: Status update failed silently
**Solution**:
1. In **Admin Order Detail** > Status section
2. Click **"Override Status"** button
3. Type: `ready`
4. Click OK
5. **Verify**: Order detail shows "ready" status

---

### Step 3: Check if Rider Can See It

**Rider Requirements:**
1. ✅ Rider account is **APPROVED** (check Admin > Riders, look for green checkmark)
2. ✅ Rider account is **NOT SUSPENDED** (check Admin > Riders)
3. ✅ Rider is **ONLINE** (Rider Dashboard > toggle "Online" switch)

**To verify:**
1. Log in as **Rider**
2. Go to **Rider Dashboard**
   - Check if "Online" toggle is enabled (should be green)
   - Check if approval status banner shows any errors
   - If shows "Pending Approval" or "Suspended", see **Case D** below

#### Case D: Rider Not Approved
**Problem**: Rider hasn't been approved by admin yet
**Solution**:
1. Log in as **Admin**
2. Go to **Admin Dashboard** > **Riders**
3. Find the rider (search by name if needed)
4. Click rider name to view detail
5. Click **"Approve Rider"** button
6. **Verify**: Rider Dashboard no longer shows approval warning

#### Case E: Rider Suspended
**Problem**: Rider account was suspended
**Solution**:
1. Log in as **Admin**
2. Go to **Admin Dashboard** > **Riders**
3. Find the suspended rider
4. Click **"Unsuspend"** button
5. **Verify**: Rider can now see dashboard without suspension banner

---

### Step 4: Verify Rider Sees Order

**Expected Flow:**
1. Rider logs in
2. Rider Dashboard shows:
   - "Online" toggle is ON (green)
   - No "Pending Approval" or "Suspended" warnings
   - **Available Deliveries** section shows order card for #F53FBA0B
3. Rider clicks **"Accept Delivery"** button
4. Order appears in **"My Deliveries"** section

**If order STILL NOT showing:**
1. Open **Browser DevTools** > **Console**
2. Check for JavaScript errors
3. Open **Network** tab
4. Refresh Rider Dashboard
5. Look for API call: `GET /orders/rider/available`
6. Check the response - does it include the order?

---

### Step 5: Database Query (Debug Logging)

The server has debug logging enabled. Check server logs:

```
📊 Order Stats: Total=X, Ready for delivery=Y, Confirmed=Z
```

**What this means:**
- `Total=5`: 5 orders in database for this vendor
- `Ready for delivery=1`: Only 1 order is in ready state and unassigned
- `Confirmed=2`: 2 orders are still in confirmed state (not yet ready)

**If Ready count is 0:**
- Order #F53FBA0B is NOT actually in "ready" status
- Vendor hasn't clicked the buttons yet
- OR payment verification failed silently

---

## Quick Checklist

Use this checklist to diagnose the issue:

```
☐ Step 1: Check Admin > Orders > Order #F53FBA0B
  ☐ Order Status = "ready"? 
  ☐ Payment Status = "paid"?
  ☐ Rider ID = null/empty?
  
  ☐ If NOT "ready":
    ☐ Go to Vendor Dashboard
    ☐ Mark order as "preparing" → "ready"
    
☐ Step 2: Check Rider Status
  ☐ Admin > Riders > Find rider
  ☐ Is approved? (green checkmark)
  ☐ Is NOT suspended? (no red warning)
  
  ☐ If not approved:
    ☐ Admin clicks "Approve Rider"
    
☐ Step 3: Check Rider Dashboard
  ☐ Online toggle = ON?
  ☐ No approval/suspension warnings?
  ☐ "Available Deliveries" list shows #F53FBA0B?
  
  ☐ If no orders shown:
    ☐ Check browser console for errors
    ☐ Check Network tab > GET /orders/rider/available response
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Order shows "confirmed" on admin | Vendor hasn't updated status | Vendor: Click "Mark Preparing" → "Mark Ready" |
| Order shows "ready" but rider doesn't see it | Rider not approved or suspended | Admin: Find rider, click "Approve" |
| Order shows "ready" but rider sees empty list | Rider is offline | Rider: Toggle "Online" switch ON |
| Rider sees no orders AND gets "Pending Approval" | Rider account not approved yet | Admin: Approve the rider account |
| No orders in rider list despite ready orders existing | Multiple issues possible | Run through checklist above |

---

## How to Test End-to-End

**Scenario: Test complete order flow**

```
1. CONSUMER
   ✅ Log in as consumer
   ✅ Place order from vendor
   ✅ Proceed to payment page (redirects to Paystack)
   ✅ Use Paystack test card (demo credentials)
   ✅ Confirm payment
   ✅ Should redirect back to app

2. VENDOR
   ✅ Log in as vendor
   ✅ Go to Dashboard
   ✅ Check "Recent Orders" shows new order
   ✅ Click "Mark Preparing" button
   ✅ Click "Mark Ready" button
   ✅ Verify order status changes in table

3. ADMIN (optional verification)
   ✅ Log in as admin
   ✅ Go to Orders > find order
   ✅ Verify status is "ready"
   ✅ Verify Payment status is "paid"

4. RIDER
   ✅ Log in as rider
   ✅ Check approval status (should be approved)
   ✅ Click Online toggle (should turn green)
   ✅ Check "Available Deliveries" list
   ✅ Order should appear in list
   ✅ Click "Accept Delivery" button
   ✅ Order moves to "My Deliveries"
   ✅ Click "Picked Up" then "Delivered"

5. CONSUMER (final verification)
   ✅ Log in as consumer
   ✅ Go to "My Orders"
   ✅ Order should show "delivered" status
   ✅ See real-time updates as rider marks statuses
```

---

## API Endpoints Reference

| Method | Endpoint | Role | Data |
|--------|----------|------|------|
| PATCH | `/orders/:id/status` | Vendor/Rider/Admin | `{ status: 'ready' }` |
| GET | `/orders/rider/available` | Rider | Returns `[orders...]` with status='ready' |
| GET | `/orders/:id` | Any | Returns full order detail |
| GET | `/admin/orders/:id` | Admin | View order with override option |
| PATCH | `/admin/orders/:id/status` | Admin | Force status change |

---

## Socket.io Events

Real-time updates use these events:

```javascript
// Vendor receives new order notification
socket.on('new_order', (order) => ...)

// Rider gets notified when order is assigned
socket.on('rider_assigned', ({ riderId }) => ...)

// Consumer gets real-time status updates
socket.on('order_status_update', ({ orderId, status }) => ...)
```

---

## Next Steps

1. **Immediate**: Use the checklist above to identify which step is failing
2. **Document findings**: Note the current status of order #F53FBA0B
3. **Fix**: Follow the appropriate solution from "Common Issues" table
4. **Verify**: Confirm order appears on rider dashboard and test full flow

---

## Support

If still stuck, collect this info:
- ✅ Screenshots of Admin Order Detail (showing exact status values)
- ✅ Screenshot of Rider Dashboard (showing warning/error messages)
- ✅ Server console logs (copy output from terminal showing debug logs)
- ✅ Browser console errors (open DevTools, check Console tab for red errors)
