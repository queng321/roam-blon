# Getting Started

## Accessing the Roam-Blón Platform

1. Visit the deployed Roam-Blón website (e.g., `https://roam-blon.vercel.app`)
2. On the landing page, choose one of two options:
   - **Get Started** — instantly enter as a guest tourist (no account needed)
   - **Scan QR Code** — open the camera to scan QR codes at Romblon locations
   - **Admin Login** — for tourism officers only
3. If you clicked **Get Started**, you're immediately redirected to the tourist dashboard — explore destinations, dining, AI chat, maps, and more
4. If you clicked **Scan QR Code**, the camera opens — point at any Roam-Blón QR code to see instant details, reviews, photos, and route maps
5. Only **Admins (Tourism Officers)** create accounts and sign in

---

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge — latest 2 versions)
- Stable internet connection (required for real-time features, maps, AI chat)
- Camera access enabled (for QR code scanning)
- Location access enabled (for route mapping and nearby discovery)
- JavaScript enabled

---

## User Roles

### Tourist (Primary User — No Account Required)
- **No registration, no login** — click "Get Started" to enter instantly as a guest
- **Optional QR scanning** — click "Scan QR Code" to scan physical QR codes at tourist spots, restaurants, and establishments
- **Instant access to all features:**
  - **Destinations Explorer** — beaches, resorts, hotels, falls, landmarks with photos, reviews, QR codes
  - **Dining Hubs** — restaurants, cafés, local eateries with menus and reviews
  - **AI Travel Buddy** — Gemini 2.5 powered chat for itineraries, recommendations, translations (with disclaimer)
  - **Tour Guide Booking** — browse approved guides, select date/time/pax, book with QR confirmation code
  - **Route Maps** — GPS navigation from current location to any destination (Leaflet + OpenStreetMap)
  - **Emergency Hub** — one-tap access to police, coast guard, medical, tourism contacts
  - **Evaluation Survey** — 12-question ISO/IEC 25010 system evaluation (optional)
  - **Tourism Officer Chat** — real-time support via live chat
- **Data stored locally** — preferences, scan history, and booking requests saved in browser localStorage

### Admin / Tourism Officer (Only Account Holder)
1. Click **Admin Login** → sign in with `admin@roam-blon.com` (single authorized account)
2. Upload Admin ID proof during login (required for verification)
3. Access the **Admin Dashboard** with full system control:

| Tab | Capabilities |
|-----|--------------|
| **Overview** | Stats (total tourists, destinations, dining spots, scans), top nationalities, recent activity |
| **Tourists** | View all tourist records (from QR scans), delete records |
| **Destinations** | Add, edit, delete tourist spots (name, description, location, category, images, contact, how to get there) |
| **Dining** | Manage restaurants and cafés |
| **Emergency** | Manage emergency hotlines |
| **Tour Guides** | **Manage tour guides here** — add new guides, edit profiles, toggle availability, approve/decline applications, set rates, specialties, languages, contact info |
| **Bookings** | Monitor all tour guide bookings, update status (approve/decline), remove bookings |
| **Reviews** | View destination/dining reviews and guide ratings, delete inappropriate reviews |
| **Evaluations** | View system evaluation survey responses (Likert-scale analytics) |
| **Chat** | Real-time Tourism Officer chat with tourists (Supabase Realtime) |
| **Analytics** | Scan analytics, visit rankings, charts for destinations and dining |
| **Live Notifications** | Real-time toasts for new bookings, reviews, scans, guide applications |

---

## Tour Guides (Managed by Admin, Not Separate Users)

- **Tour guides do not have separate logins**
- They are **created and managed entirely within the Admin Dashboard → Tour Guides tab**
- Admin adds guide details: name, bio, specialties, languages, rate/day, experience, contact, photo
- Admin toggles **availability** (Available/Unavailable) — controls whether tourists can book them
- Guide bookings appear in **Admin Dashboard → Bookings** and **Tourist's booking confirmation**
- When a tourist books a guide, the admin approves/declines the booking
- Guide ratings/reviews submitted by tourists appear in **Admin Dashboard → Reviews**

---

## QR Code Discovery (Physical Locations)

Every accredited establishment in Romblon displays a **Roam-Blón QR code**. Tourists can:

1. Click **Scan QR Code** on the landing page (no account needed)
2. Allow camera permission
3. Point camera at the QR code
4. Instantly view:
   - Establishment details, photos, contact info
   - Reviews and ratings from other tourists
   - Route map from current location
   - "Book a Tour Guide" button for that destination
   - Menu (for dining) or entrance fees/visiting hours (for destinations)

---

## Key Difference from Traditional Apps

| Feature | Traditional Apps | Roam-Blón |
|---------|------------------|-----------|
| Tourist signup | Required | **Not required** — instant guest access |
| QR scanning | Separate app | **Built-in** — one click from landing |
| Guide booking | Account needed | **Guest booking** — QR confirmation code |
| Guide accounts | Separate logins | **Managed by admin** — no guide login |
| Admin access | Separate portal | **Same app** — single admin login |
| Data privacy | Personal data collected | **Minimal** — only guide bookings need email |