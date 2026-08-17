import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Ruler, 
  Sparkles, 
  CreditCard, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  Heart,
  Calendar,
  MapPin,
  Clock,
  Home,
  Building2,
  ChevronLeft,
  ChevronRight,
  Video,
  Play,
  Maximize2
} from 'lucide-react';
import { ArchitecturalPlan, FloorLevel, Room } from '../types';
import { parseSqft, formatSqft } from '../utils/sqft';
import { getEmbedVideoUrl, isEmbedVideo, isDataVideo } from '../utils/video';
import { formatImageUrl, formatImageUrls } from '../utils/image';

interface PlanDetailModalProps {
  plan: ArchitecturalPlan | null;
  onClose: () => void;
  savedPlans: ArchitecturalPlan[];
  onToggleFavorite: (plan: ArchitecturalPlan) => void;
  onAddToCart: (plan: ArchitecturalPlan, licenseType: 'Standard PDF' | 'CAD Unlimited' | 'Full MEP Pack', price: number) => void;
  onOpenModification: (plan: ArchitecturalPlan) => void;
  onSelectCategory?: (category: string) => void;
  onImageClick?: (plan: ArchitecturalPlan) => void;
  onOpenSlideshow?: (plan: ArchitecturalPlan, initialIndex: number) => void;
}

export default function PlanDetailModal({
  plan,
  onClose,
  savedPlans,
  onToggleFavorite,
  onAddToCart,
  onOpenModification,
  onSelectCategory,
  onImageClick,
  onOpenSlideshow
}: PlanDetailModalProps) {
  if (!plan) return null;

  // Active floor level tab (0 = Ground Floor, 1 = Upper Floor, etc.)
  const [activeFloorIdx, setActiveFloorIdx] = useState(0);
  // Active image slide index for slideshow
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  // Hovered room state for highlighting
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  // Selected license package state
  const [selectedLicense, setSelectedLicense] = useState<'Standard PDF' | 'CAD Unlimited' | 'Full MEP Pack'>('Standard PDF');

  const currentFloor = plan.floors[activeFloorIdx] || plan.floors[0];
  const isFav = savedPlans.some((p) => p.id === plan.id);
  const rawPlanImages = plan.images && plan.images.length > 0 ? plan.images : [plan.image];
  const planImages = formatImageUrls(rawPlanImages);
  const planVideos = plan.videos || [];
  const mediaItems = [
    ...planImages.map((img) => ({ type: 'image' as const, url: img })),
    ...planVideos.map((vid) => ({ type: 'video' as const, url: vid }))
  ];

  // Price modifier mapping based on chosen license
  const licensePriceModifier = {
    'Standard PDF': 0,
    'CAD Unlimited': 500,
    'Full MEP Pack': 950
  };

  const finalPrice = plan.price + licensePriceModifier[selectedLicense];

  const handleCheckoutClick = () => {
    onAddToCart(plan, selectedLicense, finalPrice);
  };

  // Helper functions for displaying realistic local specifications as requested in screenshot
  const getPlanLocation = (plan: ArchitecturalPlan) => {
    if (plan.id === 'virelia-grand') return 'Brookland, UK';
    if (plan.id === 'obsidian') return 'Lake Tahoe, CA';
    if (plan.id === 'crestview') return 'Malibu, CA';
    if (plan.id === 'modern-tropical') return 'Ubud, Bali';
    if (plan.id === 'aurora-crest') return 'Aspen, CO';
    if (plan.id === 'luxury-classical') return 'Florence, Italy';
    if (plan.id === 'cascadia-resort') return 'Cascade Range, OR';
    if (plan.id === 'azure-oasis') return 'Santorini, Greece';
    if (plan.id === 'luxury-neoclassical') return 'Versailles, France';
    if (plan.id === 'modern-3bed') return 'Kampala, Uganda';
    return 'Entebbe, Uganda';
  };

  const getBuiltUpArea = (plan: ArchitecturalPlan) => {
    const rawVal = plan.sqft;
    const numVal = parseSqft(rawVal);
    if (typeof rawVal === 'string' && rawVal.toLowerCase().includes('x')) {
      return `${rawVal} sqft (${Math.round(numVal / 10.764)} sqm)`;
    }
    if (numVal < 1000 && numVal > 0) {
      return `${formatSqft(rawVal)} sqm`;
    }
    return `${formatSqft(rawVal)} sqft (${Math.round(numVal / 10.764)} sqm)`;
  };

  const getProjectYear = (plan: ArchitecturalPlan) => {
    if (plan.id === 'virelia-grand') return '2022';
    if (plan.id === 'obsidian') return '2023';
    if (plan.id === 'crestview') return '2024';
    if (plan.id === 'modern-tropical') return '2023';
    if (plan.id === 'aurora-crest') return '2024';
    if (plan.id === 'luxury-classical') return '2021';
    if (plan.id === 'cascadia-resort') return '2024';
    if (plan.id === 'azure-oasis') return '2023';
    if (plan.id === 'luxury-neoclassical') return '2022';
    return '2025';
  };

  const getProjectStatus = (plan: ArchitecturalPlan) => {
    if (plan.id === 'virelia-grand') return 'Design Stage';
    if (plan.id === 'obsidian') return 'Permit Approved';
    if (plan.id === 'crestview') return 'Builder Ready';
    if (plan.category === 'Hospitality' || plan.category === 'Commercial') return 'Design Stage';
    return 'Builder Ready';
  };

  const getProjectFloors = (plan: ArchitecturalPlan) => {
    if (plan.id === 'virelia-grand') return '29';
    return String(plan.stories);
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'Hospitality') return 'Hotel';
    return cat;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-8 lg:p-10">
      {/* Modal Container */}
      <div className="bg-stone-950 text-white rounded-3xl w-full max-w-7xl h-[92vh] md:h-[88vh] border border-stone-850 shadow-[0_50px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative animate-scale-up">
        
        {/* Top Sticky Header */}
        <div className="bg-stone-900 border-b border-stone-850 py-4 px-6 md:px-8 flex justify-between items-center z-20 shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-[#1B4332] text-white font-mono text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm">
              {plan.style}
            </span>
            <span className="font-mono text-xs text-stone-400 hidden sm:inline">
              Project No: {plan.projectNo || `ORN-${plan.id.toUpperCase()}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleFavorite(plan)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isFav
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm shadow-[#1B4332]/20'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
              }`}
              title={isFav ? "Saved to Favorites" : "Save Blueprint"}
            >
              <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-full transition-colors cursor-pointer border border-stone-800"
              aria-label="Close details"
              id="close-detail-modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body split into sections */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10 space-y-12">
          
          {/* ==========================================
              PORTFOLIO COVER SHEET SECTION (AS REQUESTED)
              ========================================== */}
          <section className="space-y-4">
            {/* Immersive Header Image Card */}
            <div
              className="relative h-[250px] sm:h-[350px] md:h-[420px] lg:h-[480px] w-full bg-stone-900 overflow-hidden rounded-2xl border border-stone-850 shadow-[0_4px_30px_rgba(0,0,0,0.5)] flex flex-col justify-end p-6 sm:p-10 md:p-12 transition-all duration-300"
            >
              {/* Cover Background Image or Video walk-through */}
              {mediaItems[activeSlideIdx]?.type === 'video' ? (
                isDataVideo(mediaItems[activeSlideIdx].url) ? (
                  <video
                    src={mediaItems[activeSlideIdx].url}
                    className="absolute inset-0 h-full w-full object-cover z-0 animate-fade-in"
                    controls
                    playsInline
                    autoPlay
                    muted
                  />
                ) : isEmbedVideo(mediaItems[activeSlideIdx].url) ? (
                  <iframe
                    src={getEmbedVideoUrl(mediaItems[activeSlideIdx].url)}
                    className="absolute inset-0 h-full w-full object-cover z-0 animate-fade-in"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={mediaItems[activeSlideIdx].url}
                    className="absolute inset-0 h-full w-full object-cover z-0 animate-fade-in"
                    controls
                    playsInline
                    autoPlay
                    muted
                  />
                )
              ) : (
                <img
                  src={mediaItems[activeSlideIdx]?.url}
                  alt={plan.name}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
                />
              )}
              {/* Elegant dark gradient overlay for typography visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none" />
              
              {/* Overlaid Info */}
              <div className="relative z-10 space-y-3 pointer-events-none select-none text-left">
                <span className="bg-[#1B4332] text-white text-[10px] sm:text-[11px] font-bold uppercase px-3.5 py-1.5 rounded-md tracking-wider inline-block">
                  {getProjectStatus(plan)}
                </span>
                <h1 className="font-sans font-semibold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight max-w-4xl drop-shadow-md">
                  {plan.name} – {getPlanLocation(plan)}
                </h1>
              </div>

              {/* Slide Navigation Left/Right Buttons */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIdx((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-25 p-2 rounded-full bg-black/45 hover:bg-black/75 border border-white/10 text-white transition-all cursor-pointer"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSlideIdx((prev) => (prev + 1) % mediaItems.length);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-25 p-2 rounded-full bg-black/45 hover:bg-black/75 border border-white/10 text-white transition-all cursor-pointer"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Immersive Slideshow Click Overlay with Premium Hover Effect */}
              {mediaItems[activeSlideIdx]?.type === 'image' && (
                <div 
                  onClick={() => onOpenSlideshow && onOpenSlideshow(plan, activeSlideIdx)}
                  className="absolute inset-0 z-10 cursor-pointer group"
                  title="Click to view full slideshow"
                >
                  {/* Premium, subtle overlay for instant discoverability */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-stone-950/80 backdrop-blur-md text-white text-[11px] font-mono font-bold tracking-wider uppercase px-4 py-2.5 rounded-xl border border-stone-850 transition-all duration-300 transform translate-y-1.5 group-hover:translate-y-0 flex items-center gap-2 shadow-lg">
                      <Maximize2 className="h-4 w-4 text-[#84e114]" />
                      <span>Launch Slideshow ({planImages.length} Photos)</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Image Download Buttons positioned absolutely */}
              <div className="absolute top-6 right-6 flex items-center gap-2 z-30">
                {mediaItems[activeSlideIdx]?.type === 'image' && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.disabled = true;
                      btn.innerHTML = `
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></svg>
                      `;
                      try {
                        const { downloadWatermarkedImage } = await import('../utils/watermark');
                        await downloadWatermarkedImage(mediaItems[activeSlideIdx].url, plan.name, plan.projectNo);
                      } catch (err) {
                        console.error("Watermark download failed:", err);
                      } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                      }
                    }}
                    className="bg-stone-900/80 hover:bg-stone-800 backdrop-blur-md text-white border border-stone-800 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center focus:outline-none"
                    title="Download current slide render"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                )}
                {planImages.length > 0 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget;
                      const originalHTML = btn.innerHTML;
                      btn.disabled = true;
                      btn.innerHTML = `
                        <svg class="animate-spin h-4 w-4 text-[#84e114]" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></svg>
                      `;
                      try {
                        const { downloadWatermarkedImage } = await import('../utils/watermark');
                        for (let i = 0; i < planImages.length; i++) {
                          const imgUrl = planImages[i];
                          const customName = `${plan.name} Image ${i + 1}`;
                          await downloadWatermarkedImage(imgUrl, customName, plan.projectNo);
                          if (i < planImages.length - 1) {
                            await new Promise((r) => setTimeout(r, 600));
                          }
                        }
                      } catch (err) {
                        console.error("Bulk watermark download failed:", err);
                      } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                      }
                    }}
                    className="bg-stone-900/80 hover:bg-stone-800 text-[#84e114] hover:text-[#84e114]/90 border border-stone-800 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                    title="Download all project images"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">All ({planImages.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Slide thumbnails */}
            {mediaItems.length > 1 && (
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {mediaItems.map((item, idx) => {
                  const isVid = item.type === 'video';
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSlideIdx(idx)}
                      className={`relative h-11 w-18 sm:h-14 sm:w-24 rounded-lg border transition-all shrink-0 cursor-pointer overflow-hidden ${
                        activeSlideIdx === idx ? 'border-[#84e114] ring-1 ring-[#84e114]' : 'border-stone-800 hover:border-stone-600'
                      }`}
                    >
                      {isVid ? (
                        <div className="h-full w-full bg-stone-900 flex flex-col items-center justify-center relative">
                          {isDataVideo(item.url) ? (
                            <video src={item.url} className="h-full w-full object-cover opacity-70" muted controls={false} />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-stone-950 text-stone-500">
                              <Video className="h-4 w-4 text-[#84e114]/80" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <Play className="h-3.5 w-3.5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={item.url} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Premium Bento Grid of Key Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {/* Bento 1: Built-up Area */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Ruler className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Plot Size</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight">{getBuiltUpArea(plan)}</span>
                </div>
              </div>

              {/* Bento 2: Year */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Calendar className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Year</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight">{getProjectYear(plan)}</span>
                </div>
              </div>

              {/* Bento 3: Location */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <MapPin className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Location</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight break-words">{getPlanLocation(plan)}</span>
                </div>
              </div>

              {/* Bento 4: Status */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Clock className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Status</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight">{getProjectStatus(plan)}</span>
                </div>
              </div>

              {/* Bento 5: Category */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Home className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Category</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight">{plan.category}</span>
                </div>
              </div>

              {/* Bento 6: Floors */}
              <div className="bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Layers className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Floors</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight">{getProjectFloors(plan)}</span>
                </div>
              </div>

              {/* Bento 7: Style */}
              <div className="col-span-2 bg-stone-900/60 border border-stone-850 rounded-2xl p-3 sm:p-5 flex items-center gap-2.5 sm:gap-3.5 transition-all hover:border-stone-700 hover:bg-stone-900/80 shadow-md">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[#1B4332]/25 border border-[#1B4332]/30 text-[#84e114] shrink-0">
                  <Building2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] sm:text-[10px] font-mono font-medium text-stone-400 tracking-wider uppercase block mb-0.5">Style</span>
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-stone-100 font-sans tracking-tight block leading-tight capitalize">{plan.style.toLowerCase()}</span>
                </div>
              </div>
            </div>

            {/* Action link and divider line */}
            <div className="flex justify-start border-b border-stone-850 pb-8">
              <button
                onClick={() => {
                  if (onSelectCategory) {
                    onSelectCategory(plan.category);
                  }
                  onClose();
                }}
                className="group font-sans text-[#84e114] hover:text-[#9fe34d] text-sm font-semibold tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer outline-none"
              >
                <span>View more {getCategoryLabel(plan.category)} projects</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* About the Project Overview */}
            <div className="space-y-4 max-w-4xl">
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">About the Project</h2>
              <div className="flex items-center gap-2 text-stone-400 font-sans text-xs sm:text-sm font-medium">
                <span role="img" aria-label="world">🌏</span>
                <span>Project Overview</span>
              </div>
              <p className="font-sans font-light text-stone-300 text-sm sm:text-base leading-relaxed">
                {plan.description}
              </p>
            </div>
          </section>

          {/* ==========================================
              INTERACTIVE SPECIFICATIONS & LICENSING SET
              ========================================== */}
          <section className="space-y-6 pt-6 border-t border-stone-850">
            <div>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
                Interactive Engineering & Blueprint Set
              </h2>
              <p className="text-xs text-stone-400 font-light mt-1">
                Explore individual room metrics below and choose a licensing set suited for local structural compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: SVG Layouts & Room Schedules */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* SVG Blueprint Viewer */}
                <div className="border border-stone-850 bg-stone-900/40 rounded-2xl p-4 sm:p-6 shadow-md relative">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-800">
                    <div>
                      <h4 className="font-sans font-semibold text-sm text-stone-100 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#84e114]" />
                        <span>Interactive Layout Blueprint</span>
                      </h4>
                    </div>

                    {/* Multi-Floor Level Tabs */}
                    {plan.floors.length > 1 && (
                      <div className="flex bg-stone-900 p-1 rounded-lg self-start sm:self-auto border border-stone-800">
                        {plan.floors.map((floor, idx) => (
                          <button
                            key={floor.name}
                            onClick={() => {
                              setActiveFloorIdx(idx);
                              setActiveRoom(null);
                            }}
                            className={`px-3 py-1.5 rounded-md font-display font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                              activeFloorIdx === idx
                                ? 'bg-stone-800 text-white'
                                : 'text-stone-400 hover:text-stone-200'
                            }`}
                          >
                            {floor.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    {/* SVG Vector Canvas */}
                    <div className="md:col-span-7 bg-[#131922] aspect-square rounded-xl overflow-hidden border border-stone-800 relative shadow-lg">
                      <svg viewBox="0 0 100 100" className="w-full h-full text-stone-300 font-mono">
                        <defs>
                          <pattern id="modal-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" strokeWidth="0.04" opacity="0.1" />
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#modal-grid)" />

                        {/* Boundary setbacks */}
                        <rect x="4" y="4" width="92" height="92" fill="none" stroke="#1B4332" strokeWidth="0.3" strokeDasharray="1,1" opacity="0.3" />

                        {/* Room vector boxes */}
                        {currentFloor.rooms.map((room) => {
                          const isHovered = activeRoom?.id === room.id;
                          return (
                            <g
                              key={room.id}
                              className="cursor-pointer group"
                              onMouseEnter={() => setActiveRoom(room)}
                              onMouseLeave={() => setActiveRoom(null)}
                            >
                              <rect
                                x={room.x}
                                y={room.y}
                                width={room.width}
                                height={room.height}
                                fill={isHovered ? '#1B4332' : '#1e293b'}
                                fillOpacity={isHovered ? '0.25' : '0.4'}
                                stroke={isHovered ? '#84e114' : '#94a3b8'}
                                strokeWidth={isHovered ? '0.8' : '0.4'}
                                className="transition-all duration-300"
                              />
                              {/* Inner door arches */}
                              {room.width > 15 && (
                                <path
                                  d={`M ${room.x + 2} ${room.y} A 5 5 0 0 0 ${room.x + 7} ${room.y + 5}`}
                                  fill="none"
                                  stroke={isHovered ? '#84e114' : '#1B4332'}
                                  strokeWidth="0.3"
                                  opacity="0.5"
                                  className="transition-all duration-300"
                                />
                              )}
                              <text
                                x={room.x + room.width / 2}
                                y={room.y + room.height / 2}
                                textAnchor="middle"
                                fontSize="3.5"
                                fill={isHovered ? '#e2cfb6' : '#ffffff'}
                                className="font-bold select-none transition-colors duration-300"
                              >
                                {room.name}
                              </text>
                              <text
                                x={room.x + room.width / 2}
                                y={room.y + room.height / 2 + 4.5}
                                textAnchor="middle"
                                fontSize="2.2"
                                fill={isHovered ? '#ffffff' : '#94a3b8'}
                                className="select-none font-light transition-colors duration-300"
                              >
                                {room.dimensions}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Room Metadata Bubble */}
                      {activeRoom && (
                        <div className="absolute bottom-4 left-4 right-4 bg-stone-900/95 border border-stone-800 p-3 rounded-lg text-white font-sans animate-fade-in shadow-2xl">
                          <span className="font-mono text-[9px] tracking-widest text-[#84e114] uppercase font-bold block mb-0.5">
                            ROOM INSIGHT
                          </span>
                          <h5 className="font-sans font-semibold text-xs text-stone-100">
                            {activeRoom.name} ({activeRoom.dimensions})
                          </h5>
                          <p className="text-[10.5px] text-stone-300 mt-1 font-light leading-relaxed">
                            {activeRoom.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Room List with Highlights on Hover */}
                    <div className="md:col-span-5 flex flex-col justify-between">
                      <div>
                        <span className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold block mb-3">
                          Room Schedules
                        </span>
                        <div className="space-y-2 max-h-[230px] overflow-y-auto pr-2">
                          {currentFloor.rooms.map((room) => {
                            const isHovered = activeRoom?.id === room.id;
                            return (
                              <div
                                key={room.id}
                                className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                                  isHovered
                                    ? 'bg-[#1B4332]/35 border-[#84e114] translate-x-1'
                                    : 'bg-stone-900/60 border-stone-800 hover:bg-stone-800 text-stone-200'
                                }`}
                                onMouseEnter={() => setActiveRoom(room)}
                                onMouseLeave={() => setActiveRoom(null)}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-sans font-medium text-xs">
                                    {room.name}
                                  </span>
                                  <span className="font-mono text-[10px] font-semibold text-stone-400">
                                    {room.dimensions}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Metric summary */}
                      <div className="bg-stone-900/60 border border-stone-850 rounded-xl p-4 mt-6 text-stone-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Ruler className="h-4 w-4 text-[#84e114]" />
                          <span className="font-semibold text-xs uppercase tracking-wide font-mono">Building Environs</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-stone-400 block text-[9.5px]">Width footprint</span>
                            <span className="font-semibold font-mono text-stone-200">{plan.width}</span>
                          </div>
                          <div>
                            <span className="text-stone-400 block text-[9.5px]">Depth footprint</span>
                            <span className="font-semibold font-mono text-stone-200">{plan.depth}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Engineering Specs & Purchase Panel */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Engineering Specifications list */}
                <div className="border border-stone-850 bg-stone-900/40 rounded-xl p-5">
                  <h4 className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold mb-4">
                    Engineering Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs text-stone-200">
                    <div className="border-b border-stone-850 pb-2">
                      <span className="text-stone-400 block text-[10px]">Plot Size</span>
                      <span className="font-semibold font-mono">{plan.sqft.toLocaleString()} Sq. Ft.</span>
                    </div>
                    <div className="border-b border-stone-850 pb-2">
                      <span className="text-stone-400 block text-[10px]">Total Stories</span>
                      <span className="font-semibold font-mono">{plan.stories} Story</span>
                    </div>
                    <div className="border-b border-stone-850 pb-2">
                      <span className="text-stone-400 block text-[10px]">Garage Space</span>
                      <span className="font-semibold font-mono">{plan.garageBays > 0 ? `${plan.garageBays} Car Bays` : "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Pricing Options Selector */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-sans font-semibold text-sm text-stone-200">
                      Select Blueprint Package
                    </h4>
                    <span className="font-mono text-xs text-[#84e114] font-semibold flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" /> Digital Delivery
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Standard PDF Option */}
                    <label
                      className={`border rounded-xl p-4 flex justify-between items-center cursor-pointer transition-all ${
                        selectedLicense === 'Standard PDF'
                          ? 'border-[#84e114] bg-[#1B4332]/25 ring-1 ring-[#84e114]'
                          : 'border-stone-850 bg-stone-900/40 hover:bg-stone-900/80 text-stone-200'
                      }`}
                    >
                      <div className="flex gap-3 items-start pr-4">
                        <input
                          type="radio"
                          name="license-type"
                          checked={selectedLicense === 'Standard PDF'}
                          onChange={() => setSelectedLicense('Standard PDF')}
                          className="mt-1 accent-[#84e114]"
                        />
                        <div>
                          <span className="font-sans font-semibold text-stone-100 text-sm block">Standard PDF Set</span>
                          <span className="font-sans font-light text-stone-400 text-xs block mt-0.5">
                            Single build construction license. PDF schematics emailed instantly.
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-stone-100 text-sm shrink-0">
                        $ {plan.price.toLocaleString()}
                      </span>
                    </label>

                    {/* CAD Unlimited Option */}
                    <label
                      className={`border rounded-xl p-4 flex justify-between items-center cursor-pointer transition-all ${
                        selectedLicense === 'CAD Unlimited'
                          ? 'border-[#84e114] bg-[#1B4332]/25 ring-1 ring-[#84e114]'
                          : 'border-stone-850 bg-stone-900/40 hover:bg-stone-900/80 text-stone-200'
                      }`}
                    >
                      <div className="flex gap-3 items-start pr-4">
                        <input
                          type="radio"
                          name="license-type"
                          checked={selectedLicense === 'CAD Unlimited'}
                          onChange={() => setSelectedLicense('CAD Unlimited')}
                          className="mt-1 accent-[#84e114]"
                        />
                        <div>
                          <span className="font-sans font-semibold text-stone-100 text-sm block flex items-center gap-1.5">
                            <span>CAD Unlimited Set</span>
                            <span className="bg-green-950 border border-green-800 text-green-400 font-mono text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded-sm uppercase">
                              RECOMMENDED
                            </span>
                          </span>
                          <span className="font-sans font-light text-stone-400 text-xs block mt-0.5">
                            Includes fully editable .DWG vector files. Ideal for local engineering stamps.
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-stone-100 text-sm shrink-0">
                        + $ {(licensePriceModifier['CAD Unlimited']).toLocaleString()}
                      </span>
                    </label>

                    {/* MEP Pack Option */}
                    <label
                      className={`border rounded-xl p-4 flex justify-between items-center cursor-pointer transition-all ${
                        selectedLicense === 'Full MEP Pack'
                          ? 'border-[#84e114] bg-[#1B4332]/25 ring-1 ring-[#84e114]'
                          : 'border-stone-850 bg-stone-900/40 hover:bg-stone-900/80 text-stone-200'
                      }`}
                    >
                      <div className="flex gap-3 items-start pr-4">
                        <input
                          type="radio"
                          name="license-type"
                          checked={selectedLicense === 'Full MEP Pack'}
                          onChange={() => setSelectedLicense('Full MEP Pack')}
                          className="mt-1 accent-[#84e114]"
                        />
                        <div>
                          <span className="font-sans font-semibold text-stone-100 text-sm block">Full MEP Engineering Pack</span>
                          <span className="font-sans font-light text-stone-400 text-xs block mt-0.5">
                            CAD set plus complete Mechanical, Electrical, and Plumbing schematics.
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-stone-100 text-sm shrink-0">
                        + $ {(licensePriceModifier['Full MEP Pack']).toLocaleString()}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Checkout pricing sum & CTA button */}
                <div className="pt-4 border-t border-stone-850 space-y-4">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-widest">Total Price</span>
                      <span className="text-stone-400 text-xs block">Includes full licensing permissions</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-2xl sm:text-3xl font-bold text-[#84e114]">$ {finalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Purchase Action */}
                    <button
                      onClick={handleCheckoutClick}
                      className="w-full bg-[#1B4332] hover:bg-[#153427] border border-[#1b4332] text-white py-4 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <CreditCard className="h-4.5 w-4.5 group-hover:scale-110 transition-transform text-[#84e114]" />
                      <span>Proceed to Payment</span>
                    </button>

                    {/* Modification Action */}
                    <button
                      onClick={() => onOpenModification(plan)}
                      className="w-full bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white py-4 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-200 border border-stone-800 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Sparkles className="h-4.5 w-4.5 text-[#84e114]" />
                      <span>Request Customization</span>
                    </button>
                  </div>
                </div>

                {/* Inclusions information box */}
                <div className="bg-stone-900/40 rounded-xl p-5 border border-stone-850 text-stone-300 font-display text-xs">
                  <span className="font-mono text-[9px] tracking-widest font-bold text-stone-400 uppercase block mb-3">
                    INCLUDED WITH EVERY PRINT PACKAGE
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-300">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Detailed Framing Layouts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Foundation Details (Slab/Bsmnt)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Electrical Schedules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Cabinet Elevations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Material Take-off Lists</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-[#84e114] shrink-0" />
                      <span>Full Cross-Section Profiles</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
