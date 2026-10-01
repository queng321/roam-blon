import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "About | Roam-Blon",
  description:
    "About the Roam-Blon project — our story, mission, and vision for smart tourism in Romblon, Philippines.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-[#FAEEED]/20 pt-20 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <AboutSection />

          {/* TROUBLESHOOTING SECTION */}
          <div className="mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full border border-rose-200 w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-[11px] font-black text-rose-600 uppercase tracking-widest">
                Troubleshooting
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">
              Common Issues & Solutions
            </h2>
            <p className="text-slate-500 font-medium mb-8 max-w-2xl">
              Quick reference for the most common issues you may encounter while using Roam-Blon.
            </p>

            <div className="space-y-8 text-slate-700">
              {/* Issue A: Unable to Log In */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-500 text-2xl font-black">a.</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Issue: Unable to Log In</h3>
                  </div>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="font-bold text-slate-700">⚫ Solution 1: Ensure you are using the correct email and password</p>
                  <p className="font-bold text-slate-700">⚫ Solution 2: Check if you are connected to the internet</p>
                  <p className="font-bold text-slate-700">⚫ Solution 3: Try clearing your browser cache and cookies</p>
                  <p className="font-bold text-slate-700">⚫ Solution 4: Use the "Forgot Password" link on the login page if needed</p>
                </div>
              </div>

              {/* Issue B: Error Loading Page */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-500 text-2xl font-black">b.</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Issue: Error Loading Page</h3>
                  </div>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="font-bold text-slate-700">⚫ Solution 1: Check your internet connection</p>
                  <p className="font-bold text-slate-700">⚫ Solution 2: Refresh the page or try again in a few moments</p>
                  <p className="font-bold text-slate-700">⚫ Solution 3: Clear browser cache and try again</p>
                  <p className="font-bold text-slate-700">⚫ Solution 4: If the issue persists, contact support</p>
                </div>
              </div>

              {/* Issue C: Location Not Registering or Inaccurate */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-500 text-2xl font-black">c.</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Issue: Location Not Registering or Inaccurate</h3>
                  </div>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="font-bold text-slate-700">⚫ Solution 1: Wait 5–10 minutes for GPS to acquire a strong signal</p>
                  <p className="font-bold text-slate-700">⚫ Solution 2: Make sure your device location services are enabled</p>
                  <p className="font-bold text-slate-700">⚫ Solution 3: Turn Airplane Mode on and off to reset network connections</p>
                  <p className="font-bold text-slate-700">⚫ Solution 4: Ensure the app has permission to access your location</p>
                  <p className="font-bold text-slate-700">⚫ Solution 5: Move to an open area away from tall buildings for better GPS accuracy</p>
                </div>
              </div>

              {/* Issue D: Booking Not Showing */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-500 text-2xl font-black">d.</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Issue: Booking Not Showing in Notifications</h3>
                  </div>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="font-bold text-slate-700">⚫ Solution 1: Wait a few seconds and refresh the notifications panel</p>
                  <p className="font-bold text-slate-700">⚫ Solution 2: Ensure you completed the booking confirmation step</p>
                  <p className="font-bold text-slate-700">⚫ Solution 3: Check if you received a reference code (format: RB-XXXXXX)</p>
                  <p className="font-bold text-slate-700">⚫ Solution 4: Log out and log back in to refresh your session</p>
                </div>
              </div>

              {/* Issue E: QR Scanner Not Working */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-rose-500 text-2xl font-black">e.</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase">Issue: QR Code Scanner Not Working</h3>
                  </div>
                </div>
                <div className="space-y-2 pl-7">
                  <p className="font-bold text-slate-700">⚫ Solution 1: Grant camera permission when prompted</p>
                  <p className="font-bold text-slate-700">⚫ Solution 2: Ensure adequate lighting on the QR code</p>
                  <p className="font-bold text-slate-700">⚫ Solution 3: Hold the camera steady and at proper distance</p>
                  <p className="font-bold text-slate-700">⚫ Solution 4: Clean your camera lens</p>
                  <p className="font-bold text-slate-700">⚫ Solution 5: Try flipping to the front camera if rear camera fails</p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="mt-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 md:p-8 text-center text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="relative">
                <h3 className="text-xl md:text-2xl font-black mb-2">Contacting Support</h3>
                <p className="text-rose-100 font-medium mb-6 max-w-md mx-auto">
                  If you encounter any issue or need assistance, contact our customer support team:
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
                  <a
                    href="mailto:charliemagdtobaile08@gmail.com"
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black uppercase tracking-wider transition-all backdrop-blur-sm border border-white/30"
                  >
                    charliemagdtobaile08@gmail.com
                  </a>
                  <a
                    href="tel:+639667383174"
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black uppercase tracking-wider transition-all backdrop-blur-sm border border-white/30"
                  >
                    +63 966 738 3174
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}