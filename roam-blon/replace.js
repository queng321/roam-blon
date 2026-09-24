const fs = require('fs');
let f = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');
const searchString = `            {activeTab === 'bookings' && (`;
const startIndex = f.indexOf(searchString);
if (startIndex !== -1) {
  const settingsIndex = f.indexOf(`            {activeTab === 'settings' && (`, startIndex);
  if (settingsIndex !== -1) {
    const before = f.substring(0, startIndex);
    const after = f.substring(settingsIndex);
    const replacement = `            {activeTab === 'bookings' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-100px)] w-full">
                <TourGuideBookingsAdminPage isEmbedded={true} />
              </div>
            )}\n\n`;
    f = before + replacement + after;
    fs.writeFileSync('src/app/admin/dashboard/page.tsx', f);
    console.log("Success");
  }
}
