import React from 'react';
import { Phone, MessageSquare, Layers, X, ArrowRight } from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import WhatsAppIcon from './WhatsAppIcon';

interface ContactOptionsModalProps {
  plan: ArchitecturalPlan | null;
  onClose: () => void;
  onExplore: () => void;
}

export default function ContactOptionsModal({ plan, onClose, onExplore }: ContactOptionsModalProps) {
  if (!plan) return null;

  const encodedMessage = encodeURIComponent(
    `Hello Oren! I am interested in exploring custom options or purchasing "${plan.name}" (${plan.subtitle}).`
  );
  
  const whatsappUrl = `https://wa.me/256773633868?text=${encodedMessage}`;
  const phoneUrl = `tel:+256773633868`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-md border border-stone-200 shadow-2xl overflow-hidden relative animate-scale-up text-left flex flex-col">
        
        {/* Header Preview of Plan */}
        <div className="relative aspect-[16/10] w-full bg-stone-900 overflow-hidden">
          {plan.image ? (
            <img
              src={plan.image}
              alt={plan.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
          
          {/* Close button inside image */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-stone-900/60 hover:bg-stone-900/80 text-stone-200 hover:text-white rounded-full transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <span className="bg-[#1B4332] text-white text-[9px] font-mono tracking-widest font-semibold uppercase px-2 py-0.5 rounded-sm block mb-1.5 w-max">
              {plan.category}
            </span>
            <h3 className="font-serif text-lg font-semibold tracking-tight text-white leading-tight">
              {plan.name}
            </h3>
            <p className="font-display font-light text-stone-300 text-xs mt-0.5">
              {plan.subtitle}
            </p>
          </div>
        </div>

        {/* Interaction Body */}
        <div className="p-6 space-y-5">
          <div className="text-center sm:text-left">
            <h4 className="font-sans font-semibold text-stone-900 text-sm">
              Connect with our Design Desk
            </h4>
            <p className="font-display text-stone-500 font-light text-xs mt-1 leading-relaxed">
              Speak directly with an Oren advisor to review custom setbacks, structural modification lists, or to secure a localized builder license.
            </p>
          </div>

          <div className="space-y-3">
            {/* 1. WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full bg-[#1B4332] hover:bg-[#153427] text-white py-3.5 px-5 rounded-xl font-display font-semibold text-xs tracking-wide transition-all duration-300 flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Custom Inline WhatsApp SVG icon for pristine branding with white background badge */}
                <div className="bg-white p-1 rounded-full flex items-center justify-center">
                  <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
                </div>
                <span>Chat on WhatsApp</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-300 tracking-wider uppercase group-hover:translate-x-1 transition-transform flex items-center gap-1">
                <span>Active Chat</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </span>
            </a>

            {/* 2. Phone Call Button */}
            <a
              href={phoneUrl}
              onClick={onClose}
              className="w-full bg-stone-100 hover:bg-stone-150 border border-stone-200 text-stone-800 py-3.5 px-5 rounded-xl font-display font-semibold text-xs tracking-wide transition-all duration-200 flex items-center justify-between group shadow-sm cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Phone className="h-4.5 w-4.5 text-stone-500 group-hover:scale-110 transition-transform" />
                <span>Call Design Desk</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-stone-500 tracking-wider uppercase">
                +256 773 633868
              </span>
            </a>

            {/* 3. View Full Specs Button */}
            <button
              onClick={() => {
                onExplore();
                onClose();
              }}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-5 rounded-xl font-display font-semibold text-xs tracking-wide transition-all duration-200 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4.5 w-4.5 text-stone-400 group-hover:scale-110 transition-transform" />
                <span>View Blueprint Details</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-stone-400 tracking-wider uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Explore</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </span>
            </button>
          </div>
        </div>

        {/* Footer info line */}
        <div className="bg-stone-50 py-3 px-6 border-t border-stone-100 text-center">
          <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
            Licensed Architectural Studio
          </span>
        </div>
      </div>
    </div>
  );
}
