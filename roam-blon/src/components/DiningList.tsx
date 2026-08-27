"use client"
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveCoords } from '@/lib/coordinates';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Utensils, Flame, Star, MapPin, ChefHat, 
  MessageCircle, Trophy, ChevronLeft, ChevronRight, Images, X, Phone, Facebook, FileText, Eye, Camera
} from "lucide-react";

interface DiningReview {
  id: string;
  item_type: string;
  item_id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at: string;
}

interface DiningListProps {
  onLocate?: (shop: any) => void;
}

const ROMBLON_SPECIALTIES = [
  { id: 'sarsa', name: 'Sarsa', description: 'Small shrimps caught in streams, mixed with young coconut and chili, wrapped in coconut leaves.', image: '/foods/sarsa.webp' },
  { id: 'Utan na Gabi', name: 'Utan na Gabi', description: 'Dried gabi leaves cooked in thick coconut milk until creamy.', image: '/foods/gayabon.webp' },
  { id: 'sihi', name: 'Sihi Shells (Liswe)', description: 'Local edible sea snails usually cooked in coconut milk.', image: '/foods/sihi.webp' },
  { id: 'taghilaw', name: 'Taghilaw', description: 'Pork meat and innards cooked in vinegar and garlic.', image: '/foods/tagilaw.webp' },
  { id: 'balichow', name: 'Balichaw na Gamos', description: 'Salted and fermented fish or xalamang (krill).', image: '/foods/balichow.jpg' },
  { id: 'inaslum', name: 'Inaslum', description: 'A healthy, bland vegetable soup using seasonal greens.', image: '/foods/inaslum.webp' },
  { id: 'langka', name: 'Utan na Langka', description: 'Unripe jackfruit cooked with rich coconut milk.', image: '/foods/langka.jpg' },
];

export default function DiningList({ onLocate }: DiningListProps) {
  const [shops, setShops] = useState<any[]>([]);
  const [diningReviews, setDiningReviews] = useState<Record<string, DiningReview[]>>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [cardPhotoIdx, setCardPhotoIdx] = useState<Record<string, number>>({});
  const [activeGallery, setActiveGallery] = useState<any | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [activeMenuGallery, setActiveMenuGallery] = useState<any | null>(null);
  const [menuGalleryIdx, setMenuGalleryIdx] = useState(0);
  const [activeDetails, setActiveDetails] = useState<any | null>(null);
  const [detailsPhotoIdx, setDetailsPhotoIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  const DINING_CATEGORIES = [
    { id: "all", label: "All Dining", icon: "🍽️" },
    { id: "restaurant", label: "Restaurants & Diners", icon: "🍛" },
    { id: "cafe", label: "Cafes & Coffee", icon: "☕" },
    { id: "bar", label: "Bars & Grills", icon: "🍻" },
  ];

  const STATIC_DINING = [
    { id: "bistro", name: "Marble City Café & Bistro", location: "Town Proper", address: "Town Proper, Romblon", category: "Coffee Shop & Bistro", image_url: "/dining/bistro.jpg", images: ["/dining/bistro.jpg"], menus: ["/dining/menu/bistro.jpg"], contact: "0900 000 0000", latitude: 12.5760, longitude: 122.2708 /* TODO: Island Bistro full number */ },
    { id: "el", name: "El Krimphoff Resort & Restaurant", location: "Brgy. Lonos", address: "Sitio Babangtan, Brgy. Lonos, Romblon", category: "Restaurant & Resort", image_url: "/dining/el.jpg", images: ["/dining/el.jpg"], menus: ["/dining/menu/el1.jpg", "/dining/menu/el2.jpg", "/dining/menu/el3.jpg", "/dining/menu/el4.jpg", "/dining/menu/el5.jpg"], contact: "0900 000 0000", latitude: 12.5596, longitude: 122.2512 /* TODO: El Krimpuff full number */ },
    { id: "gangnam", name: "Gangnam Korean Grill", location: "Brgy. Mapula", address: "Sitio Batiano, Brgy. Mapula, Romblon", category: "Korean BBQ", image_url: "/dining/gangnam.jpg", images: ["/dining/gangnam.jpg"], menus: ["/dining/menu/gangnam.jpg", "/dining/menu/gangnam1.jpg", "/dining/menu/gangnam2.jpg", "/dining/menu/gangnam3.jpg"], contact: "0998 404 3290", latitude: 12.5401, longitude: 122.2642 },
    { id: "horizon", name: "Horizon Seaside Restaurant", location: "Brgy. Lonos", address: "Sitio Upper Lusod, Brgy. Lonos", category: "Seafood & Grill", image_url: "/dining/horizon.jpg", images: ["/dining/horizon.jpg"], menus: ["/dining/menu/horizon (1).jpg", "/dining/menu/horizon (2).jpg", "/dining/menu/horizon (3).jpg", "/dining/menu/horizon (4).jpg", "/dining/menu/horizon (5).jpg"], description: "Ross's Restaurant offers Filipino & Spanish cuisine by Horizon Hotel Romblon. Experience the rich flavors of the Philippines with a touch of Spanish culinary heritage—from beloved Filipino comfort food to Spanish-inspired favorites, every dish is thoughtfully prepared to bring together tradition, flavor, and modern dining, served with the warm hospitality Romblon is known for. \"Where Every Bite Becomes Part of Your Romblon Story.\"", contact: "0915 771 8481", latitude: 12.5728, longitude: 122.2514 },
    { id: "italian", name: "Italian Trattoria", location: "Town Proper", address: "Republika St, Brgy. 1 Poblacion, Romblon", category: "Italian Trattoria", image_url: "/dining/italian.jpg", images: ["/dining/italian.jpg"], menus: ["/dining/menu/italian (1).jpg", "/dining/menu/italian (2).jpg", "/dining/menu/italian (3).jpg", "/dining/menu/italian (4).jpg"], contact: "0917 876 0072", latitude: 12.5767, longitude: 122.2689 },
    { id: "mamalois", name: "Mama Lois Kitchen", location: "Town Proper", address: "Beside Romblon Port Terminal, Town Proper, Romblon", category: "Local Diner", image_url: "/dining/mamalois.jpg", images: ["/dining/mamalois.jpg"], menus: ["/dining/menu/mamalois1 (1).jpg", "/dining/menu/mamalois1 (2).jpg"], contact: "0900 000 0000", latitude: 12.5781, longitude: 122.2690 /* TODO: Mama Loi's full number */ },
    { id: "ocean", name: "Seaview Restobar", location: "Brgy. Lonos", address: "Sitio Suwa, Brgy. Lonos, Romblon", category: "Seafood Restaurant", image_url: "/dining/ocean.jpg", images: ["/dining/ocean.jpg"], menus: ["/dining/menu/seaview (1).jpg", "/dining/menu/seaview (2).jpg", "/dining/menu/seaview (3).jpg", "/dining/menu/seaview (4).jpg", "/dining/menu/seaview (5).jpg", "/dining/menu/seaview (6).jpg"], contact: "0999 433 1224", latitude: 12.5650, longitude: 122.2520 },
    { id: "panublion", name: "Panublion Heritage Diner", location: "Town Proper", address: "Republika St, Town Proper, Romblon", category: "Heritage Diner", image_url: "/dining/panublion.jpg", images: ["/dining/panublion.jpg"], menus: ["/dining/menu/panublion1 (1).jpg", "/dining/menu/panublion1 (2).jpg", "/dining/menu/panublion1 (3).jpg", "/dining/menu/panublion1 (4).jpg", "/dining/menu/panublion1 (5).jpg", "/dining/menu/panublion1 (6).jpg"], contact: "0956 044 7249", latitude: 12.5770, longitude: 122.2685 },
    { id: "reggae", name: "Reggae Bar & Grill", location: "Agpanabat", address: "Agpanabat, Romblon", category: "Bar & Grill", image_url: "/dining/reggae.jpg", images: ["/dining/reggae.jpg"], menus: ["/dining/menu/reggae (1).jpg", "/dining/menu/reggae (2).jpg", "/dining/menu/reggae (3).jpg", "/dining/menu/reggae (4).jpg", "/dining/menu/reggae (5).jpg", "/dining/menu/reggae (6).jpg"], contact: "0915 029 8242", latitude: 12.4828, longitude: 122.2830 },
    { id: "sunbird", name: "Sunbird Ridge Coffee Shop", location: "Brgy. Lonos", address: "Ridge above Tiamban Beach, Brgy. Lonos", category: "Coffee Shop & Lounge", image_url: "/foods/sarsa.webp", images: ["/foods/sarsa.webp", "/foods/inaslum.webp", "/foods/sihi.webp", "/foods/gayabon.webp"], latitude: 12.5700, longitude: 122.2485 },
    { id: "yurich", name: "Yurich Hotel & Caffeinate Co.", location: "Brgy. Bagacay", address: "Sitio Binagong, Brgy. Bagacay, Romblon", category: "Local Restaurant", image_url: "/dining/yurich.jpg", images: ["/dining/yurich.jpg"], menus: ["/dining/menu/yurich (1).jpg", "/dining/menu/yurich (2).jpg", "/dining/menu/yurich (3).jpg", "/dining/menu/yurich (4).jpg", "/dining/menu/yurich (5).jpg", "/dining/menu/yurich (6).jpg", "/dining/menu/yurich (7).jpg", "/dining/menu/yurich (8).jpg", "/dining/menu/yurich (9).jpg", "/dining/menu/yurich (10).jpg", "/dining/menu/yurich (11).jpg", "/dining/menu/yurich (12).jpg"], contact: "0900 000 0000", latitude: 12.5762, longitude: 122.2655 /* TODO: Yurich full number */ },
  ];

  const normalizeDiningItem = (shop: any) => {
    const galleryMap: Record<string, string[]> = {
      bistro: ["/dining/bistro.jpg"],
      el: ["/dining/el.jpg"],
      gangnam: ["/dining/gangnam.jpg"],
      horizon: ["/dining/horizon.jpg"],
      italian: ["/dining/italian.jpg"],
      mamalois: ["/dining/mamalois.jpg"],
      ocean: ["/dining/ocean.jpg"],
      panublion: ["/dining/panublion.jpg"],
      reggae: ["/dining/reggae.jpg"],
      sunbird: ["/foods/sarsa.webp", "/foods/inaslum.webp", "/foods/sihi.webp", "/foods/gayabon.webp"],
      yurich: ["/dining/yurich.jpg"],
    };

    const categoryMap: Record<string, string> = {
      bistro: "Coffee Shop & Bistro",
      el: "Restaurant & Hotel",
      gangnam: "Korean BBQ",
      horizon: "Seafood & Grill",
      italian: "Italian Trattoria",
      mamalois: "Local Diner",
      ocean: "Seafood Restaurant",
      panublion: "Heritage Diner",
      reggae: "Bar & Grill",
      sunbird: "Coffee Shop & Lounge",
      yurich: "Café & Food House",
    };

    const contactMap: Record<string, string> = {
      gangnam: "0998 404 3290",
      horizon: "0915 771 8481",
      italian: "0917 876 0072",
      panublion: "0956 044 7249",
      ocean: "0999 433 1224",
      reggae: "0915 029 8242",
      bistro: "0900 000 0000", // TODO: Island Bistro full number
      mamalois: "0900 000 0000", // TODO: Mama Loi's full number
      yurich: "0900 000 0000", // TODO: Yurich full number
      el: "0900 000 0000", // TODO: El Krimpuff full number
    };

    const getShopKey = (s: any) => {
      const id = String(s?.id || "").toLowerCase();
      if (['bistro', 'el', 'gangnam', 'horizon', 'italian', 'mamalois', 'ocean', 'panublion', 'reggae', 'sunbird', 'yurich'].includes(id)) {
        return id;
      }
      // Normalize name: remove apostrophes, extra spaces, lowercase
      const name = String(s?.name || "").toLowerCase().replace(/[''`]/g, "").replace(/\s+/g, " ").trim();
      if (name.includes("gangnam")) return "gangnam";
      if (name.includes("bistro") || name.includes("marble")) return "bistro";
      // El Krimphoff, El Hotel, El Krimpuff — all map to "el"
      if (name.includes("el krim") || name.includes("el hotel") || name.includes("krimphoff") || name.includes("krimpuff")) return "el";
      if (name.includes("horizon")) return "horizon";
      if (name.includes("italian")) return "italian";
      // Mama Loi's, Mama Lois, Mamalois — all map to "mamalois"
      if (name.includes("mama") || name.includes("mamaloi") || name.includes("mama loi")) return "mamalois";
      // Seaview Restobar, Ocean View — all map to "ocean"
      if (name.includes("seaview") || name.includes("sea view") || name.includes("ocean")) return "ocean";
      if (name.includes("panublion") || name.includes("pahublion")) return "panublion";
      if (name.includes("reggae")) return "reggae";
      if (name.includes("sunbird")) return "sunbird";
      if (name.includes("yurich")) return "yurich";
      return id;
    };

    const shopKey = getShopKey(shop);
    const directGallery = Array.isArray(shop?.images) && shop.images.length > 0 ? shop.images : [];
    const mapped = galleryMap[shopKey] || [];
    const combined = Array.from(new Set([...directGallery, ...mapped]));
    const primaryImage = shop?.image_url || shop?.image || combined[0] || "/dining/bistro.jpg";

    // Resolve coordinates: explicit shop values win, otherwise the shared registry
    const coords = resolveCoords({ id: shopKey, name: shop?.name });

    // Static fallback menu images for specific shops
    const staticMenus: Record<string, string[]> = {
      bistro: ["/dining/menu/bistro.jpg"],
      el: ["/dining/menu/el1.jpg", "/dining/menu/el2.jpg", "/dining/menu/el3.jpg", "/dining/menu/el4.jpg", "/dining/menu/el5.jpg"],
      gangnam: ["/dining/menu/gangnam.jpg", "/dining/menu/gangnam1.jpg", "/dining/menu/gangnam2.jpg", "/dining/menu/gangnam3.jpg"],
      horizon: ["/dining/menu/horizon (1).jpg", "/dining/menu/horizon (2).jpg", "/dining/menu/horizon (3).jpg", "/dining/menu/horizon (4).jpg", "/dining/menu/horizon (5).jpg"],
      italian: ["/dining/menu/italian (1).jpg", "/dining/menu/italian (2).jpg", "/dining/menu/italian (3).jpg", "/dining/menu/italian (4).jpg"],
      mamalois: ["/dining/menu/mamalois1 (1).jpg", "/dining/menu/mamalois1 (2).jpg"],
      panublion: ["/dining/menu/panublion1 (1).jpg", "/dining/menu/panublion1 (2).jpg", "/dining/menu/panublion1 (3).jpg", "/dining/menu/panublion1 (4).jpg", "/dining/menu/panublion1 (5).jpg", "/dining/menu/panublion1 (6).jpg"],
      reggae: ["/dining/menu/reggae (1).jpg", "/dining/menu/reggae (2).jpg", "/dining/menu/reggae (3).jpg", "/dining/menu/reggae (4).jpg", "/dining/menu/reggae (5).jpg", "/dining/menu/reggae (6).jpg"],
      ocean: ["/dining/menu/seaview (1).jpg", "/dining/menu/seaview (2).jpg", "/dining/menu/seaview (3).jpg", "/dining/menu/seaview (4).jpg", "/dining/menu/seaview (5).jpg", "/dining/menu/seaview (6).jpg"],
      yurich: ["/dining/menu/yurich (1).jpg", "/dining/menu/yurich (2).jpg", "/dining/menu/yurich (3).jpg", "/dining/menu/yurich (4).jpg", "/dining/menu/yurich (5).jpg", "/dining/menu/yurich (6).jpg", "/dining/menu/yurich (7).jpg", "/dining/menu/yurich (8).jpg", "/dining/menu/yurich (9).jpg", "/dining/menu/yurich (10).jpg", "/dining/menu/yurich (11).jpg", "/dining/menu/yurich (12).jpg"],
    };
    return {
      ...shop,
      image_url: primaryImage,
      images: combined.length > 0 ? combined : [primaryImage],
      category: categoryMap[shopKey] || shop?.category || "Local Eat",
      latitude: shop?.latitude ?? coords.lat,
      longitude: shop?.longitude ?? coords.lng,
      // Prefer explicit shop.menus, then static fallback, then photo combo
      menus: shop?.menus && shop.menus.length > 0 ? shop.menus : (staticMenus[shopKey] || (combined.length > 0 ? combined : [primaryImage])),
      contact: shop?.contact || contactMap[shopKey] || "+63 917 123 4567",
      facebook_url: shop?.facebook_url || `https://facebook.com/search/top?q=${encodeURIComponent(shop?.name || "")}`
    };
  };

  const fetchDining = async () => {
    try {
      const { data } = await supabase.from('dining_hubs').select('*');
      if (data && data.length > 0) {
        setShops(data.map(normalizeDiningItem));
      } else {
        setShops(STATIC_DINING.map(normalizeDiningItem));
      }
    } catch {
      setShops(STATIC_DINING.map(normalizeDiningItem));
    }
  };

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      let remoteReviews: DiningReview[] = [];
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('item_type', 'dining')
        .order('created_at', { ascending: false });
      if (data) remoteReviews = data as DiningReview[];

      const stored = JSON.parse(localStorage.getItem('roam_blon_reviews') || '[]') as DiningReview[];
      const localReviews = stored.filter(r => r.item_type === 'dining');

      const allReviews = [...remoteReviews];
      localReviews.forEach(lr => {
        if (!allReviews.some(ar => ar.id === lr.id || (ar.reviewer_name === lr.reviewer_name && ar.comment === lr.comment))) {
          allReviews.push(lr);
        }
      });

      const grouped: Record<string, DiningReview[]> = {};
      allReviews.forEach((r: DiningReview) => {
        if (r.item_id) {
          if (!grouped[r.item_id]) grouped[r.item_id] = [];
          grouped[r.item_id].push(r);
        }
      });
      setDiningReviews(grouped);
    } catch (err) {
      console.error('Failed to fetch dining reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchDining();
    fetchReviews();

    // Real-time: re-fetch on any INSERT or UPDATE to reviews
    const channel = supabase
      .channel('dining-reviews-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: 'item_type=eq.dining' }, () => { fetchReviews(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reviews', filter: 'item_type=eq.dining' }, () => { fetchReviews(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Helper: compute average rating for a place
  const getAvgRating = (reviews: DiningReview[]) =>
    reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  // Rank by average rating (desc), tiebreak by review count (desc)
  const rankedShops = [...shops].sort((a, b) => {
    const aReviews = diningReviews[a.id] || [];
    const bReviews = diningReviews[b.id] || [];
    const avgDiff = getAvgRating(bReviews) - getAvgRating(aReviews);
    return avgDiff !== 0 ? avgDiff : bReviews.length - aReviews.length;
  });

  const filteredShops = rankedShops.filter(shop => {
    if (activeCategory === "all") return true;
    const cat = (shop.category || "").toLowerCase();
    if (activeCategory === "cafe") return cat.includes("coffee") || cat.includes("cafe") || cat.includes("café") || cat.includes("bistro") || cat.includes("lounge");
    if (activeCategory === "bar") return cat.includes("bar") || cat.includes("grill") || cat.includes("bbq");
    if (activeCategory === "restaurant") return !cat.includes("coffee") && !cat.includes("cafe") && !cat.includes("café") && !cat.includes("bar") && !cat.includes("grill") && !cat.includes("bbq") && !cat.includes("lounge");
    return true;
  });



  return (
    <>
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto pb-10 px-4 md:px-0">
      
      {/* SECTION 1: MUST-TRY DELICACIES */}
      <section className="py-6 md:py-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="text-rose-500 animate-pulse" size={14} />
            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-rose-500">Traditional</span>
          </div>
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic">Local Flavors</h3>
          <div className="h-1 w-6 bg-rose-500 mt-2 rounded-full"></div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
          {ROMBLON_SPECIALTIES.map((food) => (
            <div key={food.id} className="min-w-[200px] md:min-w-[280px] group bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-slate-100 shadow-sm snap-start transition-all duration-300">
              <div className="h-32 md:h-40 overflow-hidden relative">
                <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 md:p-5">
                <h4 className="font-bold text-sm md:text-lg text-slate-900 tracking-tight uppercase italic">{food.name}</h4>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{food.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: DINING HUBS GRID */}
      <section className="py-6 md:py-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="text-slate-700" size={14} />
            <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Dining Shops</span>
          </div>
          <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase italic">Restaurants</h3>
        </div>

        {/* CATEGORY FILTER */}
        <div className="sticky top-0 z-40 w-full overflow-x-auto no-scrollbar mb-8 px-2 py-3 -mt-3 bg-gradient-to-b from-white via-white/95 to-transparent">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full shadow-md px-2 py-2 w-max mx-auto min-w-full sm:min-w-0">
            {DINING_CATEGORIES.map(cat => {
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
          {filteredShops.map((shop, rankIndex) => {
            const reviews = diningReviews[shop.id] || [];
            const avg = reviews.length
              ? (reviews.reduce((s: number, r: DiningReview) => s + r.rating, 0) / reviews.length).toFixed(1)
              : null;
            const fiveStarCount = reviews.filter((r: DiningReview) => r.rating === 5).length;
            const photos: string[] = shop.images && shop.images.length > 0 ? shop.images : (shop.image_url ? [shop.image_url] : []);
            const currentPhotoIdx = cardPhotoIdx[shop.id] || 0;
            const goNextPhoto = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCardPhotoIdx(prev => ({ ...prev, [shop.id]: (currentPhotoIdx + 1) % photos.length }));
            };
            const goPrevPhoto = (e: React.MouseEvent) => {
              e.stopPropagation();
              setCardPhotoIdx(prev => ({ ...prev, [shop.id]: (currentPhotoIdx - 1 + photos.length) % photos.length }));
            };
            return (
            <Card 
              key={shop.id} 
              className="group overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 rounded-[1.5rem] md:rounded-[2rem]"
            >
              <div
                className="aspect-video relative overflow-hidden bg-white group/img"
              >
                {/* Main photo */}
                {photos.length > 0 ? (
                  <img src={photos[currentPhotoIdx]} alt={`${shop.name} photo ${currentPhotoIdx + 1}`} className="object-contain w-full h-full transition-all duration-500" />
                ) : (
                  <Utensils className="text-slate-200 h-8 w-8 m-auto absolute inset-0" />
                )}
                {/* Photo credit */}
                <span className="absolute bottom-2 left-2 z-10 bg-black/50 backdrop-blur-sm text-white/80 text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Camera size={8} /> Photo credits to the rightful owner
                </span>
                {/* Category badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-white/95 text-rose-600 font-black text-[7px] md:text-[8px] uppercase px-2.5 py-1 border-none shadow-sm backdrop-blur-sm">
                    {shop.category || 'Local Eat'}
                  </Badge>
                </div>
                {/* Rank badge */}
                <div className={`absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black shadow-md backdrop-blur-sm ${
                  rankIndex === 0 ? 'bg-amber-400 text-white' :
                  rankIndex === 1 ? 'bg-slate-400 text-white' :
                  rankIndex === 2 ? 'bg-orange-500 text-white' :
                  'bg-white/90 text-slate-700'
                }`}>
                  <Trophy size={9} />
                  #{rankIndex + 1}
                </div>

              </div>
              <CardHeader className="pt-4 px-5 pb-1">
                <CardTitle className="text-base md:text-xl font-black text-slate-900 tracking-tight uppercase italic">{shop.name}</CardTitle>
                <span className="text-xs text-gray-500 block">Menu images: {shop.menus?.length || 0}</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10}
                        className={avg && s <= Math.round(parseFloat(avg)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                      />
                    ))}
                  </div>
                  {avg && <span className="text-[11px] font-black text-slate-700">{avg}</span>}
                  <span className="text-[10px] font-bold text-slate-400">
                    {reviews.length === 0 ? 'No reviews' : `${reviews.length} review${reviews.length > 1 ? 's' : ''}`}
                  </span>
                  {fiveStarCount > 0 && (
                    <span className="ml-auto text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100">
                      ⭐ {fiveStarCount} × 5★
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="flex flex-col gap-1.5 text-[9px] md:text-[10px] font-bold text-slate-500 uppercase mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={10} className="shrink-0 text-rose-500" />
                    <span className="truncate">{shop.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={10} className="shrink-0 text-emerald-500" />
                    <span className="truncate">{shop.contact}</span>
                  </div>
                  <a href={shop.facebook_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                    <Facebook size={10} className="shrink-0 text-blue-600" />
                    <span className="truncate">Visit Facebook Page</span>
                  </a>
                  <div className="text-[10px] text-slate-700 font-black italic mt-1 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-center text-center">
                    How to order: Message us at our Facebook Page!
                  </div>
                </div>

                {/* REVIEWS & COMMENTS SECTION */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MessageCircle size={11} className="text-rose-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Reviews & Comments</span>
                  </div>
                  {reviewsLoading ? (
                    <p className="text-[10px] text-slate-300 font-bold animate-pulse">Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-medium italic">Be the first to leave a review!</p>
                  ) : (
                    <div className="space-y-1.5">
                      {reviews.slice(0, 3).map((r: DiningReview, i: number) => (
                        <div key={i} className="bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black text-slate-700 truncate">{r.reviewer_name}</span>
                            <div className="flex gap-0.5 ml-auto flex-shrink-0">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={8} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">{r.comment}</p>
                          )}
                        </div>
                      ))}
                      {reviews.length > 3 && (
                        <p className="text-[10px] text-rose-500 font-black text-right">+{reviews.length - 3} more</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveDetails(shop); setDetailsPhotoIdx(0); }}
                      className="flex-1 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-rose-600 transition-colors shadow-md"
                    >
                      <Eye size={12} /> View Details
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuGallery(shop); setMenuGalleryIdx(0); }}
                      className="flex-1 py-2 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-orange-600 transition-colors shadow-md"
                    >
                      <FileText size={12} /> View Menu
                    </button>
                  </div>
                  {onLocate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onLocate(shop); }}
                      className="w-full py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-rose-600 transition-colors shadow-sm"
                    >
                      <MapPin size={12} /> Route Map
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>

      </section>



    </div>

      {/* ── FULLSCREEN DINING PHOTO LIGHTBOX ── */}
      {activeGallery && (() => {
        const photos: string[] = activeGallery.images && activeGallery.images.length > 0
          ? activeGallery.images
          : (activeGallery.image_url ? [activeGallery.image_url] : []);
        const total = photos.length;
        const goPrev = () => setGalleryIdx(i => (i - 1 + total) % total);
        const goNext = () => setGalleryIdx(i => (i + 1) % total);
        return (
          <div
            className="fixed inset-0 z-[600] bg-black/95 flex flex-col animate-in fade-in duration-300"
            onClick={() => setActiveGallery(null)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 z-10" onClick={e => e.stopPropagation()}>
              <div>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-widest">Photo Gallery</p>
                <h3 className="text-white text-xl font-black uppercase tracking-tight leading-none">{activeGallery.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-black">{galleryIdx + 1} / {total}</span>
                <button onClick={() => setActiveGallery(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* Main image */}
            <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
              <button onClick={goPrev} className="absolute left-4 md:left-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                <ChevronLeft size={24} />
              </button>
              <img
                src={photos[galleryIdx]}
                alt={`${activeGallery.name} - Photo ${galleryIdx + 1}`}
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
              {/* Photo credit */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Camera size={10} /> Photo credits to the rightful owner
              </span>
              <button onClick={goNext} className="absolute right-4 md:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                <ChevronRight size={24} />
              </button>
            </div>
            {/* Thumbnail strip */}
            <div className="px-4 pb-6 flex gap-2 overflow-x-auto justify-center" onClick={e => e.stopPropagation()}>
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setGalleryIdx(i)}
                  className={`shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    i === galleryIdx ? 'border-rose-500 scale-105' : 'border-white/10 opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={p} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── FULLSCREEN MENU LIGHTBOX ── */}
      {activeMenuGallery && (() => {
        const photos: string[] = activeMenuGallery.menus && activeMenuGallery.menus.length > 0
          ? activeMenuGallery.menus
          : (activeMenuGallery.images && activeMenuGallery.images.length > 0 ? activeMenuGallery.images : (activeMenuGallery.image_url ? [activeMenuGallery.image_url] : []));
        const total = photos.length;
        const goPrev = () => setMenuGalleryIdx(i => (i - 1 + total) % total);
        const goNext = () => setMenuGalleryIdx(i => (i + 1) % total);
        return (
          <div
            className="fixed inset-0 z-[600] bg-black/95 flex flex-col animate-in fade-in duration-300"
            onClick={() => setActiveMenuGallery(null)}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 z-10" onClick={e => e.stopPropagation()}>
              <div>
                <p className="text-amber-500/80 text-[10px] font-black uppercase tracking-widest">Available Menus</p>
                <h3 className="text-white text-xl font-black uppercase tracking-tight leading-none">{activeMenuGallery.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-black">{menuGalleryIdx + 1} / {total}</span>
                <button onClick={() => setActiveMenuGallery(null)} className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
            {/* Main image */}
            <div className="flex-1 flex items-center justify-center px-4 relative" onClick={e => e.stopPropagation()}>
              <button onClick={goPrev} className="absolute left-4 md:left-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                <ChevronLeft size={24} />
              </button>
              <img
                src={photos[menuGalleryIdx]}
                alt={`${activeMenuGallery.name} - Menu ${menuGalleryIdx + 1}`}
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
              {/* Photo credit */}
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Camera size={10} /> Menu photo credits to the rightful owner
              </span>
              <button onClick={goNext} className="absolute right-4 md:right-8 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all z-10">
                <ChevronRight size={24} />
              </button>
            </div>
            {/* Thumbnail strip */}
            <div className="px-4 pb-6 flex gap-2 overflow-x-auto justify-center" onClick={e => e.stopPropagation()}>
              {photos.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setMenuGalleryIdx(i)}
                  className={`shrink-0 w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    i === menuGalleryIdx ? 'border-amber-500 scale-105' : 'border-white/10 opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={p} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── DINING DETAILS MODAL ── */}
      {activeDetails && (() => {
        const shop = activeDetails;
        const reviews = diningReviews[shop.id] || [];
        const avg = reviews.length
          ? (reviews.reduce((s: number, r: DiningReview) => s + r.rating, 0) / reviews.length).toFixed(1)
          : null;
        const photos: string[] = shop.images && shop.images.length > 0 ? shop.images : (shop.image_url ? [shop.image_url] : []);
        const total = photos.length;
        const goPrevPhoto = () => setDetailsPhotoIdx(i => (i - 1 + total) % total);
        const goNextPhoto = () => setDetailsPhotoIdx(i => (i + 1) % total);
        return (
          <div
            className="fixed inset-0 z-[700] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setActiveDetails(null)}
          >
            <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-[2rem]">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-1">
                    <Utensils size={10} />
                    Dining Details
                  </div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">{shop.name}</h3>
                </div>
                <button onClick={() => setActiveDetails(null)} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Photo carousel */}
                {photos.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={photos[detailsPhotoIdx]} alt={`${shop.name} photo ${detailsPhotoIdx + 1}`} className="w-full h-56 md:h-72 object-cover" />
                    <span className="absolute bottom-3 left-3 z-10 bg-black/50 backdrop-blur-sm text-white/80 text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Camera size={9} /> Photo credits to the rightful owner
                    </span>
                    {total > 1 && (
                      <>
                        <button onClick={goPrevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all">
                          <ChevronLeft size={18} />
                        </button>
                        <button onClick={goNextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all">
                          <ChevronRight size={18} />
                        </button>
                        <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                          {detailsPhotoIdx + 1} / {total}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={12}
                        className={avg && s <= Math.round(parseFloat(avg)) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}
                      />
                    ))}
                  </div>
                  {avg && <span className="text-sm font-black text-slate-700">{avg}</span>}
                  <span className="text-xs font-bold text-slate-400">
                    {reviews.length === 0 ? 'No reviews yet' : `${reviews.length} review${reviews.length > 1 ? 's' : ''}`}
                  </span>
                </div>

                {/* Info rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Category</p>
                    <p className="text-sm font-bold text-slate-800">{shop.category || 'Local Eat'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Address</p>
                    <p className="text-sm font-bold text-slate-800">{shop.address || shop.location || 'Romblon'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Contact</p>
                    <p className="text-sm font-bold text-slate-800">{shop.contact || '+63 917 123 4567'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">Menu Images</p>
                    <p className="text-sm font-bold text-slate-800">{shop.menus?.length || 0} menu photo{shop.menus?.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>

                {/* Description */}
                {(shop.description || shop.desc) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-2">About {shop.name}</p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{shop.description || shop.desc}</p>
                  </div>
                )}

                {/* Reviews */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Reviews & Comments</p>
                  {reviewsLoading ? (
                    <p className="text-xs text-slate-300 font-bold animate-pulse">Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-xs text-slate-400 font-medium italic">Be the first to leave a review!</p>
                  ) : (
                    <div className="space-y-2">
                      {reviews.slice(0, 5).map((r: DiningReview, i: number) => (
                        <div key={i} className="bg-white rounded-lg px-3 py-2 border border-slate-100">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-black text-slate-700 truncate">{r.reviewer_name}</span>
                            <div className="flex gap-0.5 ml-auto flex-shrink-0">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} size={9} className={s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                              ))}
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-xs text-slate-500 font-medium leading-tight">{r.comment}</p>
                          )}
                        </div>
                      ))}
                      {reviews.length > 5 && (
                        <p className="text-[10px] text-rose-500 font-black text-right">+{reviews.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}