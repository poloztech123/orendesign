import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Home, Building2, Palmtree, Settings, ArrowRight, HelpCircle } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';

export default function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const phone = '256773633868';

  const inquiries = [
    {
      title: 'Residential Blueprints',
      desc: 'Villas, townhouses, and family homes',
      icon: Home,
      color: 'bg-emerald-50 text-[#1B4332]',
      message: 'Hello Oren Design and Build! I am interested in inquiring about your Residential architectural plans.'
    },
    {
      title: 'Commercial & Offices',
      desc: 'Business parks, high-rises, and offices',
      icon: Building2,
      color: 'bg-blue-50 text-blue-800',
      message: 'Hello Oren Design and Build! I would like to inquire about your Commercial & Office blueprint packages.'
    },
    {
      title: 'Hospitality & Resorts',
      desc: 'Boutique hotels, lodges, and wellness hubs',
      icon: Palmtree,
      color: 'bg-amber-50 text-amber-800',
      message: 'Hello Oren Design and Build! I am interested in exploring hospitality or resort planning designs.'
    },
    {
      title: 'Custom Mods & MEP Specs',
      desc: 'Layout tweaks or structural adjustments',
      icon: Settings,
      color: 'bg-stone-100 text-stone-800',
      message: 'Hello Oren Design and Build! I would like to inquire about custom structural modifications or MEP specs.'
    },
    {
      title: 'General Consultation',
      desc: 'Speak directly with our chief architect',
      icon: HelpCircle,
      color: 'bg-purple-50 text-purple-800',
      message: 'Hello Oren Design and Build! I have a general inquiry about your modern architectural design and build services.'
    }
  ];

  const handleInquiry = (message: string) => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="floating-whatsapp-container">
      {/* Popover Menu */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-16 right-0 w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden animate-scale-up"
          id="whatsapp-inquiry-popover"
        >
          {/* Header */}
          <div className="bg-[#1B4332] text-white p-5 relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-stone-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full focus:outline-none"
              aria-label="Close"
              id="close-whatsapp-popover"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-full shadow-md flex items-center justify-center">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              </div>
              <div>
                <h4 className="font-semibold text-sm tracking-tight">Oren Design Desk</h4>
                <p className="text-[10px] text-emerald-200 font-mono uppercase tracking-wider mt-0.5">
                  ● Typically replies in minutes
                </p>
              </div>
            </div>
            <p className="text-xs text-stone-200 font-light mt-3 leading-relaxed">
              Hello! Choose an inquiry channel below to launch a chat directly with an Oren planning specialist.
            </p>
          </div>

          {/* Inquiry Options */}
          <div className="max-h-[320px] overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {inquiries.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleInquiry(item.message)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors text-left group border border-transparent hover:border-stone-100 cursor-pointer focus:outline-none"
                  id={`whatsapp-channel-btn-${idx}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${item.color} flex items-center justify-center`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="block font-medium text-stone-800 text-xs">{item.title}</span>
                      <span className="block text-[10px] text-stone-400 font-light mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-[#1B4332] group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="bg-stone-50 py-3 px-5 border-t border-stone-100 text-center">
            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
              Secured Architectural Consultation
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center rounded-full shadow-2xl hover:shadow-emerald-500/15 cursor-pointer border focus:outline-none transition-all duration-300 ${
          isOpen
            ? 'h-14 w-14 bg-stone-900 border-stone-800 text-white hover:scale-105'
            : 'h-14 w-14 bg-[#25D366] border-emerald-500 text-white hover:scale-110 active:scale-95'
        }`}
        title="Inquire on WhatsApp"
        aria-label="Inquire on WhatsApp"
        id="floating-whatsapp-trigger"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-spin-once" />
        ) : (
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Pulsing ring animation when collapsed */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75 animate-ping -z-10"></span>
            <WhatsAppIcon className="h-7 w-7 text-white" />
          </div>
        )}
      </button>
    </div>
  );
}
