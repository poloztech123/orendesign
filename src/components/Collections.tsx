import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { ArchitecturalPlan } from '../types';

interface CollectionsProps {
  plans?: ArchitecturalPlan[];
  onSelectStyle: (style: string) => void;
  activeStyle: string | null;
}

export default function Collections({ plans = [], onSelectStyle, activeStyle }: CollectionsProps) {
  // If there are no plans yet, don't show fake collections with placeholder images
  if (!plans || plans.length === 0) {
    return null;
  }

  // Derive unique styles present in the added plans
  const stylesWithPlans = Array.from(new Set(plans.map((p) => p.style).filter(Boolean)));
  if (stylesWithPlans.length === 0) {
    return null;
  }

  const collections = stylesWithPlans.slice(0, 3).map((style, idx) => {
    const matchingPlan = plans.find((p) => p.style === style);
    const count = plans.filter((p) => p.style === style).length;
    return {
      id: style,
      title: `${style} Collection`,
      tagline: `${count} architectural blueprint${count > 1 ? 's' : ''} available in this category`,
      image: matchingPlan?.image || '',
      className: idx === 0 ? "md:col-span-8 md:row-span-2 h-[350px] md:h-[450px]" : "md:col-span-4 h-[180px] md:h-[213px]",
      badge: idx === 0 ? "Featured Series" : "Category"
    };
  });

  return (
    <section id="featured-collections" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
      {/* Header section with rich spacing */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <span className="font-mono text-xs tracking-[0.2em] text-[#1B4332] font-bold uppercase block mb-3">
            Design Classifications
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Featured Collections
          </h2>
          <p className="font-display text-sm sm:text-base text-stone-500 font-light mt-2 max-w-xl">
            Explore curated design collections matching your structural and aesthetic preferences.
          </p>
        </div>
        
        {activeStyle && (
          <button
            onClick={() => onSelectStyle('')}
            className="font-mono text-xs text-[#1B4332] hover:text-[#2D6A4F] font-bold uppercase tracking-wider underline cursor-pointer"
          >
            Clear Active Filter (Showing {activeStyle})
          </button>
        )}
      </div>

      {/* Asymmetric Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {collections.map((col) => {
          const isSelected = activeStyle === col.id;
          return (
            <button
              key={col.id}
              onClick={() => {
                onSelectStyle(col.id);
                // Scroll smoothly to trending-plans section
                const element = document.getElementById('trending-plans');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`relative overflow-hidden group rounded-2xl cursor-pointer text-left focus:outline-none transition-all duration-500 shadow-lg bg-stone-900 ${col.className} ${
                isSelected ? 'ring-4 ring-[#1B4332] scale-[0.99] shadow-inner' : 'hover:shadow-2xl'
              }`}
              id={`collection-card-${col.id.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {/* Background cover image or fallback gradient */}
              <div className="absolute inset-0">
                {col.image ? (
                  <img
                    src={col.image}
                    alt={col.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                    <Layers className="h-12 w-12 text-stone-700 opacity-40" />
                  </div>
                )}
                {/* Custom vignette gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/40 to-transparent transition-opacity duration-300 group-hover:opacity-95" />
                <div className="absolute inset-0 bg-stone-950/10 group-hover:bg-stone-900/30 transition-all duration-300" />
              </div>

              {/* Card Badge */}
              <div className="absolute top-5 left-5 bg-[#1B4332] text-white font-mono text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-sm shadow-sm z-10">
                {col.badge}
              </div>

              {/* Bottom text overlays */}
              <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 flex flex-col justify-end text-white z-10">
                <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-2 group-hover:text-[#cbe3db] transition-colors">
                  {col.title}
                </h3>
                <p className="font-display font-light text-stone-200 text-xs sm:text-sm max-w-lg mb-4 opacity-90 group-hover:opacity-100 transition-opacity">
                  {col.tagline}
                </p>
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#cbe3db] group-hover:translate-x-2 transition-transform duration-300">
                  <span>Browse Collection</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
