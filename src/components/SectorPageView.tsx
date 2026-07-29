import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Ruler, 
  Layers, 
  Hammer, 
  HardHat, 
  Heart, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Info,
  ChevronRight,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { parseSqft, formatSqft } from '../utils/sqft';

interface SectorPageViewProps {
  category: string;
  plans: ArchitecturalPlan[];
  savedPlans: ArchitecturalPlan[];
  onToggleFavorite: (plan: ArchitecturalPlan) => void;
  onSelectPlan: (plan: ArchitecturalPlan) => void;
  onOpenModification: (plan: ArchitecturalPlan) => void;
  onImageClick?: (plan: ArchitecturalPlan) => void;
}

// Industry Specific Regulations & Specifications mapping
const SECTOR_SPECS: Record<string, {
  title: string;
  heroDesc: string;
  heroImage: string;
  stats: { label: string; value: string }[];
  complianceTitle: string;
  complianceIntro: string;
  regulations: { title: string; desc: string }[];
}> = {
  Residential: {
    title: "Residential Blueprints",
    heroDesc: "Aesthetic single-family homes, modern villas, and contemporary farmhouses. Engineered for thermal efficiency, luxury living, and standard stick-frame construction speed.",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Permitting Approvals", value: "98.4%" },
      { label: "Insulation Standard", value: "R-21 / R-38" },
      { label: "Framing System", value: "2x6 Timber" }
    ],
    complianceTitle: "Residential Building Code & Compliance",
    complianceIntro: "Our residential designs are structurally optimized to meet or exceed standard International Residential Codes (IRC), focusing on eco-efficiency, snow/wind durability, and simple contractor workflow onboarding.",
    regulations: [
      { title: "IRC Section R302 Fire Separation", desc: "1-hour fire resistance rated walls between the garage and habitable rooms with self-closing metal doors." },
      { title: "Energy Star Thermal Envelopes", desc: "Calculated continuous insulation wraps, air-sealing specs, and double-pane low-E glass window schedules." },
      { title: "Structural Load Transfers", desc: "Engineered header tables, continuous load path metal straps, and detailed concrete slab or stem wall options." },
      { title: "Egress & Vent Safety", desc: "Emergency escape openings in all sleeping rooms and optimized continuous soffit-to-ridge natural attic airflow." }
    ]
  },
  Hospitality: {
    title: "Hospitality & Eco-Resort Designs",
    heroDesc: "Modular luxury cabins, boutique hotels, and wellness pavilions. Designed to provide visitors with immersive nature retreats, acoustic comfort, and sustainable structural integrity.",
    heroImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Type", value: "IBC Group R-1" },
      { label: "Acoustic Rating", value: "STC 55+" },
      { label: "Structural Span", value: "Glulam Timber" }
    ],
    complianceTitle: "Resort & Lodging Safety Parameters",
    complianceIntro: "Hospitality blueprints require rigorous structural and regulatory safeguards. Our drafting packages conform to hotel occupancy rules, sound-isolation standards, and eco-friendly local environmental guidelines.",
    regulations: [
      { title: "ADA Accessibility Protocols", desc: "Roll-in showers, specialized 36-inch clearance walkways, and precise ramp incline profiles included." },
      { title: "Sound Transmission Class (STC 55)", desc: "Double-stud soundproof wall framing assemblies and acoustic floor joist isolation dampening mats." },
      { title: "IBC Group R-1 Fire Suppression", desc: "Continuous wet pipe sprinkler plumbing routing grids and centralized smoke detector electrical layouts." },
      { title: "Off-Grid Eco Systems", desc: "Optional pre-engineered greywater filtration plans, solar battery arrays, and composting system tie-ins." }
    ]
  },
  Commercial: {
    title: "Commercial & Retail Office Pavilions",
    heroDesc: "Co-working hubs, multi-tenant retail centers, and modern office workspaces. Centered around flexible interior open layouts, visual prominence, and robust mechanical engineering bases.",
    heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Types", value: "IBC Group B & M" },
      { label: "HVAC Exchange", value: "6x Air / Hr" },
      { label: "Frame Durability", value: "Structural Steel" }
    ],
    complianceTitle: "Commercial Code & Zoning Integration",
    complianceIntro: "Our commercial blueprint packages provide robust foundation, framing, and core mechanical layouts. They are ready to adapt to local municipal parking, setbacks, and multi-tenant firewall standards.",
    regulations: [
      { title: "IBC Class B/M Fire Walls", desc: "2-hour gypsum firewall assemblies to isolate multi-tenant properties and prevent building cross-spread." },
      { title: "Dynamic HVAC Duct Routing", desc: "High-volume air exchanger layouts optimizing air cycles to meet commercial health codes." },
      { title: "Egress Calculations", desc: "Illuminated exit signage layouts, panic bar door hardware specifications, and directional pathway diagrams." },
      { title: "Flexible Grid Layouts", desc: "Non-loadbearing interior partitions, enabling tenants to re-configure focus rooms and offices easily." }
    ]
  },
  Industrial: {
    title: "Industrial & Logistical Facilities",
    heroDesc: "Smart warehouses, high-clearance assembly hubs, and logistical centers. Engineered for high-load heavy machinery, multi-axle truck bays, and clear-span truss optimization.",
    heroImage: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Type", value: "IBC Group S-1" },
      { label: "Clear Clearance", value: "24' - 28'" },
      { label: "Subfloor Thickness", value: "8\" Concrete" }
    ],
    complianceTitle: "Heavy-Duty Structural & Safety Standards",
    complianceIntro: "Industrial layouts demand immense structural safety margins and precise load-bearing calculations. These packages provide full civil-scale structural details compatible with heavy crane operations.",
    regulations: [
      { title: "Truss Clearance & Load Limits", desc: "Engineered webbed steel truss spacing designed for seismic bracing, high winds, and heavy snow loads." },
      { title: "Hydraulic Dock Pit Specs", desc: "Exact structural detailing for 6-way hydraulic loading levelers, weather seals, and safety bumpers." },
      { title: "8-Inch Reinforced Concrete Slab", desc: "Grade 60 steel rebar mesh reinforcement specifications on compressed gravel to withstand heavy multi-ton forklifts." },
      { title: "Hazardous Ventilation Systems", desc: "Dedicated high-rate localized machine extraction systems and gas-detection utility schedules." }
    ]
  },
  Educational: {
    title: "Educational Wings & STEM Pavilions",
    heroDesc: "Modern academy classrooms, circular lecture spaces, and school makerspaces. Optimized for student safety, natural daylight harvesting, and sound dampening.",
    heroImage: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Type", value: "IBC Group E" },
      { label: "Lighting Factor", value: "65% Natural" },
      { label: "Acoustic Standard", value: "ANSI S12.60" }
    ],
    complianceTitle: "Educational Facility Compliance Standards",
    complianceIntro: "Blueprints for classrooms and learning centers focus on ergonomic layouts, accessibility, and high acoustic performance to foster concentration and student security.",
    regulations: [
      { title: "Dual-Path Classroom Egress", desc: "Independent door paths to direct corridors, complying with modern school security and fire safety." },
      { title: "Daylight Harvesting Indexes", desc: "Strategically pitched skylights and exterior horizontal louvers to minimize glare and optimize soft visual focus." },
      { title: "ANSI S12.60 Classroom Acoustics", desc: "Acoustic wooden slatted ceiling panels and specific sound absorption boards to keep reverberation under 0.6 seconds." },
      { title: "Integrated Lab Chemistry Vents", desc: "Fume hood duct routing, separate chemical storage rules, and dedicated emergency eyewash plumbing." }
    ]
  },
  Healthcare: {
    title: "Healthcare Clinics & Medical Suites",
    heroDesc: "Private medical practices, dentist rooms, and wellness clinics. Centered on patient privacy, sterile materials routing, and heavy electrical medical diagnostic utilities.",
    heroImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Type", value: "IBC Group I-1" },
      { label: "Air Filtration", value: "HEPA Active" },
      { label: "Power Grid", value: "Isolated 240V" }
    ],
    complianceTitle: "Medical & Dental Sterile Protocols",
    complianceIntro: "Our medical clinic drafting files prioritize sanitation flow, patient visual privacy, and robust utility networks needed for diagnostic and surgical treatment systems.",
    regulations: [
      { title: "HEPA Closed-Loop Clean Air", desc: "Continuous positive-pressure ductwork with inline anti-microbial UV-C and high-efficiency HEPA particulate filters." },
      { title: "Acoustic HIPAA Isolation Walls", desc: "Continuous drywall seals extending to the upper floor deck, eliminating sound leakages between consultation rooms." },
      { title: "Sterile Supply Material Flow", desc: "Clear unidirectional zoning separating soiled materials cleaning paths from pristine sterile supply storage." },
      { title: "High-Amperage Medical Power", desc: "Dedicated conduits and grounding maps designed specifically for high-frequency X-ray, surgical light, and dental systems." }
    ]
  },
  Government: {
    title: "Government Halls & Civic Pavilions",
    heroDesc: "Municipal chambers, public offices, and civic community centers. Combining majestic heavy timber architecture with public prominence, accessibility, and structural longevity.",
    heroImage: "https://images.unsplash.com/photo-1541829019-259276a7f085?auto=format&fit=crop&q=80&w=1600",
    stats: [
      { label: "Occupancy Type", value: "IBC Group A-3" },
      { label: "Life Expectancy", value: "100+ Years" },
      { label: "Security Level", value: "High Access" }
    ],
    complianceTitle: "Civic Public Use Compliance Guides",
    complianceIntro: "Government assets demand pristine architectural permanence, extreme seismic wind ratings, high public assembly safety, and advanced geothermal utility layouts.",
    regulations: [
      { title: "High-Volume Public Assembly Safety", desc: "Soaring double-height timber ceilings, calculated structural column load margins, and multi-lane entry corridors." },
      { title: "Secure Archive Fireproof Vaults", desc: "Reinforced 12-inch concrete vault rooms with continuous 4-hour fire doors to preserve paper historical documents." },
      { title: "Geothermal Heating Networks", desc: "Integrated mechanical details for ground-loop geothermal heating/cooling pumps for ultra-efficient public operational costs." },
      { title: "FEMA Wind & Storm Resistance", desc: "Reinforced post-to-foundation structural anchors capable of withstanding severe gale storm gusts up to 150 MPH." }
    ]
  }
};

export default function SectorPageView({
  category,
  plans,
  savedPlans,
  onToggleFavorite,
  onSelectPlan,
  onOpenModification,
  onImageClick
}: SectorPageViewProps) {
  const spec = SECTOR_SPECS[category] || SECTOR_SPECS.Residential;

  // Local filtering states for the sector page
  const [maxSqft, setMaxSqft] = useState<string>('');
  const [stories, setStories] = useState<string>('Any');
  const [showFilters, setShowFilters] = useState(false);

  // Simple Sector Consultation Form state
  const [consultName, setConsultName] = useState('');
  const [consultEmail, setConsultEmail] = useState('');
  const [consultPlot, setConsultPlot] = useState('');
  const [consultSubmitted, setConsultSubmitted] = useState(false);

  const handleConsultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consultName && consultEmail) {
      setConsultSubmitted(true);
      setConsultName('');
      setConsultEmail('');
      setConsultPlot('');
    }
  };

  const handleClearFilters = () => {
    setMaxSqft('');
    setStories('Any');
  };

  // Perform filtering
  const filteredPlans = plans.filter((plan) => {
    if (maxSqft !== '') {
      const max = parseInt(maxSqft, 10);
      if (parseSqft(plan.sqft) > max) return false;
    }
    if (stories !== 'Any') {
      const st = parseInt(stories, 10);
      if (plan.stories !== st) return false;
    }
    return true;
  });

  return (
    <div className="bg-stone-50 min-h-screen text-left animate-fade-in">
      
      {/* 1. SECTOR DEDICATED HERO */}
      <div className="relative bg-stone-950 text-white overflow-hidden py-24 sm:py-32">
        {/* Abstract design elements */}
        <div className="absolute inset-0 opacity-25">
          <img 
            src={spec.heroImage} 
            alt={spec.title} 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <span className="font-mono text-xs tracking-widest text-[#1B4332] uppercase font-bold block">
              Architectural Sector Division
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white leading-tight">
              {spec.title}
            </h1>
            <p className="font-display text-base sm:text-lg text-stone-300 font-light leading-relaxed">
              {spec.heroDesc}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 max-w-lg border-t border-stone-800">
              {spec.stats.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500 block">
                    {stat.label}
                  </span>
                  <span className="font-serif text-lg sm:text-2xl font-medium text-white block">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC SPECIFICATION & BLUEPRINTS VIEW */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* LEFT COLUMN: FILTER CONTROLS & PLANS CATALOG */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-200 pb-5">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-stone-900 tracking-tight">
                Blueprint Catalog
              </h2>
              <p className="font-display text-xs text-stone-500 font-light mt-1">
                Showing {filteredPlans.length} premium engineering packages for {category} projects.
              </p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#1B4332] hover:text-[#2D6A4F] focus:outline-none cursor-pointer border border-stone-200 bg-white px-3.5 py-1.5 rounded-md"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{showFilters ? 'Hide Filters' : 'Filter Sector'}</span>
            </button>
          </div>

          {/* Collapsible sector-specific filter bar */}
          {showFilters && (
            <div className="bg-white border border-stone-150 p-5 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-left animate-fade-in shadow-sm">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                  Max Sq. Footage
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxSqft}
                  onChange={(e) => setMaxSqft(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1B4332]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-stone-500 font-bold block">
                  Storey Count
                </label>
                <select
                  value={stories}
                  onChange={(e) => setStories(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1B4332]"
                >
                  <option value="Any">Any Stories</option>
                  <option value="1">Single Storey</option>
                  <option value="2">Two Stories</option>
                  <option value="3">Three Stories</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleClearFilters}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
                >
                  Clear Sector Filters
                </button>
              </div>
            </div>
          )}

          {/* Catalog Grid */}
          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-4">
              <Info className="h-8 w-8 text-stone-300 mx-auto" />
              <h3 className="font-serif text-lg font-medium text-stone-800">
                No matching blueprints found
              </h3>
              <p className="font-display text-sm text-stone-400 font-light max-w-md mx-auto">
                No designs currently match your size or floor filter. Click clear filters above to browse all available configurations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredPlans.map((plan) => {
                const isSaved = savedPlans.some((p) => p.id === plan.id);
                return (
                  <div 
                    key={plan.id}
                    className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group/card"
                  >
                    <div
                      onClick={() => onImageClick ? onImageClick(plan) : onSelectPlan(plan)}
                      className="relative aspect-[16/10] bg-stone-100 overflow-hidden cursor-pointer group/img"
                      title="Click cover image to view photo slideshow"
                    >
                      <img 
                        src={plan.image} 
                        alt={plan.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
                      />

                      {/* Elegant Hover Slideshow Indicator */}
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/35 transition-all duration-300 flex items-center justify-center">
                        <span className="opacity-0 group-hover/img:opacity-100 bg-stone-950/80 backdrop-blur-md text-white text-[10px] font-mono font-bold tracking-wider uppercase px-3.5 py-2 rounded-lg border border-stone-850 transition-all duration-300 transform translate-y-1.5 group-hover/img:translate-y-0 flex items-center gap-1.5 shadow-md">
                          <Maximize2 className="h-3.5 w-3.5 text-[#84e114]" />
                          <span>View Slideshow</span>
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(plan);
                        }}
                        className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        aria-label="Save blueprint"
                      >
                        <Heart className={`h-4 w-4 ${isSaved ? 'fill-[#1B4332] text-[#1B4332]' : 'text-stone-500'}`} />
                      </button>
                      <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-sm text-white text-[9px] font-mono tracking-widest px-2 py-1 rounded uppercase">
                        {plan.style}
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-serif text-lg font-semibold text-stone-900 truncate">
                          {plan.name}
                        </h3>
                        <p className="font-mono text-[10px] text-[#1B4332] tracking-wider uppercase font-bold">
                          {plan.subtitle}
                        </p>
                        <p className="font-display text-xs text-stone-500 font-light leading-relaxed line-clamp-2 pt-1.5">
                          {plan.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-100 text-center font-mono text-[10px] text-stone-500">
                        <div>
                          <span className="block font-bold text-stone-800">{formatSqft(plan.sqft)}</span>
                          <span>Sq. Ft.</span>
                        </div>
                        <div>
                          <span className="block font-bold text-stone-800">
                            {plan.beds > 0 ? `${plan.beds} Beds` : `${plan.stories} Floors`}
                          </span>
                          <span>Structure</span>
                        </div>
                        <div>
                          <span className="block font-bold text-stone-800">{plan.width}</span>
                          <span>Width</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <div>
                          <span className="font-mono text-[9px] text-stone-400 block uppercase tracking-widest">Plan License</span>
                          <span className="font-serif text-base font-semibold text-stone-900">${plan.price}</span>
                        </div>
                        
                        <button
                          onClick={() => onSelectPlan(plan)}
                          className="bg-stone-900 hover:bg-[#1B4332] text-white hover:text-stone-950 px-4 py-2 rounded font-display text-xs font-semibold tracking-wide transition-colors duration-200 flex items-center gap-1.5 group/btn cursor-pointer"
                        >
                          <span>Explore Package</span>
                          <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Regulatory Information Banner */}
          <div className="bg-stone-900 text-stone-300 rounded-xl p-6 sm:p-8 space-y-4 border border-stone-850">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-[#1B4332]" />
              <h3 className="font-serif text-lg sm:text-xl font-medium text-white">
                Pre-Contract Drafting Verification
              </h3>
            </div>
            <p className="font-display text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
              Every design set in our {category} division undergoes rigid civil, structural load-bearing, and airflow ventilation reviews before catalog inclusion. However, you must submit construction packages to local regional engineers or city planners to satisfy regional soil limits, property setbacks, and environmental surveys.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: INDUSTRY COMPLIANCE SPECIFICATIONS & CONSULTATION */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Regulatory details block */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <span className="font-mono text-[9px] tracking-widest text-[#1B4332] uppercase font-bold block mb-1">
                Engineering Guidelines
              </span>
              <h3 className="font-serif text-xl font-semibold text-stone-900 leading-tight">
                {spec.complianceTitle}
              </h3>
              <p className="font-display text-xs text-stone-500 font-light leading-relaxed mt-2">
                {spec.complianceIntro}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {spec.regulations.map((reg, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1B4332] shrink-0" />
                    <h4 className="font-display font-semibold text-stone-900 text-xs sm:text-sm">
                      {reg.title}
                    </h4>
                  </div>
                  <p className="font-display text-[11px] sm:text-xs text-stone-500 font-light leading-relaxed pl-6">
                    {reg.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Special Custom Sector Consulting Box */}
          <div className="bg-stone-950 text-white rounded-2xl p-6 sm:p-8 border border-[#1B4332]/20 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1B4332]/5 rounded-full filter blur-xl" />
            
            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-[#1B4332]/10 border border-[#1B4332]/20 px-2.5 py-1 rounded-sm">
                <Sparkles className="h-3 w-3 text-[#1B4332]" />
                <span className="font-mono text-[8px] tracking-widest text-[#1B4332] uppercase font-bold">
                  Bespoke Desk
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-white leading-tight">
                Custom {category} Consultation
              </h3>
              <p className="font-display text-xs text-stone-400 font-light leading-relaxed">
                Need a completely tailored layout on your specialized site plot? Work directly with our licensed commercial master draftspeople.
              </p>
            </div>

            {consultSubmitted ? (
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-lg flex items-center gap-3 text-xs animate-fade-in text-left">
                <CheckCircle2 className="h-5 w-5 text-[#1B4332] shrink-0" />
                <div>
                  <span className="font-semibold block leading-none">Consultation Booked</span>
                  <span className="text-[10px] text-stone-400 block mt-1">Our master drafting team will contact you within 24 business hours.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConsultSubmit} className="space-y-3.5 relative z-10 text-xs">
                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Walter Gropius"
                    value={consultName}
                    onChange={(e) => setConsultName(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-white focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. walter@civicfirm.com"
                    value={consultEmail}
                    onChange={(e) => setConsultEmail(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-white focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-stone-500 font-bold block">
                    Plot Location or Setbacks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lake Tahoe regional plot"
                    value={consultPlot}
                    onChange={(e) => setConsultPlot(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-800 rounded px-3 py-2 text-white focus:outline-none focus:border-[#1B4332]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3 rounded-lg font-display font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Book Initial Call</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
