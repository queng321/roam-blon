"use client";

import { useState } from "react";
import {
  AlertCircle,
  WifiOff,
  Mail,
  Phone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  Smartphone,
  Airplay,
} from "lucide-react";

const issues = [
  {
    id: "login",
    title: "Unable to Log In",
    icon: AlertCircle,
    solutions: [
      "Ensure you are using the correct email and password",
      "Check if you are connected to the internet",
      "Try clearing your browser cache and cookies",
      "If you forgot your password, use the 'Forgot Password' link on the login page",
    ],
  },
  {
    id: "page-load",
    title: "Error Loading Page",
    icon: WifiOff,
    solutions: [
      "Check your internet connection",
      "Refresh the page or try again in a few moments",
      "Clear browser cache and try again",
      "If the issue persists, contact support",
    ],
  },
  {
    id: "location",
    title: "Location Not Registering or Inaccurate",
    icon: MapPin,
    solutions: [
      "Wait 5–10 minutes for GPS to acquire a strong signal",
      "Make sure device location services are enabled",
      "Toggle Airplane Mode on and off to reset network connections",
      "Ensure the app has permission to access your location",
      "Move to an open area away from tall buildings for better GPS accuracy",
    ],
  },
  {
    id: "booking",
    title: "Booking Not Showing in Notifications",
    icon: AlertCircle,
    solutions: [
      "Wait a few seconds and pull to refresh the notifications panel",
      "Ensure you completed the booking confirmation step",
      "Check if you received a reference code (format: RB-XXXXXX)",
      "Log out and log back in to refresh your session",
    ],
  },
  {
    id: "qr-scan",
    title: "QR Code Scanner Not Working",
    icon: Smartphone,
    solutions: [
      "Grant camera permission when prompted",
      "Ensure adequate lighting on the QR code",
      "Hold the camera steady and at proper distance",
      "Clean your camera lens",
      "Try flipping to the front camera if rear camera fails",
    ],
  },
];

export default function CommonIssues() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 mb-4">
          <AlertCircle size={16} className="text-rose-500" />
          <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Troubleshooting</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
          Common Issues & Solutions
        </h2>
        <p className="text-slate-500 font-medium mt-2 max-w-xl mx-auto">
          Quick fixes for the most common problems. Tap an issue to expand.
        </p>
      </div>

      <div className="space-y-4">
        {issues.map((issue) => {
          const isOpen = expanded === issue.id;
          return (
            <div
              key={issue.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : issue.id)}
                className="w-full p-5 flex items-center justify-between gap-4 text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                    <issue.icon size={20} className="text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">{issue.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {issue.solutions.length} solution{issue.solutions.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-rose-500">
                  {isOpen ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-3 pt-4">
                    {issue.solutions.map((solution, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Contact Support */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 md:p-8 text-center text-white relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Mail size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-2">Need More Help?</h3>
            <p className="text-rose-100 font-medium mb-6 max-w-md mx-auto">
              If you can&apos;t find a solution here, our support team is ready to assist you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:charliemagdtobaile08@gmail.com"
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-black text-sm uppercase tracking-wider transition-all backdrop-blur-sm border border-white/30"
              >
                <Mail size={18} /> charliemagdtobaile08@gmail.com
              </a>
              <a
                href="tel:+639667383174"
                className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-black text-sm uppercase tracking-wider transition-all backdrop-blur-sm border border-white/30"
              >
                <Phone size={18} /> +63 966 738 3174
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}