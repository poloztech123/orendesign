import React, { useState } from 'react';
import WhatsAppIcon from './WhatsAppIcon';
const orenLogo = 'https://orend-e6abe.web.app/img/Oren.png';
import {
  Compass,
  ShoppingCart,
  Menu,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  Home,
  Hotel,
  Briefcase,
  Factory,
  GraduationCap,
  HeartPulse,
  Landmark,
  Bed,
  Layers,
  Paintbrush,
  Maximize2,
  DollarSign,
  Palette,
  Phone,
  Search,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { ARCHITECTURAL_PLANS } from '../data';

interface NavbarProps {
  plans: ArchitecturalPlan[];
  savedPlans: ArchitecturalPlan[];
  onRemoveFavorite: (plan: ArchitecturalPlan) => void;
  onSelectPlan: (plan: ArchitecturalPlan) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin?: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  
  // Interactive filters
  searchParams: {
    beds: string;
    baths: string;
    maxSqft: string;
    maxPrice: string;
    storey: string;
  };
  onUpdateSearchParams: (params: {
    beds: string;
    baths: string;
    maxSqft: string;
    maxPrice: string;
    storey: string;
  }) => void;
  activeStyle: string | null;
  onSelectStyle: (style: string | null) => void;
}

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Residential', label: 'Residential', icon: Home },
  { id: 'Hospitality', label: 'Hospitality', icon: Hotel },
  { id: 'Commercial', label: 'Commercial', icon: Briefcase },
  { id: 'Industrial', label: 'Industrial', icon: Factory },
  { id: 'Educational', label: 'Educational', icon: GraduationCap },
  { id: 'Healthcare', label: 'Healthcare', icon: HeartPulse },
  { id: 'Government', label: 'Government', icon: Landmark }
];

const STYLES_LIST = [
  "The Modern Minimalist Collection",
  "Luxury Estates & Mansions",
  "Contemporary Farmhouses",
  "Eco-Resort Pavilions",
  "Contemporary Cabins & Spas",
  "Contemporary Workspace",
  "Modern Commercial Center",
  "Modern Industrial Facility",
  "Modern Educational Facility",
  "Bespoke Medical Suite",
  "Public Timber Frame Hall"
];

export default function Navbar({
  plans,
  savedPlans,
  onRemoveFavorite,
  onSelectPlan,
  cartCount,
  onOpenCart,
  onOpenAdmin,
  activeCategory,
  onSelectCategory,
  searchParams,
  onUpdateSearchParams,
  activeStyle,
  onSelectStyle
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePopup, setActivePopup] = useState<'saved' | 'search' | null>(null);
  const [openDropdown, setOpenDropdown] = useState<'beds' | 'storey' | 'style' | 'sqft' | 'price' | null>(null);
  const googleSitesLogo = "https://orend-e6abe.web.app/img/Oren.png";
  const [logoSrc, setLogoSrc] = useState(googleSitesLogo);
  const [logoFailed, setLogoFailed] = useState(false);

  const handleLogoError = () => {
    setLogoFailed(true);
  };

  // Live Catalog Search input state
  const [searchText, setSearchText] = useState('');

  // Live filter query matching plans
  const searchedPlans = searchText.trim() === ''
    ? plans.slice(0, 4) // Popular top picks initially
    : plans.filter(plan => 
        plan.name.toLowerCase().includes(searchText.toLowerCase()) ||
        plan.category.toLowerCase().includes(searchText.toLowerCase()) ||
        plan.style.toLowerCase().includes(searchText.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchText.toLowerCase())
      );

  const handleResetFilters = () => {
    onSelectCategory('All');
    onSelectStyle(null);
    onUpdateSearchParams({ beds: 'Any', baths: 'Any', maxSqft: '', maxPrice: '', storey: 'Any' });
    setOpenDropdown(null);
    setActivePopup(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. TOP HEADER: Logo, Saved (Heart), and Cart */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-stone-950 border-b border-stone-850 h-16 select-none" id="global-top-header">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
              id="top-nav-logo"
            >
              <div className="flex items-center gap-2">
                {!logoFailed ? (
                  <img
                    src={logoSrc}
                    alt="Oren Logo"
                    className="h-9 w-auto object-contain max-w-[140px]"
                    onError={handleLogoError}
                  />
                ) : (
                  <div className="flex items-center gap-2 font-display text-sm font-bold tracking-widest text-white">
                    <svg viewBox="0 0 100 100" className="h-7 w-7 stroke-[#84e114] fill-none shrink-0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15,65 L50,30 L85,65" />
                      <circle cx="50" cy="65" r="10" className="fill-white stroke-none" />
                    </svg>
                    <div>
                      <span className="text-white">OREN</span>{' '}
                      <span className="text-[#84e114] text-[9px] font-mono tracking-normal block leading-none mt-0.5">DESIGN & BUILD</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Action Buttons: Phone, WhatsApp, Search, Saved (Heart) & Cart (ShoppingCart) */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-2.5 shrink-0">
            {/* 1. Phone Call Link (Takes directly to dialer) */}
            <a
              href="tel:+256773633868"
              className="p-2 sm:p-2.5 rounded-full transition-all duration-200 text-stone-300 hover:text-[#84e114] hover:bg-stone-900 focus:outline-none"
              aria-label="Call Oren"
              id="top-btn-phone"
              title="Call Oren"
            >
              <Phone className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </a>

            {/* 2. WhatsApp Live Link (Takes directly to WhatsApp) */}
            <a
              href="https://wa.me/+256773633868?text=Hello%20Oren!%20I%20am%20interested%20in%20exploring%20custom%20architectural%20plan%20solutions%20with%20you."
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 sm:p-2.5 rounded-full transition-all duration-200 hover:scale-105 hover:bg-stone-900 flex items-center justify-center focus:outline-none"
              aria-label="WhatsApp Live Chat"
              id="top-btn-whatsapp"
              title="WhatsApp Live Chat"
            >
              <WhatsAppIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </a>

            {/* 4. Search Glass Button */}
            <div className="relative">
              <button
                onClick={() => {
                  setActivePopup(activePopup === 'search' ? null : 'search');
                  setOpenDropdown(null);
                }}
                className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 relative cursor-pointer focus:outline-none ${
                  activePopup === 'search' ? 'bg-stone-900 text-[#84e114]' : 'text-stone-300 hover:text-[#84e114] hover:bg-stone-900'
                }`}
                aria-label="Search Catalog"
                id="top-btn-search"
                title="Search Blueprints"
              >
                <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>

              {/* Instant Live Search Dropdown Panel */}
              {activePopup === 'search' && (
                <div className="absolute right-[-20px] sm:right-0 top-full mt-3 w-80 sm:w-96 bg-white border border-stone-150 shadow-2xl rounded-2xl z-50 p-4 max-h-[480px] overflow-hidden flex flex-col text-left animate-fade-in" id="top-search-dropdown">
                  <div className="flex justify-between items-center pb-2.5 border-b border-stone-100 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-50 text-[#84e114] p-1.5 rounded-lg">
                        <Search className="h-4 w-4" />
                      </div>
                      <span className="font-display font-semibold text-stone-950 text-sm">Instant Catalog Search</span>
                    </div>
                    <button
                      onClick={() => setActivePopup(null)}
                      className="text-stone-400 hover:text-stone-600 focus:outline-none text-xs font-mono"
                    >
                      Close
                    </button>
                  </div>

                  {/* Text input */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search by name, category, style, sq.ft..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#84e114] focus:border-[#84e114] outline-none text-stone-800 font-sans h-10"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400 pointer-events-none" />
                    {searchText && (
                      <button
                        onClick={() => setSearchText('')}
                        className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-[10px] font-mono uppercase font-bold p-1 focus:outline-none"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search Results list */}
                  <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 pr-1 scrollbar-none">
                    <div className="font-mono text-[9px] text-stone-400 uppercase tracking-wider mb-2 font-bold block">
                      {searchText.trim() === '' ? 'Popular Blueprints' : `Search Results (${searchedPlans.length})`}
                    </div>

                    {searchedPlans.length === 0 ? (
                      <div className="text-center py-8 text-stone-400">
                        <Compass className="h-8 w-8 mx-auto mb-2 opacity-30 text-stone-500" />
                        <p className="text-xs font-mono">No matching blueprints found</p>
                        <button
                          onClick={() => setSearchText('')}
                          className="text-[11px] text-[#84e114] hover:underline mt-1"
                        >
                          Show popular blueprints
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchedPlans.map((plan) => (
                          <div
                            key={plan.id}
                            onClick={() => {
                              onSelectPlan(plan);
                              setActivePopup(null);
                            }}
                            className="flex gap-3 p-2 hover:bg-stone-50 rounded-xl transition-all group cursor-pointer border border-transparent hover:border-stone-100"
                          >
                            {plan.image ? (
                              <img
                                src={plan.image}
                                alt={plan.name}
                                referrerPolicy="no-referrer"
                                className="h-11 w-16 object-cover rounded-lg border border-stone-100 shrink-0"
                              />
                            ) : (
                              <div className="h-11 w-16 bg-stone-100 rounded-lg border border-stone-200 shrink-0 flex items-center justify-center text-[8px] font-mono text-stone-400">
                                PLAN
                              </div>
                            )}
                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="font-display font-medium text-xs text-stone-900 truncate group-hover:text-[#84e114] transition-colors">
                                {plan.name}
                              </h4>
                              <p className="font-mono text-[9px] text-stone-400 mt-0.5 truncate">
                                {plan.style} • {plan.sqft.toLocaleString()} Sq. Ft.
                              </p>
                              <div className="flex justify-between items-center mt-0.5">
                                <span className="text-[9px] text-stone-500 font-mono">
                                  {plan.beds} Bed • {plan.baths} Bath
                                </span>
                                <span className="text-xs text-stone-900 font-serif font-bold group-hover:text-[#84e114]">
                                  ${plan.price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Admin Dashboard Icon Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="p-2 sm:p-2.5 rounded-full transition-all duration-200 text-stone-300 hover:text-[#84e114] hover:bg-stone-900 focus:outline-none flex items-center justify-center cursor-pointer border border-transparent hover:border-stone-800"
                aria-label="Admin Dashboard"
                id="top-btn-admin"
                title="Admin Dashboard"
              >
                <ShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-[#84e114]" />
              </button>
            )}

          </div>
        </div>
      </header>

      {/* 2. TOP CATEGORIES BAR: Green Pill Rail underneath the header */}
      <div className="fixed top-16 left-0 right-0 z-30 bg-[#1B4332] border-b border-[#143527] py-2.5 px-4 sm:px-6 lg:px-8 shadow-md overflow-hidden select-none" id="categories-top-rail">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center overflow-x-auto scrollbar-none gap-2 sm:gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-display text-xs tracking-wide transition-all duration-300 whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-[#84e114] border-[#84e114] text-stone-950 font-bold shadow-md shadow-[#84e114]/20'
                    : 'bg-[#153427]/60 border-[#122e22]/35 text-[#b5e2cc] hover:text-white hover:bg-[#153427] hover:border-[#153427]'
                }`}
                style={{ outline: 'none' }}
              >
                <Icon className={`h-3.5 w-3.5 transition-colors ${isActive ? 'text-stone-950' : 'text-[#84e114]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FIXED BOTTOM NAVIGATION BAR: Purely dedicated to interactive filters (matching user's image) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-stone-950 border-t border-stone-800 shadow-[0_-8px_30px_rgb(0,0,0,0.3)] select-none animate-slide-up" id="bottom-filter-navbar">
        <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
          <div className="flex justify-around md:justify-center items-center h-16 sm:gap-8 lg:gap-16">
            
            {/* BUTTON 1: Home / Reset */}
            <button
              onClick={() => {
                handleResetFilters();
                setActivePopup(null);
              }}
              className="flex flex-col items-center justify-center py-1 flex-1 md:flex-none md:px-4 text-stone-400 hover:text-stone-100 transition-colors focus:outline-none text-center cursor-pointer"
              id="bottom-btn-home"
              title="Home"
            >
              <Home className="h-5 w-5" />
              <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Home</span>
            </button>

            {/* BUTTON 2: Bedrooms */}
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'beds' ? null : 'beds');
                  setActivePopup(null);
                }}
                className={`flex flex-col items-center justify-center py-1 w-full md:px-4 transition-colors focus:outline-none text-center cursor-pointer relative ${
                  searchParams.beds !== 'Any' ? 'text-[#84e114]' : 'text-stone-400 hover:text-stone-100'
                }`}
                id="bottom-btn-beds"
                title="Bedrooms"
              >
                <Bed className="h-5 w-5" />
                <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Bedrooms</span>
                {searchParams.beds !== 'Any' && (
                  <span className="absolute top-0 right-1 sm:right-2 bg-[#84e114] text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full leading-none py-0.5">
                    {searchParams.beds}+
                  </span>
                )}
              </button>

              {openDropdown === 'beds' && (
                <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-full md:mb-3 md:left-1/2 md:-translate-x-1/2 md:w-44 bg-white border border-stone-200 shadow-2xl rounded-xl p-2.5 z-50 animate-fade-in" id="dropdown-beds">
                  <div className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider pb-1 px-3 border-b border-stone-100 mb-1.5 block md:hidden">
                    Select Bedrooms
                  </div>
                  {['Any', '1', '2', '3', '4', '5'].map((b) => (
                    <button
                      key={b}
                      onClick={() => {
                        onUpdateSearchParams({ ...searchParams, beds: b });
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                        searchParams.beds === b ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                      }`}
                    >
                      {b === 'Any' ? 'Any Bedrooms' : `${b}+ Beds`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTON 3: Storey */}
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'storey' ? null : 'storey');
                  setActivePopup(null);
                }}
                className={`flex flex-col items-center justify-center py-1 w-full md:px-4 transition-colors focus:outline-none text-center cursor-pointer relative ${
                  searchParams.storey !== 'Any' ? 'text-[#84e114]' : 'text-stone-400 hover:text-stone-100'
                }`}
                id="bottom-btn-storey"
                title="Storey"
              >
                <Layers className="h-5 w-5" />
                <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Storey</span>
                {searchParams.storey !== 'Any' && (
                  <span className="absolute top-0 right-1 sm:right-2 bg-[#84e114] text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full leading-none py-0.5">
                    {searchParams.storey}
                  </span>
                )}
              </button>

              {openDropdown === 'storey' && (
                <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-full md:mb-3 md:left-1/2 md:-translate-x-1/2 md:w-44 bg-white border border-stone-200 shadow-2xl rounded-xl p-2.5 z-50 animate-fade-in" id="dropdown-storey">
                  <div className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider pb-1 px-3 border-b border-stone-100 mb-1.5 block md:hidden">
                    Select Storey
                  </div>
                  {['Any', '1', '2', '3'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateSearchParams({ ...searchParams, storey: s });
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                        searchParams.storey === s ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                      }`}
                    >
                      {s === 'Any' ? 'Any Floors' : `${s} Storey${parseInt(s) > 1 ? 'ies' : ''}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTON 4: Style */}
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'style' ? null : 'style');
                  setActivePopup(null);
                }}
                className={`flex flex-col items-center justify-center py-1 w-full md:px-4 transition-colors focus:outline-none text-center cursor-pointer relative ${
                  activeStyle !== null ? 'text-[#84e114]' : 'text-stone-400 hover:text-stone-100'
                }`}
                id="bottom-btn-style"
                title="Style"
              >
                <Palette className="h-5 w-5" />
                <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Style</span>
                {activeStyle !== null && (
                  <span className="absolute top-0 right-1 sm:right-2 bg-[#84e114] text-white text-[8px] sm:text-[9px] font-bold h-2 w-2 rounded-full" />
                )}
              </button>

              {openDropdown === 'style' && (
                <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-full md:mb-3 md:left-1/2 md:-translate-x-1/2 md:w-64 bg-white border border-stone-200 shadow-2xl rounded-xl p-2.5 z-50 animate-fade-in" id="dropdown-style">
                  <div className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider pb-1 px-3 border-b border-stone-100 mb-1.5 block md:hidden">
                    Select Architectural Style
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-0.5">
                    <button
                      onClick={() => {
                        onSelectStyle(null);
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                        activeStyle === null ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                      }`}
                    >
                      Any Style
                    </button>
                    {STYLES_LIST.map((styleName) => (
                      <button
                        key={styleName}
                        onClick={() => {
                          onSelectStyle(styleName);
                          setOpenDropdown(null);
                        }}
                        className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                          activeStyle === styleName ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                        }`}
                      >
                        {styleName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BUTTON 5: Plot Size */}
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'sqft' ? null : 'sqft');
                  setActivePopup(null);
                }}
                className={`flex flex-col items-center justify-center py-1 w-full md:px-4 transition-colors focus:outline-none text-center cursor-pointer relative ${
                  searchParams.maxSqft !== '' ? 'text-[#84e114]' : 'text-stone-400 hover:text-stone-100'
                }`}
                id="bottom-btn-sqft"
                title="Plot Size"
              >
                <Maximize2 className="h-5 w-5" />
                <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Plot Size</span>
                {searchParams.maxSqft !== '' && (
                  <span className="absolute top-0 right-1 sm:right-2 bg-[#84e114] text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full leading-none py-0.5">
                    {parseInt(searchParams.maxSqft) >= 1000 ? `${parseInt(searchParams.maxSqft)/1000}k` : searchParams.maxSqft}
                  </span>
                )}
              </button>

              {openDropdown === 'sqft' && (
                <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-full md:mb-3 md:left-1/2 md:-translate-x-1/2 md:w-48 bg-white border border-stone-200 shadow-2xl rounded-xl p-2.5 z-50 animate-fade-in" id="dropdown-sqft">
                  <div className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider pb-1 px-3 border-b border-stone-100 mb-1.5 block md:hidden">
                    Select Max Plot Size
                  </div>
                  {[
                    { label: 'Any Size', value: '' },
                    { label: 'Under 1,500 sqft', value: '1500' },
                    { label: 'Under 2,500 sqft', value: '2500' },
                    { label: 'Under 4,000 sqft', value: '4000' },
                    { label: 'Under 6,000 sqft', value: '6000' },
                    { label: 'Under 10,000 sqft', value: '10000' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        onUpdateSearchParams({ ...searchParams, maxSqft: item.value });
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                        searchParams.maxSqft === item.value ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BUTTON 6: Budget */}
            <div className="relative flex-1 md:flex-none">
              <button
                onClick={() => {
                  setOpenDropdown(openDropdown === 'price' ? null : 'price');
                  setActivePopup(null);
                }}
                className={`flex flex-col items-center justify-center py-1 w-full md:px-4 transition-colors focus:outline-none text-center cursor-pointer relative ${
                  searchParams.maxPrice !== '' ? 'text-[#84e114]' : 'text-stone-400 hover:text-stone-100'
                }`}
                id="bottom-btn-price"
                title="Budget"
              >
                <DollarSign className="h-5 w-5" />
                <span className="font-sans text-[10px] sm:text-[11px] font-medium tracking-wide mt-1">Budget</span>
                {searchParams.maxPrice !== '' && (
                  <span className="absolute top-0 right-1 sm:right-2 bg-[#84e114] text-white text-[8px] sm:text-[9px] font-bold px-1 rounded-full leading-none py-0.5">
                    ${parseInt(searchParams.maxPrice) >= 1000 ? `${parseInt(searchParams.maxPrice)/1000}k` : searchParams.maxPrice}
                  </span>
                )}
              </button>

              {openDropdown === 'price' && (
                <div className="fixed bottom-20 left-4 right-4 md:absolute md:bottom-full md:mb-3 md:left-1/2 md:-translate-x-1/2 md:w-44 bg-white border border-stone-200 shadow-2xl rounded-xl p-2.5 z-50 animate-fade-in" id="dropdown-price">
                  <div className="font-mono text-[9px] text-stone-400 font-bold uppercase tracking-wider pb-1 px-3 border-b border-stone-100 mb-1.5 block md:hidden">
                    Select Max Budget
                  </div>
                  {[
                    { label: 'Any Budget', value: '' },
                    { label: 'Under $1,200', value: '1200' },
                    { label: 'Under $1,500', value: '1500' },
                    { label: 'Under $2,000', value: '2000' },
                    { label: 'Under $2,500', value: '2500' },
                    { label: 'Under $3,000', value: '3000' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      onClick={() => {
                        onUpdateSearchParams({ ...searchParams, maxPrice: item.value });
                        setOpenDropdown(null);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-stone-50 font-sans transition-colors cursor-pointer ${
                        searchParams.maxPrice === item.value ? 'text-[#84e114] font-semibold bg-stone-50/50' : 'text-stone-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
