import React, { useRef } from 'react';
import { ARCHITECTURAL_PLANS } from '../data';
import { ArchitecturalPlan } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatSqft } from '../utils/sqft';

export const DEFAULT_TRENDING_IDS: string[] = [];

export const DEFAULT_MOST_VIEWED_IDS: string[] = [];

export const isPlanTrending = (p: ArchitecturalPlan) => {
  return p.isTrending === true;
};

export const isPlanMostViewed = (p: ArchitecturalPlan) => {
  return p.isMostViewed === true;
};

interface RibbonProps {
  plans?: ArchitecturalPlan[];
  onSelectPlan?: (plan: ArchitecturalPlan) => void;
  onImageClick?: (plan: ArchitecturalPlan) => void;
}

export default function Ribbon({ plans, onSelectPlan, onImageClick }: RibbonProps) {
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);

  const catalogPlans = plans || ARCHITECTURAL_PLANS;

  const getPlanListItem = (p: ArchitecturalPlan) => ({
    id: p.id,
    displayName: p.name,
    specs: `${p.beds} Bed · ${p.baths} Bath · ${formatSqft(p.sqft)} sqft`
  });

  const trendingPlans = catalogPlans
    .filter(isPlanTrending)
    .map(getPlanListItem);

  const mostViewedPlans = catalogPlans
    .filter(isPlanMostViewed)
    .map(getPlanListItem);

  if (catalogPlans.length === 0 || (trendingPlans.length === 0 && mostViewedPlans.length === 0)) {
    return null;
  }

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.75;
      ref.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleCardClick = (planId: string) => {
    const realPlan = catalogPlans.find(p => p.id === planId);
    if (realPlan) {
      if (onImageClick) {
        onImageClick(realPlan);
      } else if (onSelectPlan) {
        onSelectPlan(realPlan);
      }
    }
  };

  return (
    <section className="bg-black text-white py-16 md:py-20 border-y border-stone-900 select-none overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Category 1: Trending This Week */}
        <div className="space-y-6 relative">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
                Trending This Week
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 font-sans font-light">
                Most viewed lately
              </p>
            </div>
            
            {/* Scroll buttons and indicators */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scroll(row1Ref, 'left')}
                className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer focus:outline-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll(row1Ref, 'right')}
                className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer focus:outline-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Carousel container */}
          <div
            ref={row1Ref}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {/* Inline style to hide scrollbar on Webkit */}
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            
            {trendingPlans.map((item) => {
              const realPlan = catalogPlans.find(p => p.id === item.id);
              const bgImg = realPlan?.image || "";
              return (
                <button
                  key={item.id}
                  onClick={() => handleCardClick(item.id)}
                  className="relative flex-shrink-0 w-[240px] sm:w-[280px] aspect-[3/4] rounded-2xl overflow-hidden snap-start group cursor-pointer text-left focus:outline-none transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-stone-900 bg-stone-900"
                  id={`trending-card-${item.id}`}
                >
                  {/* Background Image */}
                  {bgImg ? (
                    <img
                      src={bgImg}
                      alt={item.displayName}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Text Container */}
                  <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
                    <h3 className="font-sans font-semibold text-white text-sm sm:text-base leading-tight mb-1 group-hover:text-[#1B4332] transition-colors line-clamp-1">
                      {item.displayName}
                    </h3>
                    <p className="font-sans text-[11px] sm:text-xs text-stone-300 font-light line-clamp-1">
                      {item.specs}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category 2: Most Viewed */}
        <div className="space-y-6 relative">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
                Most Viewed
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-1 font-sans font-light">
                All-time favourites
              </p>
            </div>
            
            {/* Scroll buttons and indicators */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => scroll(row2Ref, 'left')}
                className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer focus:outline-none"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll(row2Ref, 'right')}
                className="p-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800 transition-all cursor-pointer focus:outline-none"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Carousel container */}
          <div
            ref={row2Ref}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {mostViewedPlans.map((item) => {
              const realPlan = catalogPlans.find(p => p.id === item.id);
              const bgImg = realPlan?.image || "";
              return (
                <button
                  key={item.id}
                  onClick={() => handleCardClick(item.id)}
                  className="relative flex-shrink-0 w-[240px] sm:w-[280px] aspect-[3/4] rounded-2xl overflow-hidden snap-start group cursor-pointer text-left focus:outline-none transition-all duration-300 hover:scale-[1.02] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-stone-900 bg-stone-900"
                  id={`mostviewed-card-${item.id}`}
                >
                  {/* Background Image */}
                  {bgImg ? (
                    <img
                      src={bgImg}
                      alt={item.displayName}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : null}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  {/* Text Container */}
                  <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col justify-end">
                    <h3 className="font-sans font-semibold text-white text-sm sm:text-base leading-tight mb-1 group-hover:text-[#1B4332] transition-colors line-clamp-1">
                      {item.displayName}
                    </h3>
                    <p className="font-sans text-[11px] sm:text-xs text-stone-300 font-light line-clamp-1">
                      {item.specs}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
