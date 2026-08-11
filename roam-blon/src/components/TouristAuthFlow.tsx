"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, Compass, Sparkles, Eye, EyeOff } from "lucide-react";

/* Only this single account may access the admin panel */
const ADMIN_EMAIL = "admin@roam-blon.com";

/* ─── TYPES & INTERFACES ─────────────────────────────────────────────────────── */

interface TouristData {
  email: string;
  gender: string;
  age: string;
  nationality: string;
  country: string;
  adminIdProof?: string;
}

type Role = "admin" | "tourist" | "tour_guide" | "";

type Screen =
  | "landing"
  | "rolePicker"
  | "signin"
  | "signup"
  | "gender"
  | "age"
  | "nationality"
  | "welcome";

interface StepTrackerProps {
  current: number;
  total: number;
  labels: string[];
}

interface ScreenLandingProps {
  onTourist: () => void;
  onAdmin: () => void;
  onScanQR: () => void;
}

interface ScreenRolePickerProps {
  onSelectRole: (role: Role) => void;
  onBack: () => void;
}

interface ScreenSignInProps {
  role: Role;
  onNext: (payload: { email: string; existingProfile: any; adminIdProof?: string }) => void;
  onGoSignUp: () => void;
  errorMessage?: string;
}

interface ScreenSignUpProps {
  role: Role;
  onNext: (payload: { email: string; existingProfile: any; adminIdProof?: string }) => void;
  onGoSignIn: () => void;
}

interface ScreenGenderProps {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ScreenAgeProps {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ScreenNationalityProps {
  nationality: string;
  country: string;
  onChangeNat: (val: string) => void;
  onChangeCountry: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
}

interface ScreenWelcomeProps {
  tourist: TouristData;
  role: Role;
  onExplore: () => void;
}

/* ─── DESIGN TOKENS ─────────────────────────────────────────────────────────── */
const C = {
  bg: "#f5ede8",
  white: "#ffffff",
  navy: "#1a2236",
  coral: "#e05a6b",
  coralLight: "#fce8ea",
  gray: "#8a919e",
  grayLight: "#ddd0ca",
  green: "#22c55e",
  cardShadow: "0 12px 40px rgba(26,34,54,0.12)",
};

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "40px 16px 60px",
    fontFamily: "'Georgia', serif",
    position: "relative",
    overflowY: "auto",
    overflowX: "hidden",
  },
  card: {
    background: C.white,
    borderRadius: "28px",
    padding: "40px 32px",
    boxShadow: C.cardShadow,
    width: "100%",
    maxWidth: "460px",
    boxSizing: "border-box",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: C.gray,
    marginBottom: "8px",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "14px",
    border: `1.5px solid ${C.grayLight}`,
    background: "#fdf9f7",
    color: C.navy,
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  btnPrimary: {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: "none",
    background: C.navy,
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    letterSpacing: "0.05em",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  btnOutline: {
    padding: "15px 24px",
    borderRadius: "16px",
    border: `1.5px solid ${C.grayLight}`,
    background: "transparent",
    color: C.navy,
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  btnSecondary: {
    width: "100%",
    padding: "15px",
    borderRadius: "16px",
    border: `1.5px solid ${C.grayLight}`,
    background: "transparent",
    color: C.navy,
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  error: {
    fontSize: "13px",
    color: C.coral,
    marginTop: "10px",
    fontFamily: "'Georgia', serif",
    background: "#fff5f6",
    padding: "10px 14px",
    borderRadius: "10px",
    border: `1px solid ${C.coralLight}`,
  },
};

/* ─── SPINNER ────────────────────────────────────────────────────────────────── */
function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── STEP TRACKER ───────────────────────────────────────────────────────────── */
function StepTracker({ current, total, labels }: StepTrackerProps) {
  return (
    <div style={{ width: "100%", maxWidth: "460px", marginBottom: "20px", padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        {labels.map((label, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", fontSize: "10px", letterSpacing: "0.06em",
            color: i < current ? C.coral : i === current ? C.navy : C.gray,
            fontWeight: i === current ? "700" : "400",
            fontFamily: "'Georgia', serif", transition: "color 0.3s",
          }}>{label}</div>
        ))}
      </div>
      <div style={{ position: "relative", height: "4px", background: C.grayLight, borderRadius: "4px" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${(current / (total - 1)) * 100}%`,
          background: C.coral, borderRadius: "4px",
          transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "-10px" }}>
        {labels.map((_, i) => (
          <div key={i} style={{
            width: "20px", height: "20px", borderRadius: "50%",
            background: i < current ? C.coral : i === current ? C.navy : C.white,
            border: `2px solid ${i <= current ? (i < current ? C.coral : C.navy) : C.grayLight}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s",
          }}>
            {i < current && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4.5 7.5L8.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── BRAND ──────────────────────────────────────────────────────────────────── */
function Brand() {
  return (
    <div style={{ textAlign: "center", marginBottom: "28px" }}>
      <div style={{ fontSize: "24px", fontWeight: "900", color: C.navy, letterSpacing: "-0.02em" }}>ROAM-BLON</div>
      <div style={{ fontSize: "11px", color: C.gray, letterSpacing: "0.16em", marginTop: "3px" }}>YOUR AI TRAVEL BUDDY</div>
    </div>
  );
}

/* ─── SCREEN: LANDING (Splash) ───────────────────────────────────────────────── */
function ScreenLanding({ onTourist, onAdmin, onScanQR }: ScreenLandingProps) {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: "48px 40px" }}>
      {/* Animated travel icon */}
      <div style={{ fontSize: "72px", marginBottom: "20px", lineHeight: 1, animation: "float 3s ease-in-out infinite" }}>🌏</div>

      <div style={{ fontSize: "12px", color: C.coral, fontWeight: "800", letterSpacing: "0.2em", marginBottom: "8px", textTransform: "uppercase" }}>
        Welcome to the Marble Capital of the Philippines
      </div>

      <div style={{ fontSize: "32px", fontWeight: "900", color: C.navy, letterSpacing: "-0.03em", marginBottom: "8px", lineHeight: "1" }}>
        ROAM-BLON
      </div>

      <div style={{
        fontSize: "13px", color: C.gray, letterSpacing: "0.1em", marginBottom: "32px",
        textTransform: "uppercase", fontWeight: "700",
      }}>
        Your AI-Integrated Smart Travel Companion
      </div>

      <div style={{
        fontSize: "15px",
        color: C.navy,
        lineHeight: "1.8",
        marginBottom: "32px",
        width: "100%",
        padding: "28px 32px",
        background: C.bg,
        borderRadius: "24px",
        border: `1.5px solid ${C.grayLight}`,
        fontWeight: "500",
        boxSizing: "border-box",
        textAlign: "left",
      }}>
        <span style={{ fontSize: "16px", fontWeight: 800, color: C.navy }}>Discover Romblon Island like never before.</span>
        <br /><br />
        <span style={{ fontSize: "14px", color: C.gray, lineHeight: "1.8" }}>
          Roam-Blon is the official AI-powered digital tourism platform for Romblon, Philippines — the Marble Capital of the World.
          Whether you are a first-time visitor or a returning traveler, our platform connects you with the island&apos;s finest
          <strong> dining experiences</strong>, <strong>accredited local tour guides</strong>, breathtaking <strong>beach and heritage destinations</strong>,
          and <strong>motorcycle rentals</strong> — all in one seamless, intelligent system.
        </span>
        <br /><br />
        <span style={{ fontSize: "13px", color: C.coral, fontWeight: 700 }}>Your adventure begins here. 🏛️🌊🛵</span>
      </div>

      {/* ─── FEATURES SECTION ─── */}
      <div style={{ width: "100%", marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", color: "#38bdf8", textTransform: "uppercase", marginBottom: "12px" }}>
          Features
        </div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: C.navy, lineHeight: "1.2", marginBottom: "12px", letterSpacing: "-0.02em" }}>
          Everything you need to travel smarter
        </div>
        <div style={{ fontSize: "14px", color: C.gray, lineHeight: "1.7", marginBottom: "28px", maxWidth: "340px", margin: "0 auto 28px auto" }}>
          From AI itineraries to live navigation maps — Roam-Blon handles the planning so you can enjoy every moment of your Romblon journey.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", textAlign: "left" }}>
          {[
            {
              icon: "✨",
              title: "AI Chatbot powered by Gemini 2.5",
              desc: "Experience smart day-by-day trip generation tailored to your interests and budget. Disclaimer: AI responses may occasionally be inaccurate or outdated.",
            },
            {
              icon: "🗺️",
              title: "Live Route Maps",
              desc: "Visualize your route on a real-time GPS map. See distances, roads, and nearby hidden spots at a glance.",
            },
            {
              icon: "⚡",
              title: "Smart Suggestions",
              desc: "Discover local favourites, optimal routes, and money-saving tips powered by real traveller data.",
            },
            {
              icon: "🍽️",
              title: "Dining Spots & Guides",
              desc: "Browse rated restaurants and book accredited tour guides — all verified by the local tourism office.",
            },
            {
              icon: "📷",
              title: "QR-Powered Discovery",
              desc: "Scan QR codes at any Romblon establishment for instant menus, reviews, photos, and contact info.",
            },
            {
              icon: "🚨",
              title: "Emergency Hub",
              desc: "One-tap access to police, coast guard, medical, and tourism emergency contacts — anytime, anywhere.",
            },
            {
              icon: "💬",
              title: "Tourism Officer Chat",
              desc: "Get real-time support and verified local information by chatting directly with a tourism officer.",
            },
          ].map((f) => (
            <div
              key={f.title}
              style={{
                background: C.white,
                border: `1.5px solid ${C.grayLight}`,
                borderRadius: "20px",
                padding: "20px 18px",
                boxShadow: "0 4px 16px rgba(26,34,54,0.06)",
              }}
            >
              <div style={{
                width: "42px", height: "42px",
                borderRadius: "12px",
                background: "#eff6ff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px",
                marginBottom: "14px",
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: C.navy, marginBottom: "8px", lineHeight: "1.3" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "12px", color: C.gray, lineHeight: "1.7" }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MUNICIPAL TOURISM HIGHLIGHTS ─── */}
      <div style={{ width: "100%", marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", color: C.coral, textTransform: "uppercase", marginBottom: "12px" }}>
          Municipal Tourism Highlights
        </div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: C.navy, lineHeight: "1.2", marginBottom: "12px", letterSpacing: "-0.02em" }}>
          Romblon's must-see icons
        </div>
        <div style={{ fontSize: "14px", color: C.gray, lineHeight: "1.7", marginBottom: "28px", maxWidth: "340px", margin: "0 auto 28px auto" }}>
          A quick look at the culture, coastline, and craftsmanship that make the province unforgettable.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", textAlign: "left" }}>
          {[
            {
              icon: "🎉",
              title: "Biniray Festival",
              desc: "Romblon's most colorful celebration, held every January in honor of the Santo Niño. Expect vibrant street dancing, a fluvial procession of decorated boats, and the island's rich Ati-Atihon-inspired heritage on full display.",
            },
            {
              icon: "🏖️",
              title: "Bonbon Beach",
              desc: "A postcard-perfect sandbar on Romblon Island known for its powdery white sand and shallow turquoise waters that stretch far into the sea at low tide — a favorite spot for swimming, photos, and sunset views.",
            },
            {
              icon: "⛏️",
              title: "Marble Products",
              desc: "Romblon is world-renowned as the Marble Capital of the Philippines. Visit local workshops to see artisans hand-carve marble into sculptures, tiles, and souvenirs, and bring home a piece of the island's craftsmanship.",
            },
          ].map((h) => (
            <div
              key={h.title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
                background: C.white,
                border: `1.5px solid ${C.grayLight}`,
                borderRadius: "20px",
                padding: "20px 18px",
                boxShadow: "0 4px 16px rgba(26,34,54,0.06)",
              }}
            >
              <div style={{
                width: "44px", height: "44px", flexShrink: 0,
                borderRadius: "12px",
                background: C.coralLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px",
              }}>
                {h.icon}
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: C.navy, marginBottom: "6px", lineHeight: "1.3" }}>
                  {h.title}
                </div>
                <div style={{ fontSize: "13px", color: C.gray, lineHeight: "1.7" }}>
                  {h.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SMALL MAP OF ROMBLON ─── */}
      <div style={{ width: "100%", marginBottom: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.22em", color: "#38bdf8", textTransform: "uppercase", marginBottom: "12px" }}>
          Find Us
        </div>
        <div style={{ fontSize: "22px", fontWeight: 900, color: C.navy, lineHeight: "1.2", marginBottom: "16px", letterSpacing: "-0.02em" }}>
          Romblon, Philippines
        </div>
        <div style={{
          width: "100%",
          borderRadius: "20px",
          overflow: "hidden",
          border: `1.5px solid ${C.grayLight}`,
          boxShadow: "0 4px 16px rgba(26,34,54,0.06)",
        }}>
          <iframe
            title="Map of Romblon, Philippines"
            src="https://www.openstreetmap.org/export/embed.html?bbox=121.9%2C12.45%2C122.45%2C12.75&layer=mapnik&marker=12.5778%2C122.2703"
            style={{ width: "100%", height: "220px", border: "none", display: "block" }}
            loading="lazy"
          />
        </div>
        <div style={{ fontSize: "12px", color: C.gray, marginTop: "10px" }}>
          📍 Romblon Island, Romblon Province, Philippines
        </div>
      </div>

      {/* ─── HOW ROAM-BLON WORKS ─── */}
      <div style={{ width: "100%", marginBottom: "32px", textAlign: "left" }}>
        <div style={{ marginBottom: "18px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.coral, textAlign: "center" }}>
          How Roam-Blon works
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: "16px" }}>
          {[
            {
              title: "01. Create Your Profile",
              desc: "Sign up as a Tourist in seconds. We only collect your basic details — nationality, age, and gender — to personalize your Romblon experience and help the local tourism office track visitor insights for better services.",
            },
            {
              title: "02. Scan QR Codes & Explore",
              desc: "Every accredited dining spot, tourist spot, and local service in Romblon has a unique QR code. Simply scan it to instantly access menus, reviews, real photos, contact info, and live route maps — no searching required.",
            },
            {
              title: "03. Book Guides & Rentals",
              desc: "Browse a roster of government-accredited tour guides and verified motorcycle rental providers. Read their reviews, check availability, and confirm your booking directly from the app — making sure every peso is well-spent.",
            },
            {
              title: "04. Navigate with Live Maps",
              desc: "Get real-time GPS-guided routes from your current location to any tourist destination or dining spot. Our OpenStreetMap integration shows you the road ahead, with walking, tricycle, and boat route options for every type of traveler.",
            },
            {
              title: "05. 24/7 AI Travel Buddy",
              desc: "Have a question at midnight? Need a local tip? Your Roam-Blon AI Travel Buddy is always available. Chat naturally to get personalized itineraries, local recommendations, weather-aware advice, and instant answers about Romblon's best-kept secrets.",
            },
            {
              title: "06. Emergency Hub & Safety",
              desc: "Your safety is our priority. The Emergency Hub gives you one-tap access to police, coast guard, medical, and local tourism emergency contacts. Whether on a boat, a beach, or a mountain trail — help is always one tap away.",
            },
          ].map((item) => (
            <div key={item.title} style={{ padding: "20px", borderRadius: "22px", background: C.white, border: `1px solid ${C.grayLight}`, boxShadow: C.cardShadow }}>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.18em", marginBottom: "10px", color: C.coral }}>{item.title}</div>
              <div style={{ fontSize: "14px", color: C.navy, lineHeight: "1.8" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          style={{ ...S.btnPrimary, fontSize: "18px", padding: "20px 48px", borderRadius: "18px", width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
          onClick={onTourist}
        >
          Explore as Tourist 🚀
        </button>

        {/* QR Scan Button */}
        <button
          onClick={onScanQR}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: "16px",
            border: `2px dashed ${C.grayLight}`,
            background: "transparent",
            color: C.navy,
            fontSize: "14px",
            fontWeight: "700",
            fontFamily: "'Georgia', serif",
            cursor: "pointer",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.coral;
            e.currentTarget.style.color = C.coral;
            e.currentTarget.style.background = C.coralLight;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.grayLight;
            e.currentTarget.style.color = C.navy;
            e.currentTarget.style.background = "transparent";
          }}
        >
          {/* QR Code SVG icon */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top-left QR square */}
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
            {/* Top-right QR square */}
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
            {/* Bottom-left QR square */}
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
            {/* Bottom-right dots */}
            <line x1="14" y1="14" x2="14" y2="14.01" />
            <line x1="18" y1="14" x2="18" y2="14.01" />
            <line x1="14" y1="18" x2="14" y2="18.01" />
            <line x1="18" y1="18" x2="18" y2="18.01" />
            <line x1="16" y1="16" x2="16" y2="16.01" />
            <line x1="20" y1="14" x2="20" y2="20" />
            <line x1="14" y1="20" x2="20" y2="20" />
          </svg>
          Scan QR Code
        </button>

        <button
          style={{ ...S.btnSecondary, background: "transparent", color: C.gray, border: `1.5px solid ${C.grayLight}`, marginTop: "8px" }}
          onClick={onAdmin}
        >
          Admin / Rental Owner Login
        </button>
      </div>
    </div>
  );
}

/* ─── SCREEN: ROLE PICKER ────────────────────────────────────────────────────── */
function ScreenRolePicker({ onSelectRole, onBack }: ScreenRolePickerProps) {
  const roles: { key: Role; emoji: string; title: string; subtitle: string; color: string; lightBg: string }[] = [
    {
      key: "admin",
      emoji: "🛡️",
      title: "Tourism Officer",
      subtitle: "Manage destinations & services",
      color: C.navy,
      lightBg: "#e8ecf4",
    },
    {
      key: "tour_guide",
      emoji: "🧭",
      title: "Tour Guide",
      subtitle: "Manage your bookings and schedule",
      color: "#8b5cf6",
      lightBg: "#f3e8ff",
    },
    {
      key: "tourist",
      emoji: "🧳",
      title: "Tourist",
      subtitle: "Explore & plan your adventure",
      color: C.coral,
      lightBg: C.coralLight,
    },
  ];

  return (
    <div style={{ ...S.card, textAlign: "center" }}>
      <Brand />
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "22px", fontWeight: "900", color: C.navy, marginBottom: "8px" }}>How would you like to continue?</div>
        <div style={{ fontSize: "14px", color: C.gray, lineHeight: "1.7" }}>
          Select your account type below. Each role unlocks a different set of tools and dashboards tailored specifically for your needs within the Romblon tourism ecosystem.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        {roles.map((role) => (
          <button
            key={role.key}
            onClick={() => onSelectRole(role.key)}
            style={{
              display: "flex", alignItems: "center", gap: "18px",
              padding: "22px 24px", borderRadius: "20px",
              border: `2px solid ${C.grayLight}`,
              background: "#fdf9f7",
              cursor: "pointer",
              transition: "all 0.25s ease",
              textAlign: "left",
              fontFamily: "'Georgia', serif",
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = role.color;
              e.currentTarget.style.background = role.lightBg;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.grayLight;
              e.currentTarget.style.background = "#fdf9f7";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ fontSize: "40px", lineHeight: 1, flexShrink: 0 }}>{role.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "17px", fontWeight: "800", color: C.navy, marginBottom: "4px" }}>
                Log in as {role.title}
              </div>
              <div style={{ fontSize: "13px", color: C.gray }}>{role.subtitle}</div>
            </div>
            <div style={{ fontSize: "18px", color: C.gray, flexShrink: 0 }}>→</div>
          </button>
        ))}
      </div>

      <button style={{ ...S.btnOutline, width: "100%" }} onClick={onBack}
        onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        ← Back
      </button>
    </div>
  );
}

/* ─── SCREEN: SIGN IN (uses Supabase Auth) ───────────────────────────────────── */
function ScreenSignIn({ role, onNext, onGoSignUp, errorMessage }: ScreenSignInProps) {
  const [form, setForm] = useState({ email: "", password: "", idProof: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const friendlyError = (msg: string) => {
    if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror") || msg.toLowerCase().includes("network request failed")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    if (msg === "Invalid login credentials") return "Incorrect email or password. Please try again.";
    return msg;
  };

  const submit = async () => {
    if (loading) return;

    if (!form.email.trim()) return setErr("Please enter your email address.");
    if (!form.password) return setErr("Please enter your password.");
    if (role === "admin" && !form.idProof) return setErr("Please upload a photo of your Admin ID.");
    if (role === "admin" && form.email.trim().toLowerCase() !== ADMIN_EMAIL) return setErr("Access restricted — only the official admin account (admin@roam-blon.com) can sign in.");
    if (!acceptedTerms) return setErr("Please accept the Terms and Conditions to continue.");

    setLoading(true);
    setErr("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setErr(friendlyError(error.message));
        setLoading(false);
        return;
      }

      const tableName = role === "admin" ? "admins" : role === "tour_guide" ? "tour_guides" : "tourists";
      let { data: existing } = await supabase
        .from(tableName)
        .select("*")
        .eq("email", form.email.trim())
        .maybeSingle();


      setLoading(false);

      if (existing) {
        onNext({ email: form.email, existingProfile: existing, adminIdProof: role === "admin" ? form.idProof : undefined });
      } else {
        // Record the login in the tourists table (server-side upsert bypasses RLS)
        if (role === "tourist") {
          try {
            await fetch("/api/tourists", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: form.email.trim() }),
            });
          } catch { /* ignore — fallback below still applies */ }
        }
        onNext({ email: form.email, existingProfile: null, adminIdProof: role === "admin" ? form.idProof : undefined });
      }
    } catch (e: any) {
      setErr(friendlyError(e?.message ?? "An unexpected error occurred. Please try again."));
      setLoading(false);
    }
  };

  return (
    <div style={S.card}>
      <Brand />
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "22px", fontWeight: "900", color: C.navy, marginBottom: "8px" }}>{role === "admin" ? "Admin Login 🛡️" : "Welcome back! 👋"}</div>
        {role !== "admin" && (
          <div style={{ fontSize: "14px", color: C.gray, lineHeight: "1.7" }}>
            Good to see you again! Sign in with your registered email and password to pick up right where you left off — your favorite spots, bookings, and travel history are all waiting for you.
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@email.com" value={form.email}
            disabled={loading}
            onChange={(e) => { setForm({ ...form, email: e.target.value }); setErr(""); }} />
        </div>
        <div>
          <label style={S.label}>Password</label>
          <div style={{ position: "relative" }}>
            <input style={{ ...S.input, paddingRight: "48px" }} type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password}
              disabled={loading}
              onKeyDown={(e) => e.key === "Enter" && !loading && submit()}
              onChange={(e) => { setForm({ ...form, password: e.target.value }); setErr(""); }} />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute",
                right: "6px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                color: C.gray,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {role === "admin" && (
          <div>
            <label style={S.label}>Submit Admin ID Image</label>
            <label style={{ display: "block", border: "2px dashed #d0c8c0", borderRadius: "14px", padding: "16px", textAlign: "center", cursor: loading ? "not-allowed" : "pointer", background: "#fff", transition: "border-color 0.2s", }}>
              {form.idProof ? (
                <img src={form.idProof} alt="Admin ID" style={{ maxHeight: "140px", maxWidth: "100%", borderRadius: "10px", margin: "0 auto", display: "block" }} />
              ) : (
                <>
                  <div style={{ fontSize: "26px", marginBottom: "6px" }}>🪪</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: C.gray }}>Tap to upload a photo of your Admin ID</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>JPG or PNG · Government-issued ID preferred</div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => { setForm({ ...form, idProof: reader.result as string }); setErr(""); };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {form.idProof && (
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <label style={{ flex: 1, textAlign: "center", border: "1px solid #e0d8d0", borderRadius: "10px", padding: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "700", color: C.gray }}>
                  Change photo
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={loading} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => { setForm({ ...form, idProof: reader.result as string }); setErr(""); };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                <button type="button" onClick={() => { setForm({ ...form, idProof: "" }); }} style={{ flex: 1, border: "1px solid #e0d8d0", borderRadius: "10px", padding: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "700", color: "#c0392b", background: "#fff" }}>
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "4px" }}>
          <input
            type="checkbox"
            id="terms-signin"
            checked={acceptedTerms}
            onChange={(e) => { setAcceptedTerms(e.target.checked); setErr(""); }}
            style={{ marginTop: "4px", cursor: "pointer" }}
          />
          <label htmlFor="terms-signin" style={{ fontSize: "12px", color: C.gray, lineHeight: "1.4", cursor: "pointer" }}>
            I agree to the <span style={{ color: C.coral, fontWeight: "700" }}>Terms and Conditions</span> and understand my data will be processed according to the privacy policy.
          </label>
        </div>

        {(err || errorMessage) && <div style={S.error}>⚠ {err || errorMessage}</div>}

        <button style={{ ...S.btnPrimary, marginTop: "4px", opacity: loading ? 0.75 : 1 }}
          onClick={submit} disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = C.coral)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
        >
          {loading ? <><Spinner /> Signing in…</> : "Sign In →"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: "13px", color: C.gray, marginTop: "24px" }}>
        No account yet?{" "}
        <span onClick={!loading ? onGoSignUp : undefined} style={{ color: C.coral, cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", opacity: loading ? 0.5 : 1 }}>Create one</span>
      </p>
    </div>
  );
}

/* ─── SCREEN: SIGN UP (uses Supabase Auth) ───────────────────────────────────── */
function ScreenSignUp({ role, onNext, onGoSignIn }: ScreenSignUpProps) {
  const [form, setForm] = useState({ email: "", password: "", confirm: "", idProof: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const set = (key: string, val: string) => { setForm({ ...form, [key]: val }); setErr(""); };

  const friendlyError = (msg: string) => {
    if (msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror") || msg.toLowerCase().includes("network request failed")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    return msg;
  };

  const submit = async () => {
    if (loading) return;

    if (!form.email.trim()) return setErr("Please enter your email address.");
    if (!form.password) return setErr("Please enter a password.");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setErr("Passwords do not match.");
    if (role === "admin" && !form.idProof) return setErr("Please upload a photo of your Admin ID.");
    if (role === "admin" && form.email.trim().toLowerCase() !== ADMIN_EMAIL) return setErr("Access restricted — only the official admin account (admin@roam-blon.com) can be created.");
    if (!acceptedTerms) return setErr("Please accept the Terms and Conditions to continue.");

    setLoading(true);
    setErr("");

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setErr(friendlyError(error.message));
        setLoading(false);
        return;
      }

      setLoading(false);
      onNext({ email: form.email.trim(), existingProfile: null, adminIdProof: form.idProof });
    } catch (e: any) {
      setErr(friendlyError(e?.message ?? "An unexpected error occurred. Please try again."));
      setLoading(false);
    }
  };

  return (
    <div style={S.card}>
      <Brand />
      <div style={{ marginBottom: "28px" }}>
        <div style={{ fontSize: "22px", fontWeight: "900", color: C.navy, marginBottom: "8px" }}>{role === "admin" ? "Create Admin Account 🛡️" : "Create your account 🌴"}</div>
        {role !== "admin" && (
          <div style={{ fontSize: "14px", color: C.gray, lineHeight: "1.7" }}>
            Join thousands of explorers who have already discovered the wonders of Romblon through Roam-Blon. Creating an account takes less than a minute — just your email, a secure password, and a few quick profile steps, and you&apos;ll be ready to explore the Marble Capital.
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={S.label}>Email Address</label>
          <input style={S.input} type="email" placeholder="you@email.com"
            disabled={loading}
            value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="Min. 6 characters"
            disabled={loading}
            value={form.password} onChange={(e) => set("password", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>Confirm Password</label>
          <input style={S.input} type="password" placeholder="Repeat your password"
            disabled={loading}
            value={form.confirm}
            onKeyDown={(e) => e.key === "Enter" && !loading && submit()}
            onChange={(e) => set("confirm", e.target.value)} />
        </div>

        {role === "admin" && (
          <div>
            <label style={S.label}>Submit Admin ID Image</label>
            <label style={{ display: "block", border: "2px dashed #d0c8c0", borderRadius: "14px", padding: "16px", textAlign: "center", cursor: loading ? "not-allowed" : "pointer", background: "#fff", transition: "border-color 0.2s", }}>
              {form.idProof ? (
                <img src={form.idProof} alt="Admin ID" style={{ maxHeight: "140px", maxWidth: "100%", borderRadius: "10px", margin: "0 auto", display: "block" }} />
              ) : (
                <>
                  <div style={{ fontSize: "26px", marginBottom: "6px" }}>🪪</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", color: C.gray }}>Tap to upload a photo of your Admin ID</div>
                  <div style={{ fontSize: "10px", color: "#aaa", marginTop: "4px" }}>JPG or PNG · Government-issued ID preferred</div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                disabled={loading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => { setForm({ ...form, idProof: reader.result as string }); setErr(""); };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {form.idProof && (
              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <label style={{ flex: 1, textAlign: "center", border: "1px solid #e0d8d0", borderRadius: "10px", padding: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "700", color: C.gray }}>
                  Change photo
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={loading} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => { setForm({ ...form, idProof: reader.result as string }); setErr(""); };
                    reader.readAsDataURL(file);
                  }} />
                </label>
                <button type="button" onClick={() => { setForm({ ...form, idProof: "" }); }} style={{ flex: 1, border: "1px solid #e0d8d0", borderRadius: "10px", padding: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "11px", fontWeight: "700", color: "#c0392b", background: "#fff" }}>
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "4px" }}>
          <input
            type="checkbox"
            id="terms-signup"
            checked={acceptedTerms}
            onChange={(e) => { setAcceptedTerms(e.target.checked); setErr(""); }}
            style={{ marginTop: "4px", cursor: "pointer" }}
          />
          <label htmlFor="terms-signup" style={{ fontSize: "12px", color: C.gray, lineHeight: "1.4", cursor: "pointer" }}>
            I agree to the <span style={{ color: C.coral, fontWeight: "700" }}>Terms and Conditions</span> and understand my data will be processed according to the privacy policy.
          </label>
        </div>

        {err && <div style={S.error}>⚠ {err}</div>}

        <button style={{ ...S.btnPrimary, marginTop: "4px", opacity: loading ? 0.75 : 1 }}
          onClick={submit} disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = C.coral)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}
        >
          {loading ? <><Spinner /> Creating account…</> : "Create Account →"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: "13px", color: C.gray, marginTop: "24px" }}>
        Already have an account?{" "}
        <span onClick={!loading ? onGoSignIn : undefined} style={{ color: C.coral, cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", opacity: loading ? 0.5 : 1 }}>Sign in</span>
      </p>
    </div>
  );
}

/* ─── SCREEN: GENDER ───────────────────────────────────────────────────────── */
function ScreenGender({ value, onChange, onNext, onBack }: ScreenGenderProps) {
  const [err, setErr] = useState("");
  const next = () => { if (!value) return setErr("Please select your gender."); onNext(); };
  const options = [
    { label: "Male", val: "male", emoji: "👨" },
    { label: "Female", val: "female", emoji: "👩" },
    { label: "Other", val: "other", emoji: "🌈" },
    { label: "Prefer not to say", val: "private", emoji: "🤐" },
  ];
  return (
    <div style={S.card}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", color: C.coral, letterSpacing: "0.1em", marginBottom: "10px", fontWeight: "700" }}>STEP 1 OF 2</div>
        <div style={{ fontSize: "30px", fontWeight: "900", color: C.navy, lineHeight: "1.2", marginBottom: "10px" }}>Select your<br />gender</div>
        <div style={{ fontSize: "14px", color: C.gray }}>Help us understand our visitors better.</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        {options.map((opt) => {
          const sel = value === opt.val;
          return (
            <button key={opt.val} onClick={() => { onChange(opt.val); setErr(""); }}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "16px 20px", borderRadius: "16px",
                border: `2px solid ${sel ? C.coral : C.grayLight}`,
                background: sel ? C.coralLight : "#fdf9f7",
                cursor: "pointer", transition: "all 0.2s", textAlign: "left",
                fontFamily: "'Georgia', serif",
              }}>
              <span style={{ fontSize: "24px" }}>{opt.emoji}</span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: sel ? C.coral : C.navy }}>{opt.label}</span>
              {sel && <span style={{ marginLeft: "auto", color: C.coral }}>✓</span>}
            </button>
          );
        })}
      </div>
      {err && <div style={S.error}>⚠ {err}</div>}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button style={S.btnOutline} onClick={onBack}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>← Back</button>
        <button style={S.btnPrimary} onClick={next}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.coral)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}>Continue →</button>
      </div>
    </div>
  );
}

/* ─── SCREEN: AGE ────────────────────────────────────────────────────────────── */
function ScreenAge({ value, onChange, onNext, onBack }: ScreenAgeProps) {
  const [err, setErr] = useState("");
  const next = () => {
    const age = parseInt(value);
    if (!value || isNaN(age) || age < 1 || age > 120) return setErr("Please enter a valid age (1–120).");
    onNext();
  };
  const ranges = [
    { label: "Under 18", val: 16 }, { label: "18–24", val: 21 },
    { label: "25–34", val: 29 }, { label: "35–44", val: 39 },
    { label: "45–54", val: 49 }, { label: "55+", val: 60 },
  ];
  return (
    <div style={S.card}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", color: C.coral, letterSpacing: "0.1em", marginBottom: "10px", fontWeight: "700" }}>STEP 2 OF 2</div>
        <div style={{ fontSize: "30px", fontWeight: "900", color: C.navy, lineHeight: "1.2", marginBottom: "10px" }}>How old<br />are you?</div>
        <div style={{ fontSize: "14px", color: C.gray }}>We'll tailor recommendations just for you.</div>
      </div>
      <input style={{ ...S.input, fontSize: "26px", padding: "18px 20px", textAlign: "center", letterSpacing: "0.1em" }}
        type="number" min="1" max="120" placeholder="—" value={value} autoFocus
        onChange={(e) => { onChange(e.target.value); setErr(""); }}
        onKeyDown={(e) => e.key === "Enter" && next()} />
      <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
        {ranges.map((r) => {
          const sel = parseInt(value) === r.val;
          return (
            <button key={r.label} onClick={() => { onChange(String(r.val)); setErr(""); }}
              style={{
                padding: "8px 14px", borderRadius: "20px", cursor: "pointer", fontFamily: "'Georgia', serif", fontSize: "12px", transition: "all 0.2s",
                border: `1.5px solid ${sel ? C.coral : C.grayLight}`,
                background: sel ? C.coralLight : "transparent",
                color: sel ? C.coral : C.gray,
              }}>{r.label}</button>
          );
        })}
      </div>
      {err && <div style={{ ...S.error, textAlign: "center" }}>⚠ {err}</div>}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button style={S.btnOutline} onClick={onBack}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>← Back</button>
        <button style={S.btnPrimary} onClick={next}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.coral)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}>Continue →</button>
      </div>
    </div>
  );
}

/* ─── SCREEN: NATIONALITY ────────────────────────────────────────────────────── */
function ScreenNationality({ nationality, country, onChangeNat, onChangeCountry, onNext, onBack, loading }: ScreenNationalityProps) {
  const [err, setErr] = useState("");
  const next = () => {
    if (loading) return;

    if (!nationality) return setErr("Please select your visitor type.");
    if (nationality === "foreign" && !country.trim()) return setErr("Please enter your country of origin.");
    onNext();
  };
  const opts = [
    { val: "local", emoji: "🇵🇭", title: "Local", sub: "Filipino citizen" },
    { val: "foreign", emoji: "✈️", title: "Foreign", sub: "International visitor" },
  ];
  return (
    <div style={S.card}>
      <div style={{ marginBottom: "32px" }}>
        <div style={{ fontSize: "13px", color: C.coral, letterSpacing: "0.1em", marginBottom: "10px", fontWeight: "700" }}>STEP 1 OF 1</div>
        <div style={{ fontSize: "30px", fontWeight: "900", color: C.navy, lineHeight: "1.2", marginBottom: "10px" }}>Where are<br />you from?</div>
        <div style={{ fontSize: "14px", color: C.gray }}>This helps us provide the right services for you.</div>
      </div>
      <div style={{ display: "flex", gap: "14px", marginBottom: "20px" }}>
        {opts.map((opt) => {
          const sel = nationality === opt.val;
          return (
            <button key={opt.val} onClick={() => { onChangeNat(opt.val); setErr(""); }}
              disabled={loading}
              style={{
                flex: 1, padding: "24px 12px", borderRadius: "20px", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", textAlign: "center", opacity: loading ? 0.6 : 1,
                border: `2px solid ${sel ? C.coral : C.grayLight}`,
                background: sel ? C.coralLight : "#fdf9f7",
              } as React.CSSProperties}>
              <div style={{ fontSize: "38px", marginBottom: "10px" }}>{opt.emoji}</div>
              <div style={{ fontWeight: "800", fontSize: "16px", fontFamily: "'Georgia', serif", color: sel ? C.coral : C.navy }}>{opt.title}</div>
              <div style={{ fontSize: "12px", color: C.gray, marginTop: "4px", fontFamily: "'Georgia', serif" }}>{opt.sub}</div>
              {sel && (
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", margin: "10px auto 0" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {nationality === "foreign" && (
        <div style={{ marginBottom: "8px" }}>
          <label style={S.label}>Country of Origin</label>
          <input style={S.input} placeholder="e.g. Japan, United States, Australia…"
            disabled={loading}
            value={country} autoFocus
            onChange={(e) => { onChangeCountry(e.target.value); setErr(""); }} />
        </div>
      )}
      {err && <div style={S.error}>⚠ {err}</div>}
      <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
        <button style={S.btnOutline} onClick={onBack} disabled={loading}
          onMouseEnter={(e) => (e.currentTarget.style.background = C.bg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>← Back</button>
        <button style={{ ...S.btnPrimary, opacity: loading ? 0.75 : 1 }} onClick={next} disabled={loading}
          onMouseEnter={(e) => !loading && (e.currentTarget.style.background = C.coral)}
          onMouseLeave={(e) => (e.currentTarget.style.background = C.navy)}>
          {loading ? <><Spinner /> Saving…</> : "Finish Setup →"}
        </button>
      </div>
    </div>
  );
}

/* ─── SCREEN: WELCOME ────────────────────────────────────────────────────────── */
function ScreenWelcome({ tourist, role, onExplore }: ScreenWelcomeProps) {
  const rows = [
    { icon: "🎂", label: "Age", val: `${tourist.age} years old` },
    { icon: tourist.gender === "male" ? "👨" : tourist.gender === "female" ? "👩" : "👤", label: "Gender", val: tourist.gender ? tourist.gender.charAt(0).toUpperCase() + tourist.gender.slice(1) : "Specified" },
    ...(tourist.nationality ? [{ icon: "🌍", label: "Type", val: tourist.nationality === "local" ? "🇵🇭 Local Tourist" : "✈️ Foreign Tourist" }] : []),
    ...(tourist.country ? [{ icon: "📍", label: "From", val: tourist.country }] : []),
  ];
  return (
    <div style={{ ...S.card, textAlign: "center" }}>
      <div style={{ fontSize: "64px", marginBottom: "20px", lineHeight: 1 }}>{role === "admin" ? "🛡️" : "🌴"}</div>
      <div style={{ fontSize: "30px", fontWeight: "900", color: C.navy, marginBottom: "8px" }}>
        Mabuhay!
      </div>
      <div style={{ fontSize: "15px", color: C.gray, lineHeight: "1.7", marginBottom: "28px" }}>
        Welcome to your travel buddy dashboard.
        <br /><br />
        Your adventure in <strong style={{ color: C.coral }}>Romblon</strong> begins now.<br />
        {tourist.nationality === "foreign" && tourist.country
          ? `So glad you're visiting from ${tourist.country}! 🌏`
          : "Welcome to Romblon! 🇵🇭"}
      </div>

      {/* Profile info rows */}


      <div style={{ background: C.bg, borderRadius: "18px", padding: "20px 24px", textAlign: "left", marginBottom: "28px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: C.gray, marginBottom: "14px" }}>YOUR TRAVEL PROFILE</div>
        {rows.map((row, i) => (
          <div key={i} style={{
            display: "flex", gap: "14px", alignItems: "center",
            paddingBottom: i < rows.length - 1 ? "12px" : 0,
            marginBottom: i < rows.length - 1 ? "12px" : 0,
            borderBottom: i < rows.length - 1 ? `1px solid ${C.grayLight}` : "none",
          }}>
            <span style={{ fontSize: "20px" }}>{row.icon}</span>
            <div>
              <div style={{ fontSize: "11px", color: C.gray }}>{row.label}</div>
              <div style={{ fontSize: "15px", color: C.navy, fontWeight: "700" }}>{row.val}</div>
            </div>
          </div>
        ))}
      </div>

      <button style={{
        ...S.btnPrimary,
        background: "linear-gradient(135deg, #1a2236 0%, #1a2236 100%)",
        boxShadow: "0 10px 25px rgba(26, 34, 54, 0.2)"
      }} onClick={onExplore}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
        }}>
        {role === "admin" ? "Enter Dashboard ⚙️" : "Enter Explorer 🌊"}
      </button>
    </div>
  );
}



/* ─── MAIN ───────────────────────────────────────────────────────────────────── */
interface AuthSuccessParams {
  email: string;
  existingProfile: any;
  detectedRole?: Role;
  adminIdProof?: string;
}

export default function TouristAuthFlow({ onComplete, onCancel, initialScreen = "signin", initialRole = "", onOpenQRScanner }: { onComplete?: (data: any) => void; onCancel?: () => void; initialScreen?: Screen; initialRole?: Role; onOpenQRScanner?: () => void }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role>(initialRole || (initialScreen === "signin" ? "tourist" : ""));
  const [data, setData] = useState<TouristData>({
    email: "", gender: "", age: "", nationality: "", country: "",
  });
  const [sessionChecked, setSessionChecked] = useState(initialScreen === "landing" || initialScreen === "signin");
  const [authError, setAuthError] = useState("");

  const set = (key: keyof TouristData) => (val: string) => setData((d) => ({ ...d, [key]: val }));

  const questScreens: Screen[] = ["nationality"];
  const trackerLabels = ["NATIONALITY"];
  const trackerStep = questScreens.indexOf(screen);
  const showTracker = trackerStep >= 0;

  // Removed rolePicker auto-redirect to allow selection


  useEffect(() => {
    async function checkSession() {
      // If starting at landing screen, don't interrupt — let the user navigate naturally
      if (initialScreen === "landing") {
        setSessionChecked(true);
        return;
      }

      // If a role was explicitly requested (e.g. /login?role=admin), respect it
      // and do NOT override it with the currently logged-in session's role.
      if (initialRole) {
        setRole(initialRole);
        setSessionChecked(true);
        return;
      }

      // If we're already on a quest step, don't interrupt
      if (showTracker || screen === "welcome") {
        setSessionChecked(true);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to identify which role/table this user belongs to
        const [ {data: admin}, {data: guide}, {data: tourist} ] = await Promise.all([
          supabase.from('admins').select('*').eq('email', user.email).maybeSingle(),
          supabase.from('tour_guides').select('*').eq('email', user.email).maybeSingle(),
          supabase.from('tourists').select('*').eq('email', user.email).maybeSingle()
        ]);

        const extProfile = admin || guide || tourist;
        const detRole: Role = admin ? "admin" : guide ? "tour_guide" : tourist ? "tourist" : "";

        if (extProfile && detRole) {
          handleAuthSuccess({ email: user.email!, existingProfile: extProfile, detectedRole: detRole });
          setSessionChecked(true);
          return;
        }

        if (!extProfile) {
          // Authenticated user without a profile yet: treat as tourist onboarding.
          setRole("tourist");
          setData((prev) => ({ ...prev, email: user.email || "" }));
          setScreen("nationality");
        }
      }
      setSessionChecked(true);
    }
    checkSession();
  }, []);

  // ── Role selection handler ────────────────────────────────────────────────
  const handleSelectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    setScreen("signin");
  };

  // ── Called after auth succeeds ────────────────────────────────────────────
  async function handleAuthSuccess(params: AuthSuccessParams) {
    const { email, existingProfile, detectedRole } = params;
    setAuthError("");
    const activeRole = detectedRole || role || "tourist";
    setRole(activeRole);
    setData((prev) => ({ ...prev, email }));

    if (existingProfile) {
      const profileData = {
        email,
        gender: existingProfile.gender || "",
        age: String(existingProfile.age || ""),
        nationality: existingProfile.nationality || "",
        country: existingProfile.country || "",
        adminIdProof: params.adminIdProof,
      };
      setData(profileData);
      onComplete?.({ ...profileData, role: activeRole, adminIdProof: params.adminIdProof });
      return;
    }

    if (activeRole === "tourist") {
      setScreen("nationality");
      return;
    }

    if (activeRole === "admin") {
      if (!params.adminIdProof?.trim()) {
        setAuthError("Admin ID proof is required to complete registration.");
        setScreen("signup");
        return;
      }

      const { error } = await supabase.from("admins").insert({
        email,
        first_name: "Admin",
        last_name: "User",
        prof_id: params.adminIdProof,
      });

      if (error) {
        console.warn("Failed to create admin profile:", error.message);
        setAuthError("Account created, but admin profile setup failed. Please contact support.");
        setScreen("signin");
        return;
      }

      const profileData = { email, gender: "", age: "", nationality: "", country: "", adminIdProof: params.adminIdProof };
      setData(profileData);
      onComplete?.({ ...profileData, role: activeRole, adminIdProof: params.adminIdProof });
      return;
    }

    setAuthError("No profile exists for this account. Please use a valid role or sign up first.");
    setScreen("signin");
  };

  // ── Save profile to Supabase ───────────────────────────────────────────────
  const handleFinishQuestionnaire = async () => {
    setSaving(true);
    // Only insert into tourists table if the role is tourist
    if (role === "tourist") {
      const payload = {
        email: data.email,
        age: Number(data.age) || null,
        nationality: data.nationality === "foreign" ? "Foreign" : "Local",
      };

      const { error } = await supabase.from("tourists").insert(payload);

      if (error) {
        console.warn("Supabase insert warning:", error.message);
      }

      // Reliable server-side upsert (bypasses RLS) so the tourist is stored in the DB
      try {
        await fetch("/api/tourists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch { /* ignore — local fallback below still applies */ }

      // Fallback — persist locally so the admin count still works if RLS blocks the insert
      try {
        const stored = JSON.parse(localStorage.getItem("roam_blon_tourists") || "[]");
        if (!stored.some((t: any) => t.email === payload.email)) {
          stored.unshift({ ...payload, created_at: new Date().toISOString(), id: `local_${Date.now()}` });
          localStorage.setItem("roam_blon_tourists", JSON.stringify(stored.slice(0, 500)));
        }
      } catch { /* ignore */ }

      // Broadcast to admin for instant count update
      try {
        const chan = supabase.channel('admin-live-feed');
        await chan.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            chan.send({ type: 'broadcast', event: 'new_tourist', payload });
            supabase.removeChannel(chan);
          }
        });
      } catch { /* ignore */ }
    }

    // Hold the loading effect so the transition feels smooth
    await new Promise((r) => setTimeout(r, 1800));

    setSaving(false);
    // Skip welcome screen — go directly to dashboard
    onComplete?.({ ...data, role: role || "tourist" });
  };

  // ── Handle admin verification completion ─────────────────────────────────
  const handleAdminVerification = () => {
    // Save verified status to session storage to avoid repeat scans
    if (data.email) {
      sessionStorage.setItem(`verified_${data.email}`, 'true');
    }

    onComplete?.({ ...data, role });

    // Navigate decisively based on role after verification
    const currentPath = window.location.pathname;

    if (role === 'admin' && currentPath !== '/admin/dashboard') {
      router.push('/admin/dashboard');
    } else if (role === 'tour_guide' && currentPath !== '/guide/dashboard') {
      router.push('/guide/dashboard');
    }
  };

  if (saving) {
    return (
      <div style={{
        position: "fixed", inset: 0,
        background: C.bg,
        fontFamily: "'Georgia', serif",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "24px",
        zIndex: 1000,
      }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,90,107,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,34,54,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: C.white, boxShadow: C.cardShadow,
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "28px", animation: "float 2.4s ease-in-out infinite",
        }}>
          <img src="/logo.jpg" alt="Roam-Blon" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: "50%" }} />
        </div>

        <div style={{
          width: "100%", maxWidth: 260, height: 6,
          background: C.grayLight, borderRadius: 999,
          overflow: "hidden", marginBottom: "20px",
        }}>
          <div style={{
            width: "45%", height: "100%",
            background: `linear-gradient(90deg, ${C.coral}, #f7a8b3, ${C.coral})`,
            backgroundSize: "200% 100%",
            borderRadius: 999,
            animation: "loader 1.2s linear infinite",
          }} />
        </div>

        <div style={{ fontSize: "18px", fontWeight: "900", color: C.navy, marginBottom: "6px" }}>Setting up your tourist profile…</div>
        <div style={{ fontSize: "13px", color: C.gray, lineHeight: "1.7", maxWidth: 300 }}>
          {role === "tourist"
            ? `Registering you as a ${data.nationality === "foreign" ? "foreign visitor" : "local explorer"} and taking you to your dashboard.`
            : "Preparing your dashboard…"}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes loader {
            0% { background-position: 200% 0; transform: translateX(-20%); }
            100% { background-position: 0% 0; transform: translateX(120%); }
          }
        `}</style>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(245, 237, 232, 0.95)",
        zIndex: 999,
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{ textAlign: "center", padding: "28px", borderRadius: "24px", background: C.white, boxShadow: C.cardShadow }}>
          <div style={{ fontSize: "18px", fontWeight: 700, color: C.navy, marginBottom: "12px" }}>Restoring your session…</div>
          <div style={{ fontSize: "14px", color: C.gray }}>Please wait while we check your login state.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: C.bg,
      overflowY: "auto",
      overflowX: "hidden",
      fontFamily: "'Georgia', serif",
    } as React.CSSProperties}>
      <div style={{ position: "absolute", top: -100, right: -100, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(224,90,107,0.13) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,34,54,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100%",
        padding: "48px 16px 64px",
        position: "relative",
        zIndex: 1,
      }}>

        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: `1.5px solid ${C.grayLight}`,
              background: C.white,
              color: C.navy,
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              zIndex: 10,
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.coral;
              e.currentTarget.style.color = C.coral;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.grayLight;
              e.currentTarget.style.color = C.navy;
            }}
          >
            ✕
          </button>
        )}

        {screen !== "landing" && (
          <div style={{ fontSize: "11px", color: C.gray, letterSpacing: "0.16em", marginBottom: showTracker ? "16px" : "28px" }}>
            ROAM-BLON · ROMBLON, PHILIPPINES
          </div>
        )}

        {showTracker && (
          <StepTracker current={trackerStep} total={questScreens.length} labels={trackerLabels} />
        )}

        <div style={{ width: "100%", maxWidth: screen === "landing" ? "520px" : "460px", transition: "max-width 0.3s ease-in-out" }} key={screen}>
          {screen === "landing" && (
            <ScreenLanding 
              onTourist={() => { setRole("tourist"); setScreen("signin"); }}
              onAdmin={() => setScreen("rolePicker")}
              onScanQR={() => {
                // If a parent QR scanner is available, use it; otherwise navigate to /qr
                if (onOpenQRScanner) {
                  onCancel?.(); // close the auth overlay
                  onOpenQRScanner();
                } else {
                  router.push("/qr");
                }
              }}
            />
          )}
          {screen === "rolePicker" && (
            <div style={{ ...S.card, textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "20px" }}>🛡️</div>
              <h2 style={{ fontSize: "24px", fontWeight: "900", color: C.navy, marginBottom: "24px" }}>Admin Access</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button style={S.btnPrimary} onClick={() => { setRole("admin"); setScreen("signin"); }}>Tourism Officer</button>
                <button style={S.btnPrimary} onClick={() => { setRole("tour_guide"); setScreen("signin"); }}>Tour Guide</button>
                <button style={{ ...S.btnSecondary, marginTop: "12px" }} onClick={() => setScreen("landing")}>Back</button>
              </div>
            </div>
          )}
          {screen === "signin" && <ScreenSignIn role={role} onNext={handleAuthSuccess} onGoSignUp={() => setScreen("signup")} errorMessage={authError} />}
          {screen === "signup" && <ScreenSignUp role={role} onNext={handleAuthSuccess} onGoSignIn={() => setScreen("signin")} />}
          {screen === "nationality" && (
            <ScreenNationality
              nationality={data.nationality} country={data.country}
              onChangeNat={set("nationality")} onChangeCountry={set("country")}
              loading={saving}
              onNext={handleFinishQuestionnaire}
              onBack={() => setScreen("signin")}
            />
          )}
          {screen === "welcome" && <ScreenWelcome tourist={data} role={role || "tourist"} onExplore={() => onComplete?.({ ...data, role: role || "tourist" })} />}
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        input:focus { border-color: #e05a6b !important; box-shadow: 0 0 0 3px rgba(224,90,107,0.13) !important; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}
