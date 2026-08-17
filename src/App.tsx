/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ARCHITECTURAL_PLANS, FAQ_ITEMS, TESTIMONIALS } from './data';
const orenLogo = 'https://orend-e6abe.web.app/img/Oren.png';
import { ArchitecturalPlan, CartItem } from './types';
import { parseSqft } from './utils/sqft';
import { 
  seedInitialPlansIfNeeded, 
  fetchPlansFromApi,
  getStoredPlans,
  saveStoredPlans,
  getDeletedPlanIds,
  addPlanToFirestore, 
  updatePlanInFirestore, 
  deletePlanFromFirestore,
  clearAllPlansFromFirestore
} from './lib/firebase';
import { 
  subscribeToRealtimeProjects, 
  saveProject, 
  deleteProject, 
  fetchLiveProjects 
} from './lib/projectService';

// Component imports
import Navbar from './components/Navbar';
import SearchHero from './components/SearchHero';
import Ribbon from './components/Ribbon';
import Collections from './components/Collections';
import PlanGrid from './components/PlanGrid';
import SectorPageView from './components/SectorPageView';
import PlanDetailModal from './components/PlanDetailModal';
import CheckoutModal from './components/CheckoutModal';
import ModificationModal from './components/ModificationModal';
import FAQAndTestimonials from './components/FAQAndTestimonials';
import AdminDashboard from './components/AdminDashboard';
import ContactOptionsModal from './components/ContactOptionsModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ImageLightbox from './components/ImageLightbox';

// Utility icons
import { Compass, Mail, Phone, Sparkles, CheckCircle2, ChevronUp, ShieldCheck } from 'lucide-react';

export default function App() {
  // Catalog Plans State initialized from cache and kept synced live with server API
  const [plans, setPlans] = useState<ArchitecturalPlan[]>(() => {
    return getStoredPlans();
  });

  // Footer Logo Fallback State
  const googleSitesLogo = "https://orend-e6abe.web.app/img/Oren.png";
  const [footerLogoSrc, setFooterLogoSrc] = useState<string>(googleSitesLogo);
  const [footerLogoFailed, setFooterLogoFailed] = useState(false);

  const handleFooterLogoError = () => {
    setFooterLogoFailed(true);
  };

  // Sync plans live with real-time cloud database (Supabase / Firebase / Server API)
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeProjects((livePlans) => {
      if (livePlans && Array.isArray(livePlans) && livePlans.length > 0) {
        setPlans(livePlans);
      }
    });

    const handleFocus = () => {
      fetchLiveProjects().then(livePlans => {
        if (livePlans && Array.isArray(livePlans) && livePlans.length > 0) {
          setPlans(livePlans);
        }
      });
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'oren_catalog_plans_store') {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync Saved Plans (Favorites) with localStorage with robust lazy initialization on mount
  const [savedPlanIds, setSavedPlanIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oren_saved_blueprints') || localStorage.getItem('atelier_saved_blueprints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => typeof item === 'string' ? item : item.id).filter(Boolean);
        }
      }
    } catch (err) {
      console.error("Failed to initialize saved plans:", err);
    }
    return [];
  });

  // Dynamically resolve full plan objects from the live `plans` list
  const savedPlans = useMemo(() => {
    return savedPlanIds
      .map((id) => plans.find((p) => p.id === id))
      .filter(Boolean) as ArchitecturalPlan[];
  }, [savedPlanIds, plans]);

  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Check URL pathname or hash to open the admin panel
  useEffect(() => {
    const handleUrlChange = () => {
      const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname === '/admin/';
      const isHashAdmin = window.location.hash === '#/admin' || window.location.hash === '#admin';
      if (isPathAdmin || isHashAdmin) {
        setIsAdminOpen(true);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    if (window.location.hash !== '#/admin') {
      window.history.pushState({}, '', '#/admin');
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    const isPathAdmin = window.location.pathname === '/admin' || window.location.pathname === '/admin/';
    const isHashAdmin = window.location.hash === '#/admin' || window.location.hash === '#admin';
    if (isPathAdmin) {
      window.history.pushState({}, '', '/');
    } else if (isHashAdmin) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  // Main UI coordination states
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPlan, setSelectedPlan] = useState<ArchitecturalPlan | null>(null);
  const [contactPlan, setContactPlan] = useState<ArchitecturalPlan | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);
  
  // Immersive image lightbox states
  const [lightboxPlan, setLightboxPlan] = useState<ArchitecturalPlan | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleOpenSlideshow = (plan: ArchitecturalPlan, initialIndex = 0) => {
    setLightboxPlan(plan);
    setLightboxIndex(initialIndex);
  };
  const [searchParams, setSearchParams] = useState({
    beds: 'Any',
    baths: 'Any',
    maxSqft: '',
    maxPrice: '',
    storey: 'Any'
  });
  
  // Cart coordination states
  const [cartItem, setCartItem] = useState<CartItem | null>(null);
  
  // Modal visibility flags
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isModificationOpen, setIsModificationOpen] = useState(false);

  // Footer newsletter signup interactive state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Sync saved plans to storage when they alter, storing only the IDs to avoid duplicative base64 image storage
  useEffect(() => {
    try {
      localStorage.setItem('oren_saved_blueprints', JSON.stringify(savedPlanIds));
    } catch (err) {
      console.error("Failed to sync saved plans to localStorage:", err);
    }
  }, [savedPlanIds]);

  // Handle addition/removal of favorites
  const handleToggleFavorite = (plan: ArchitecturalPlan) => {
    const exists = savedPlanIds.includes(plan.id);
    if (exists) {
      setSavedPlanIds((prev) => prev.filter((id) => id !== plan.id));
    } else {
      setSavedPlanIds((prev) => [...prev, plan.id]);
    }
  };

  const handleRemoveFavorite = (plan: ArchitecturalPlan) => {
    setSavedPlanIds((prev) => prev.filter((id) => id !== plan.id));
  };

  // Open detail modal for specified plan
  const handleSelectPlan = (plan: ArchitecturalPlan) => {
    setSelectedPlan(plan);
  };

  // Handle instant search form submissions
  const handleSearch = (beds: string, baths: string, maxSqft: string) => {
    setSearchParams((prev) => ({ ...prev, beds, baths, maxSqft }));
  };

  const handleClearSearch = () => {
    setSearchParams({ beds: 'Any', baths: 'Any', maxSqft: '', maxPrice: '', storey: 'Any' });
  };

  const handleClearStyle = () => {
    setActiveStyle(null);
  };

  // Cart actions: opens secure checkout drawer immediately
  const handleAddToCart = (
    plan: ArchitecturalPlan,
    licenseType: 'Standard PDF' | 'CAD Unlimited' | 'Full MEP Pack',
    price: number
  ) => {
    setCartItem({ plan, licenseType, price });
    setSelectedPlan(null); // dismiss blueprint details
    setIsCheckoutOpen(true); // open checkout
  };

  const handlePurchaseSuccess = () => {
    setCartItem(null);
    setIsCheckoutOpen(false);
    // Visual alert confirmation
    alert("Transaction completed successfully! Your digital blueprints have been generated and the file package download has completed.");
  };

  // Custom modification drawer triggers
  const handleOpenModification = (plan: ArchitecturalPlan) => {
    setSelectedPlan(null);
    setSelectedPlan(plan); // ensure modification is focused on correct plan
    setIsModificationOpen(true);
  };

  const handleRequestGeneralModification = () => {
    // Default to a suitable plan as placeholder
    const defaultPlan = plans.find(p => p.category === activeCategory) || plans[0];
    setSelectedPlan(defaultPlan);
    setIsModificationOpen(true);
  };

  // Catalog update handlers for Admin Dashboard
  const handleAddPlan = async (newPlan: ArchitecturalPlan) => {
    setPlans((prev) => {
      const next = [newPlan, ...prev.filter(p => p.id !== newPlan.id)];
      saveStoredPlans(next);
      return next;
    });
    const saved = await saveProject(newPlan);
    const loaded = await fetchLiveProjects();
    setPlans(loaded);
  };

  const handleUpdatePlan = async (updatedPlan: ArchitecturalPlan) => {
    setPlans((prev) => {
      const next = prev.map(p => p.id === updatedPlan.id ? updatedPlan : p);
      saveStoredPlans(next);
      return next;
    });
    await saveProject(updatedPlan);
    const loaded = await fetchLiveProjects();
    setPlans(loaded);
  };

  const handleDeletePlan = async (id: string) => {
    setPlans((prev) => {
      const next = prev.filter(p => p.id !== id);
      saveStoredPlans(next);
      return next;
    });
    await deleteProject(id);
    const loaded = await fetchLiveProjects();
    setPlans(loaded);
  };

  const handleClearAllPlans = async () => {
    setPlans([]);
    saveStoredPlans([]);
    await clearAllPlansFromFirestore();
    const loaded = await fetchLiveProjects();
    setPlans(loaded);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  // FILTERING ENGINE FOR CATALOG BLUEPRINTS
  const filteredPlans = plans.filter((plan) => {
    // 1. Category division matching
    if (activeCategory !== 'All' && plan.category !== activeCategory) {
      return false;
    }

    // 2. Collection style matching
    if (activeStyle && plan.style !== activeStyle) {
      return false;
    }

    // 3. Bedrooms count matching
    if (searchParams.beds !== 'Any') {
      const minBeds = parseInt(searchParams.beds, 10);
      if (plan.beds < minBeds) return false;
    }

    // 4. Bathrooms count matching
    if (searchParams.baths !== 'Any') {
      const minBaths = parseFloat(searchParams.baths);
      if (plan.baths < minBaths) return false;
    }

    // 5. Max Sq. Ft constraints matching
    if (searchParams.maxSqft !== '') {
      const maxSq = parseInt(searchParams.maxSqft, 10);
      if (parseSqft(plan.sqft) > maxSq) return false;
    }

    // 6. Max price constraints matching
    if (searchParams.maxPrice !== '') {
      const maxPrice = parseInt(searchParams.maxPrice, 10);
      if (plan.price > maxPrice) return false;
    }

    // 7. Storey count matching
    if (searchParams.storey !== 'Any') {
      const exactStories = parseInt(searchParams.storey, 10);
      if (plan.stories !== exactStories) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 selection:bg-[#1B4332]/30 selection:text-white flex flex-col font-sans pt-[120px] pb-24">
      
      {/* 1. Header Navigation */}
      <Navbar
        plans={plans}
        savedPlans={savedPlans}
        onRemoveFavorite={handleRemoveFavorite}
        onSelectPlan={handleSelectPlan}
        cartCount={cartItem ? 1 : 0}
        onOpenCart={() => {
          if (cartItem) {
            setIsCheckoutOpen(true);
          } else {
            alert("Your shopping cart is currently empty. Explore our blueprints below and click 'Purchase Blueprint' to load structural licensing options.");
          }
        }}
        onOpenAdmin={handleOpenAdmin}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          setActiveStyle(null); // Reset style filter when changing category
          handleClearSearch(); // Reset search filters
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchParams={searchParams}
        onUpdateSearchParams={setSearchParams}
        activeStyle={activeStyle}
        onSelectStyle={setActiveStyle}
      />

      {/* 2. Primary Sections */}
      <main className="flex-1">
        {activeCategory === 'All' ? (
          <>
            {/* Section 1: Hero Area with Instant Search */}
            <SearchHero
              onSearch={handleSearch}
              initialBeds={searchParams.beds}
              initialBaths={searchParams.baths}
              initialMaxSqft={searchParams.maxSqft}
            />

            {/* Section 2: Trending & Most Viewed Section */}
            <Ribbon plans={plans} onSelectPlan={handleSelectPlan} onImageClick={(plan) => handleOpenSlideshow(plan, 0)} />

            {/* Section 3: Featured Collections Visual Grid */}
            <Collections
              onSelectStyle={setActiveStyle}
              activeStyle={activeStyle}
            />

            {/* Section 4: Individual Products & Search Results */}
            <PlanGrid
              plans={filteredPlans}
              savedPlans={savedPlans}
              onToggleFavorite={handleToggleFavorite}
              onSelectPlan={handleSelectPlan}
              activeStyle={activeStyle}
              onClearStyle={handleClearStyle}
              searchParams={searchParams}
              onClearSearch={handleClearSearch}
              onImageClick={(plan) => handleOpenSlideshow(plan, 0)}
              onOpenAdmin={handleOpenAdmin}
            />

            {/* Section 5: Accordion FAQ, Modification Call, & Testimonial Slider */}
            <FAQAndTestimonials
              faqItems={FAQ_ITEMS}
              testimonials={TESTIMONIALS}
              onRequestGeneralModification={handleRequestGeneralModification}
            />
          </>
        ) : (
          /* Specialized, Dedicated Sector Page View (Multi-Page Architecture) */
          <SectorPageView
            category={activeCategory}
            plans={plans.filter((p) => p.category === activeCategory)}
            savedPlans={savedPlans}
            onToggleFavorite={handleToggleFavorite}
            onSelectPlan={handleSelectPlan}
            onOpenModification={handleOpenModification}
            onImageClick={(plan) => handleOpenSlideshow(plan, 0)}
          />
        )}
      </main>

      {/* 3. MODAL & DRAWER OVERLAYS */}
      
      {/* Blueprint Detail Viewer Modal */}
      {selectedPlan && !isModificationOpen && !isCheckoutOpen && (
        <PlanDetailModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          savedPlans={savedPlans}
          onToggleFavorite={handleToggleFavorite}
          onAddToCart={handleAddToCart}
          onOpenModification={handleOpenModification}
          onSelectCategory={setActiveCategory}
          onImageClick={setContactPlan}
          onOpenSlideshow={handleOpenSlideshow}
        />
      )}

      {/* WhatsApp / Call Contact Options Modal */}
      {contactPlan && (
        <ContactOptionsModal
          plan={contactPlan}
          onClose={() => setContactPlan(null)}
          onExplore={() => {
            setContactPlan(null);
            handleSelectPlan(contactPlan);
          }}
        />
      )}

      {/* Modification Request Intake Drawer */}
      {isModificationOpen && selectedPlan && (
        <ModificationModal
          plan={selectedPlan}
          onClose={() => {
            setIsModificationOpen(false);
            setSelectedPlan(null);
          }}
        />
      )}

      {/* Secure Digital Checkout Modal */}
      {isCheckoutOpen && cartItem && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          cartItem={cartItem}
          onClose={() => setIsCheckoutOpen(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Admin Dashboard Overlay Control */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        plans={plans}
        onAddPlan={handleAddPlan}
        onUpdatePlan={handleUpdatePlan}
        onDeletePlan={handleDeletePlan}
        onClearAllPlans={handleClearAllPlans}
      />

      {/* Immersive Fullscreen Image Slideshow Lightbox */}
      <ImageLightbox
        plan={lightboxPlan}
        initialIndex={lightboxIndex}
        isOpen={lightboxPlan !== null}
        onClose={() => setLightboxPlan(null)}
      />

      {/* 4. Luxury Brand Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-850 py-16 md:py-20 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
            
            {/* Column 1: Brand details */}
            <div className="md:col-span-4 space-y-5 text-left">
              <div className="flex items-center gap-2">
                {!footerLogoFailed ? (
                  <img
                    src={footerLogoSrc}
                    alt="Oren Logo"
                    className="h-8 w-auto object-contain max-w-[120px]"
                    onError={handleFooterLogoError}
                  />
                ) : (
                  <div className="flex items-center gap-2 font-display text-sm font-bold tracking-widest text-white">
                    <svg viewBox="0 0 100 100" className="h-6 w-6 stroke-[#84e114] fill-none shrink-0" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
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
              <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
                Engineers of architectural purity and digital drafting standards. Providing builder-ready construction sets customized to fit local setback coordinates and terrain slopes.
              </p>
              <div className="space-y-2.5 pt-2 text-xs font-mono">
                <div className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-[#1B4332] shrink-0" />
                  <span>Call Design Desk: (+256 773 633868) </span>
                </div>
                <div className="flex items-center gap-2.5 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-[#1B4332] shrink-0" />
                  <span>Email: info@orendesignandbuild.com</span>
                </div>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-2 space-y-4 text-left">
              <h4 className="font-mono text-[10px] tracking-widest text-white uppercase font-bold">
                Blueprint Divisions
              </h4>
              <ul className="space-y-2.5 text-xs">
                {[
                  { id: 'Residential', label: 'Residential Plans' },
                  { id: 'Hospitality', label: 'Hospitality & Resorts' },
                  { id: 'Commercial', label: 'Commercial & Offices' },
                  { id: 'Industrial', label: 'Logistics & Industrial' },
                  { id: 'Educational', label: 'Educational Facilities' },
                  { id: 'Healthcare', label: 'Healthcare & Clinics' },
                  { id: 'Government', label: 'Government Buildings' }
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveCategory(item.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-white transition-colors cursor-pointer focus:outline-none text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Licensing Permissions info */}
            <div className="md:col-span-2 space-y-4 text-left">
              <h4 className="font-mono text-[10px] tracking-widest text-white uppercase font-bold">
                Digital Licensing
              </h4>
              <ul className="space-y-2.5 text-xs text-stone-400">
                <li className="hover:text-white transition-colors">Single-Build Licences</li>
                <li className="hover:text-white transition-colors">Unlimited Multi-Use CAD</li>
                <li className="hover:text-white transition-colors">MEP Systems Standards</li>
                <li className="hover:text-white transition-colors">Permit Filing Protocols</li>
              </ul>
            </div>

           

          </div>

          {/* Bottom Legal Credits & Scroll up anchor */}
          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <p className="font-mono text-[10px] text-stone-500">
              © {new Date().getFullYear()} OREN DESIGN AND BUILD . ALL RIGHTS RESERVED. DESIGNED BY POLOZTECH.
            </p>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenAdmin}
                className="text-stone-500 hover:text-[#84e114] flex items-center gap-1.5 font-mono text-[10px] uppercase cursor-pointer focus:outline-none transition-colors"
                title="Admin Dashboard"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-[#84e114]" />
                <span>Admin Portal</span>
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-stone-500 hover:text-white flex items-center gap-1 font-mono text-[10px] uppercase cursor-pointer focus:outline-none"
              >
                <span>Back to Top</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      <FloatingWhatsApp />
    </div>
  );
}
