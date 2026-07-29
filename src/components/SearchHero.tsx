import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchHeroProps {
  onSearch: (beds: string, baths: string, maxSqft: string) => void;
  initialBeds: string;
  initialBaths: string;
  initialMaxSqft: string;
}

const slides = [
  {
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200",
    alt: "Luxury architectural residence at twilight",
    tag: "Elegance Redefined • Builder Ready Sets",
    description: "Discover a curated marketplace of premium blueprints, engineered for modern living, thermal efficiency, and rapid construction deployment."
  },
  {
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
    alt: "Sleek dark cladding obsidian residence",
    tag: "Ultra Modern • Obsidian Residence",
    description: "Bold charcoal tones meet minimalist architectural engineering. High-contrast glass structures designed for panoramic vista integration."
  },
  {
    image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=1200",
    alt: "Spacious luxury villa on hills",
    tag: "Hilltop Sanctuary • Crestview Villa",
    description: "Spacious open-concept living designed to harmonize with sloping terrains. Dynamic multi-level floor plans with expansive outdoor decks."
  },
  {
    image: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&q=80&w=1200",
    alt: "Warm contemporary modern farmhouse",
    tag: "Timeless Comfort • Modern Farmhouse",
    description: "A sophisticated blend of rustic warmth and clean-lined contemporary layouts. Perfect for family gathering spaces with high-efficiency framing."
  }
];

export default function SearchHero({
  onSearch,
  initialBeds,
  initialBaths,
  initialMaxSqft
}: SearchHeroProps) {
  const [beds, setBeds] = useState(initialBeds);
  const [baths, setBaths] = useState(initialBaths);
  const [maxSqft, setMaxSqft] = useState(initialMaxSqft);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(beds, baths, maxSqft);
    // Smooth scroll down to trending-plans section where results are shown
    const element = document.getElementById('trending-plans');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background image carousel with smooth cross-fade and zoom-in transitions */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentSlide}
            src={slides[currentSlide].image}
            alt={slides[currentSlide].alt}
            referrerPolicy="no-referrer"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1.06 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover filter brightness-75 contrast-[1.05]"
          />
        </AnimatePresence>
        {/* Subtle radial and linear gradients for extreme visual depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/30 via-stone-950/50 to-stone-950/80 z-1" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(12,10,9,0.7)_100%)] z-1" />
      </div>

      {/* Slide Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-pointer group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white border border-white/5 hover:border-white/20 transition-all duration-300 backdrop-blur-sm cursor-pointer group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 md:h-6 md:w-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-24 md:py-32">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Accent Ribbon */}
          <div className="h-8 flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg"
              >
                <Sparkles className="h-4 w-4 text-[#84e114]" />
                <span className="font-mono text-[10px] tracking-widest text-stone-200 uppercase font-semibold">
                  {slides[currentSlide].tag}
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Main Title - Serif Editorial Elegance */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tight leading-[1.1]">
            Architect-Designed Homes, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-stone-100 via-[#cbe3db] to-stone-100 italic font-normal">
              Ready to Build.
            </span>
          </h1>

          {/* Subtitle - Light high contrast body text with fixed height to prevent structural layout shifting */}
          <div className="h-20 sm:h-16 md:h-20 max-w-2xl mx-auto flex items-center justify-center overflow-hidden px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentSlide}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5 }}
                className="font-display text-sm sm:text-base md:text-lg text-stone-300 font-light leading-relaxed text-center"
              >
                {slides[currentSlide].description}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Slide Progress Indicators */}
          <div className="flex justify-center gap-3 pt-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="py-2 focus:outline-none cursor-pointer group"
                aria-label={`Go to slide ${idx + 1}`}
              >
                <div className="relative h-1 w-10 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 bg-gradient-to-r from-white via-[#cbe3db] to-white transition-all duration-500 ${
                      idx === currentSlide ? 'w-full' : 'w-0 group-hover:w-1/3'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* The Floating Instant Search Bar Container */}
        <div className="mt-12 md:mt-16 max-w-5xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/30 shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex flex-col md:flex-row gap-4 items-stretch justify-between"
            id="search-plans-form"
          >
            {/* Beds Dropdown */}
            <div className="flex-1 min-w-0 text-left border-b md:border-b-0 md:border-r border-stone-200 pb-3 md:pb-0 md:pr-4 flex flex-col justify-center">
              <label htmlFor="beds-select" className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold block mb-1">
                Bedrooms
              </label>
              <select
                id="beds-select"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                className="w-full font-display text-stone-800 font-medium text-sm md:text-base focus:outline-none bg-transparent cursor-pointer py-1"
              >
                <option value="Any">Any Bedrooms</option>
                <option value="2">2+ Beds</option>
                <option value="3">3+ Beds</option>
                <option value="4">4+ Beds</option>
              </select>
            </div>

            {/* Baths Dropdown */}
            <div className="flex-1 min-w-0 text-left border-b md:border-b-0 md:border-r border-stone-200 pb-3 md:pb-0 md:pr-4 flex flex-col justify-center">
              <label htmlFor="baths-select" className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold block mb-1">
                Bathrooms
              </label>
              <select
                id="baths-select"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                className="w-full font-display text-stone-800 font-medium text-sm md:text-base focus:outline-none bg-transparent cursor-pointer py-1"
              >
                <option value="Any">Any Bathrooms</option>
                <option value="1.5">1.5+ Baths</option>
                <option value="2.5">2.5+ Baths</option>
                <option value="3.5">3.5+ Baths</option>
              </select>
            </div>

            {/* Max Sq. Ft Input */}
            <div className="flex-1 min-w-0 text-left pb-3 md:pb-0 flex flex-col justify-center md:pr-4">
              <label htmlFor="max-sqft-input" className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold block mb-1">
                Max Square Footage
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  id="max-sqft-input"
                  placeholder="e.g. 4000"
                  value={maxSqft}
                  onChange={(e) => setMaxSqft(e.target.value)}
                  className="w-full font-display text-stone-800 font-medium text-sm md:text-base focus:outline-none bg-transparent placeholder-stone-400 py-1"
                  min="0"
                />
                <span className="font-mono text-[10px] text-stone-400 font-semibold ml-2">Sq. Ft.</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="bg-stone-900 hover:bg-[#1B4332] text-white px-8 py-4 rounded-lg md:rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              id="submit-search"
            >
              <Search className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span>Search Plans</span>
            </button>
          </form>

          {/* Quick links tag cloud below search */}
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-stone-300">
            <span className="font-mono opacity-60">Trending Searches:</span>
            <button
              type="button"
              onClick={() => {
                setBeds('3');
                setBaths('2.5');
                setMaxSqft('3000');
                onSearch('3', '2.5', '3000');
                const element = document.getElementById('trending-plans');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#1B4332] transition-colors font-medium border-b border-white/20 hover:border-[#1B4332] pb-0.5"
            >
              3 Bed, 2.5 Bath Villa
            </button>
            <span className="opacity-40">•</span>
            <button
              type="button"
              onClick={() => {
                setBeds('4');
                setBaths('3.5');
                setMaxSqft('4000');
                onSearch('4', '3.5', '4000');
                const element = document.getElementById('trending-plans');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#1B4332] transition-colors font-medium border-b border-white/20 hover:border-[#1B4332] pb-0.5"
            >
              4 Bed Obsidian Estate
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
