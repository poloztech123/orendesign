import React, { useState } from 'react';
import { Heart, Search, Filter, RefreshCw, Layers, ArrowUpRight, Maximize2 } from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { formatSqft } from '../utils/sqft';

interface PlanGridProps {
  plans: ArchitecturalPlan[];
  savedPlans: ArchitecturalPlan[];
  onToggleFavorite: (plan: ArchitecturalPlan) => void;
  onSelectPlan: (plan: ArchitecturalPlan) => void;
  activeStyle: string | null;
  onClearStyle: () => void;
  searchParams: { beds: string; baths: string; maxSqft: string };
  onClearSearch: () => void;
  onImageClick?: (plan: ArchitecturalPlan) => void;
}

export default function PlanGrid({
  plans,
  savedPlans,
  onToggleFavorite,
  onSelectPlan,
  activeStyle,
  onClearStyle,
  searchParams,
  onClearSearch,
  onImageClick
}: PlanGridProps) {
  // Store which plan ID is currently hovered for the transition
  const [hoveredPlanId, setHoveredPlanId] = useState<string | null>(null);

  const isFavorite = (planId: string) => savedPlans.some((p) => p.id === planId);

  // Helper to render a beautiful stylized SVG floor plan representation
  const renderMiniFloorPlan = (plan: ArchitecturalPlan) => {
    const mainLevel = plan.floors[0]; // Ground level rooms
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full text-stone-300 font-mono"
        style={{ backgroundColor: '#131922' }} // Dark technical slate blueprint background
      >
        {/* Draw blueprint grid lines */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff" strokeWidth="0.04" opacity="0.1" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)" />

        {/* Outer border / setback lines */}
        <rect x="5" y="5" width="90" height="90" fill="none" stroke="#1B4332" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.5" />
        <text x="50" y="8" textAnchor="middle" fontSize="3" fill="#1B4332" opacity="0.8" className="font-bold uppercase tracking-widest">
          FL.01 - GROUND LEVEL
        </text>

        {/* Draw rooms as sleek vector shapes */}
        {mainLevel.rooms.map((room) => (
          <g key={room.id} className="transition-all duration-300 hover:opacity-80 cursor-pointer">
            <rect
              x={room.x}
              y={room.y}
              width={room.width}
              height={room.height}
              fill="#1e293b"
              fillOpacity="0.4"
              stroke="#cbe3db"
              strokeWidth="0.45"
            />
            {/* Draw standard doors (small 45-deg arches) inside rooms occasionally */}
            {room.width > 15 && (
              <path
                d={`M ${room.x + 2} ${room.y} A 5 5 0 0 0 ${room.x + 7} ${room.y + 5}`}
                fill="none"
                stroke="#1B4332"
                strokeWidth="0.3"
                opacity="0.6"
              />
            )}
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2}
              textAnchor="middle"
              fontSize="3.2"
              fill="#ffffff"
              className="font-bold select-none"
            >
              {room.name}
            </text>
            <text
              x={room.x + room.width / 2}
              y={room.y + room.height / 2 + 4}
              textAnchor="middle"
              fontSize="2"
              fill="#1B4332"
              className="select-none font-light"
            >
              {room.dimensions}
            </text>
          </g>
        ))}

        {/* Legend in corner */}
        <text x="8" y="93" fontSize="2" fill="#1B4332" className="opacity-80">
          SCALE: 1/4&quot; = 1&apos;-0&quot;
        </text>
        <text x="92" y="93" textAnchor="end" fontSize="2" fill="#94a3b8" className="opacity-80">
          {plan.width} W x {plan.depth} D
        </text>
      </svg>
    );
  };

  const hasSearchFilter = searchParams.beds !== 'Any' || searchParams.baths !== 'Any' || searchParams.maxSqft !== '';

  return (
    <section id="trending-plans" className="bg-stone-50 py-20 border-t border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dynamic Section Header & Filtering Badges */}
        <div className="border-b border-stone-200 pb-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="font-mono text-xs tracking-[0.2em] text-[#1B4332] font-bold uppercase block mb-3">
                Architectural Catalog
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
                {activeStyle ? `${activeStyle}` : hasSearchFilter ? "Filtered Blueprints" : "Trending Blueprints"}
              </h2>
              <p className="font-display text-sm sm:text-base text-stone-500 font-light mt-2 max-w-xl">
                Our most sought-after designs. Scroll over cards to visualize structured layout schematics instantly.
              </p>
            </div>

            {/* Filter Indicators / Clear Controls */}
            <div className="flex flex-wrap gap-2">
              {activeStyle && (
                <div className="inline-flex items-center gap-1.5 bg-stone-900 text-stone-100 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-800">
                  <span>Collection: {activeStyle}</span>
                  <button onClick={onClearStyle} className="hover:text-[#84e114] p-0.5 cursor-pointer" title="Remove filter">
                    &times;
                  </button>
                </div>
              )}
              {hasSearchFilter && (
                <div className="inline-flex items-center gap-1.5 bg-stone-900 text-stone-100 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-800">
                  <span>
                    Search: {searchParams.beds !== 'Any' ? `${searchParams.beds}+ Beds` : ''} 
                    {searchParams.baths !== 'Any' ? ` • ${searchParams.baths}+ Baths` : ''}
                    {searchParams.maxSqft !== '' ? ` • Max ${searchParams.maxSqft} SF` : ''}
                  </span>
                  <button onClick={onClearSearch} className="hover:text-[#84e114] p-0.5 cursor-pointer" title="Remove search filters">
                    &times;
                  </button>
                </div>
              )}
              {(activeStyle || hasSearchFilter) && (
                <button
                  onClick={() => {
                    onClearStyle();
                    onClearSearch();
                  }}
                  className="inline-flex items-center gap-1 bg-white hover:bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-200 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Blueprint Product Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-100 max-w-3xl mx-auto shadow-sm p-8">
            <Filter className="h-12 w-12 mx-auto mb-4 text-stone-300 animate-pulse" />
            <h3 className="font-serif text-xl font-medium text-stone-800 mb-2">No Matching Blueprints Found</h3>
            <p className="font-display font-light text-stone-500 text-sm max-w-md mx-auto mb-6">
              There are currently no pre-made layouts meeting your specific parameters. You can broaden your filter inputs or contact our design desk to custom design a house from scratch.
            </p>
            <button
              onClick={() => {
                onClearStyle();
                onClearSearch();
              }}
              className="bg-stone-900 hover:bg-[#1B4332] text-white px-6 py-3 rounded-xl font-display font-semibold text-sm transition-colors duration-300 shadow-sm cursor-pointer"
            >
              View Full Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-stone-100 shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(12,10,9,0.06)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col overflow-hidden group"
                onMouseEnter={() => setHoveredPlanId(plan.id)}
                onMouseLeave={() => setHoveredPlanId(null)}
                id={`plan-card-${plan.id}`}
              >
                {/* Visual Section with transition hover */}
                <div 
                  onClick={() => onImageClick ? onImageClick(plan) : onSelectPlan(plan)} 
                  className="relative aspect-[4/3] overflow-hidden bg-stone-900 cursor-pointer group/img"
                  title="Click cover image to view photo slideshow"
                >
                  {/* Photo Container */}
                  <img
                    src={plan.image}
                    alt={plan.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover/img:scale-105"
                  />

                  {/* Elegant Hover Slideshow Indicator */}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/35 transition-all duration-300 flex items-center justify-center">
                    <span className="opacity-0 group-hover/img:opacity-100 bg-stone-950/80 backdrop-blur-md text-white text-[10px] font-mono font-bold tracking-wider uppercase px-3.5 py-2 rounded-lg border border-stone-850 transition-all duration-300 transform translate-y-1.5 group-hover/img:translate-y-0 flex items-center gap-1.5 shadow-md">
                      <Maximize2 className="h-3.5 w-3.5 text-[#84e114]" />
                      <span>View Slideshow</span>
                    </span>
                  </div>

                  {/* Favorite heart toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(plan);
                    }}
                    className={`absolute top-4 right-4 p-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isFavorite(plan.id)
                        ? 'bg-[#1B4332] text-white shadow-md shadow-[#1B4332]/20 scale-110'
                        : 'bg-white/80 hover:bg-white text-stone-700 shadow-sm hover:scale-110 hover:text-[#1B4332]'
                    }`}
                    title={isFavorite(plan.id) ? "Remove from Saved" : "Save blueprint"}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(plan.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Dynamic Watermark Download Control */}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const btn = e.currentTarget;
                      const originalHTML = btn.innerHTML;
                      btn.disabled = true;
                      btn.innerHTML = `
                        <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      `;
                      try {
                        const { downloadWatermarkedImage } = await import('../utils/watermark');
                        await downloadWatermarkedImage(plan.image, plan.name, plan.projectNo);
                      } catch (err) {
                        console.error("Watermark download failed:", err);
                      } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                      }
                    }}
                    className="absolute top-16 right-4 p-2.5 bg-white/80 hover:bg-white text-stone-700 hover:text-[#84e114] rounded-full shadow-sm hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer focus:outline-none"
                    title="Download watermarked image render"
                    id={`download-render-${plan.id}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>

                  {/* Dynamic Watermark Bulk Download Control */}
                  {plan.images && plan.images.length > 0 && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const btn = e.currentTarget;
                        const originalHTML = btn.innerHTML;
                        btn.disabled = true;
                        btn.innerHTML = `
                          <svg class="animate-spin h-3.5 w-3.5 text-[#84e114]" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        `;
                        try {
                          const { downloadWatermarkedImage } = await import('../utils/watermark');
                          const imgs = plan.images;
                          for (let i = 0; i < imgs.length; i++) {
                            const imgUrl = imgs[i];
                            const customName = `${plan.name} Image ${i + 1}`;
                            await downloadWatermarkedImage(imgUrl, customName, plan.projectNo);
                            if (i < imgs.length - 1) {
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
                      className="absolute top-28 right-4 px-2 py-1.5 bg-white/90 hover:bg-white text-[#84e114] hover:text-[#84e114]/90 rounded-xl shadow-md hover:scale-110 transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer focus:outline-none"
                      title="Download all project images"
                      id={`bulk-download-${plan.id}`}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-[9px] font-mono font-bold pr-0.5">All ({plan.images.length})</span>
                    </button>
                  )}

                  {/* Floating Style Badge */}
                  <span className="absolute top-4 left-4 bg-stone-900/70 backdrop-blur-md border border-white/10 text-white text-[9px] font-mono tracking-widest font-semibold uppercase px-2.5 py-1 rounded-sm shadow-sm pointer-events-none">
                    {plan.style.replace(" Collection", "").replace(" & Mansions", "")}
                  </span>
                </div>

                {/* Metadata & Pricing Details */}
                <div className="p-6 md:p-7 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header line & Arrow */}
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-serif text-xl font-semibold text-stone-900 group-hover:text-[#1B4332] transition-colors duration-300 leading-snug">
                        {plan.name}
                      </h3>
                      <button
                        onClick={() => onSelectPlan(plan)}
                        className="p-1 rounded-full text-stone-300 group-hover:text-[#1B4332] group-hover:bg-green-50/50 transition-all duration-300 cursor-pointer"
                      >
                        <ArrowUpRight className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="font-display font-light text-stone-400 text-xs uppercase tracking-wider mb-4 leading-none">
                      {plan.subtitle}
                    </p>

                    {/* Metric Specifications ribbon */}
                    <div className="bg-stone-50 border border-stone-100 rounded-lg py-2.5 px-3.5 flex justify-between text-center items-center mb-5 font-display text-xs">
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-mono tracking-wider">Sq. Footage</span>
                        <span className="font-semibold text-stone-800 font-mono">{formatSqft(plan.sqft)} SF</span>
                      </div>
                      <div className="h-6 w-px bg-stone-200" />
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-mono tracking-wider">Bedrooms</span>
                        <span className="font-semibold text-stone-800 font-mono">{plan.beds} Beds</span>
                      </div>
                      <div className="h-6 w-px bg-stone-200" />
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-mono tracking-wider">Bathrooms</span>
                        <span className="font-semibold text-stone-800 font-mono">{plan.baths} Baths</span>
                      </div>
                    </div>
                  </div>

                  {/* Card footer CTA with Pricing */}
                  <div className="flex justify-between items-center pt-4 border-t border-stone-100 mt-2">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">Licensing From</span>
                      <span className="text-lg md:text-xl font-bold font-mono text-stone-900">
                        $ {plan.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectPlan(plan)}
                      className="bg-stone-900 hover:bg-[#1B4332] text-white px-5 py-2.5 rounded-lg font-display font-semibold text-xs transition-colors duration-300 flex items-center gap-1.5 shadow-sm hover:shadow group/btn cursor-pointer"
                    >
                      <span>Explore Plan</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
