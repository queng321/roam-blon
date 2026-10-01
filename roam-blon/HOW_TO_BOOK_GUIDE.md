# How to Book a Tour Guide (Step-by-Step)

## For Tourists (No Account Required)

### Option 1: From the Main Dashboard
1. Click **"Get Started"** on the landing page (enters as guest)
2. Click **"Tourist Destinations"** button or go to `/destinations`
3. Click **"Book a Tour Guide"** bell icon (top-right) or the "Book a Tour Guide" button on any destination card
4. Browse available guides (shows photo, name, specialties, languages, rate/day, availability badge)
5. Click **"Book This Guide"** on your chosen guide
6. Fill in booking details:
   - **Tour Date** (calendar picker)
   - **Time** (optional)
   - **Day of Tour** (Day 1, Day 2, Day 3, Multi-Day)
   - **Destinations** (e.g., "Bonbon Beach, Fort San Andres")
   - **Number of People** (pax)
   - **Special Requests** (optional notes for the guide)
7. Click **"Confirm Booking"**
8. Receive **QR code with reference code** (e.g., `RB-A1B2C3`) — show this to your guide

### Option 2: From a Specific Destination (QR Modal)
1. On any destination card, click **"View Details"** (eye icon)
2. In the modal, click **"Book a Tour Guide"** button
3. Same booking form opens with that destination pre-filled
4. Complete steps 6–8 above

### Option 3: Scan a Physical QR Code
1. Click **"Scan QR Code"** on landing page
2. Allow camera permission
3. Scan any Roam-Blón QR code at a tourist spot
3. In the modal, click **"Book a Tour Guide"**
4. Complete steps 6–8 above

---

## What Happens After Booking

| Step | Description |
|------|-------------|
| **1. Pending** | Booking saved locally + sent to Supabase; admin receives real-time notification |
| **2. Admin Review** | Tourism officer sees booking in Admin Dashboard → Bookings tab |
| **3. Approve/Decline** | Admin clicks **Approve** (guide becomes unavailable for that date) or **Decline** (with reason) |
| **4. Notification** | You see status update in real-time; guide gets notified |
| **5. Tour Day** | Show QR code to guide; they verify your reference code |
| **6. After Tour** | Rate your guide (1–5 stars + comment) via "My Bookings" |

---

## For Admin (Tourism Officer)

1. Sign in at **Admin Login** with `admin@roam-blon.com`
2. Go to **Bookings** tab
3. See all pending bookings with tourist name, guide, date, pax, price
4. Click **Approve** → guide marked unavailable for that date; tourist and guide notified
5. Click **Decline** → enter reason; tourist notified
6. All changes sync instantly via Supabase Realtime

---

## For Tour Guides

- **No separate login needed** — guides are managed by admin
- Admin adds you in **Admin Dashboard → Tour Guides**
- When a tourist books you, admin approves → you receive the booking details
- Guide availability is toggled by admin (Available/Unavailable badge)

---

## Key Points

- **No tourist account required** — works as guest
- **QR confirmation code** = your booking proof (save/screenshot it)
- **Real-time updates** — status changes appear instantly
- **Admin controls everything** — guides, bookings, availability
- **Offline fallback** — bookings saved to localStorage if network fails