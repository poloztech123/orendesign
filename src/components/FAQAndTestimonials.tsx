import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, ArrowRight, Sparkles, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { FAQItem, Testimonial } from '../types';

interface FAQAndTestimonialsProps {
  faqItems: FAQItem[];
  testimonials: Testimonial[];
  onRequestGeneralModification: () => void;
}

export default function FAQAndTestimonials({
  faqItems,
  testimonials,
  onRequestGeneralModification
}: FAQAndTestimonialsProps) {
  // Accordion active state (stores the active FAQ ID or null)
  const [activeFaqId, setActiveFaqId] = useState<string | null>("faq-included");
  // Testimonial slider index
  const [testIdx, setTestIdx] = useState(0);

  const toggleFaq = (id: string) => {
    setActiveFaqId(activeFaqId === id ? null : id);
  };

  const handlePrevTest = () => {
    setTestIdx((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTest = () => {
    setTestIdx((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  const currentTestimonial = testimonials[testIdx];

  return (
    <section id="faq-section" className="py-20 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        {/* LEFT COLUMN: Clean Accordion Accordion FAQ */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#1B4332] font-bold uppercase block mb-3">
              Answers & Explanations
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="font-display text-sm sm:text-base text-stone-500 font-light mt-2 max-w-lg">
              Demystifying permitting parameters, stamps, and licensing boundaries.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            {faqItems.map((item) => {
              const isOpen = activeFaqId === item.id;
              return (
                <div
                  key={item.id}
                  className="border border-stone-200 bg-white rounded-xl overflow-hidden transition-all duration-300"
                  id={`faq-accordion-${item.id}`}
                >
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full py-4 px-5 text-left flex justify-between items-center hover:bg-stone-50 transition-colors duration-200 focus:outline-none cursor-pointer group"
                  >
                    <span className="font-display font-semibold text-stone-900 text-sm md:text-base group-hover:text-[#1B4332] transition-colors leading-snug pr-4">
                      {item.question}
                    </span>
                    <div className="text-[#1B4332] bg-[#1B4332]/10 p-1.5 rounded-full">
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>

                  {/* Accordion body with smooth maxHeight transitions */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[300px] border-t border-stone-150 py-4 px-5' : 'max-h-0 py-0 px-5 pointer-events-none opacity-0'
                    }`}
                  >
                    <p className="font-display font-light text-stone-500 text-xs sm:text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Premium Dark Modification Card */}
        <div className="lg:col-span-5 h-full">
          <div
            id="modification-cta"
            className="bg-stone-950 text-white rounded-2xl p-8 border border-[#1B4332]/30 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[380px] group"
          >
            {/* Subtle overlay elements for luxury feel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1B4332]/5 rounded-full filter blur-xl group-hover:bg-[#1B4332]/10 transition-all duration-500" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-[#1B4332]/5 rounded-full filter blur-2xl" />

            <div className="space-y-6 relative z-10 text-left">
              <div className="inline-flex items-center gap-2 bg-[#1B4332]/10 border border-[#1B4332]/30 px-3 py-1 rounded-sm">
                <Sparkles className="h-3.5 w-3.5 text-[#1B4332]" />
                <span className="font-mono text-[9px] tracking-widest text-[#cbe3db] uppercase font-bold">
                  Custom Adaptation Desk
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-white leading-snug">
                Need Specific Modifications?
              </h3>

              <p className="font-display text-stone-400 font-light text-xs sm:text-sm leading-relaxed">
                Work directly with our master drafting and design team to alter any pre-made blueprint. We will adapt foundations to match slope layouts, extend structural bays, or flip layouts to capture scenic views.
              </p>

              <div className="space-y-2.5 font-display text-xs text-stone-300 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1B4332] shrink-0" />
                  <span>Personalized architectural reviews.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1B4332] shrink-0" />
                  <span>Draft turnaround within 4-6 business days.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#1B4332] shrink-0" />
                  <span>100% compliant with local setback rules.</span>
                </div>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <button
                onClick={onRequestGeneralModification}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-4 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group/btn cursor-pointer shadow-lg shadow-black/30"
              >
                <span>Request a Modification</span>
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1.5 transition-transform duration-300" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* LOWER ROW: High Fidelity Testimonial Slider */}
      <div className="mt-20 md:mt-24 bg-stone-50 rounded-2xl border border-stone-100 p-8 md:p-12 relative overflow-hidden text-left">
        <div className="max-w-4xl mx-auto">
          <div className="text-center md:text-left mb-8">
            <span className="font-mono text-xs tracking-widest text-[#1B4332] font-bold uppercase block mb-1">
              Customer Build Proofs
            </span>
            <h3 className="font-serif text-2xl font-semibold text-stone-900 tracking-tight">
              Successful Client Projects
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center" id="testimonial-slider-container">
            {/* Testimonial Badge Box */}
            <div className="md:col-span-4 relative aspect-[4/3] sm:aspect-[16/10] md:aspect-square bg-stone-900 rounded-xl overflow-hidden shadow-md flex flex-col justify-between p-6 text-white border border-stone-800">
              {currentTestimonial.image ? (
                <>
                  <img
                    src={currentTestimonial.image}
                    alt={currentTestimonial.clientName}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <span className="font-mono text-[10px] tracking-widest text-[#84e114] uppercase font-bold bg-black/60 backdrop-blur-md px-2.5 py-1 rounded">
                      Verified Build
                    </span>
                    <div className="flex gap-0.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded">
                      {[...Array(currentTestimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 space-y-1">
                    <div className="font-display font-semibold text-white text-base">
                      {currentTestimonial.clientName}
                    </div>
                    <div className="font-mono text-[11px] text-[#84e114] uppercase font-bold truncate">
                      {currentTestimonial.project}
                    </div>
                    <div className="font-mono text-[10px] text-stone-300">
                      {currentTestimonial.location}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] tracking-widest text-[#84e114] uppercase font-bold">
                      Verified Client
                    </span>
                    <div className="flex gap-0.5">
                      {[...Array(currentTestimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>

                  <div className="my-auto text-center py-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#1B4332] text-white flex items-center justify-center font-serif text-xl font-bold border border-white/20 mb-3">
                      {currentTestimonial.clientName.charAt(0)}
                    </div>
                    <div className="font-display font-medium text-stone-200 text-sm">
                      {currentTestimonial.clientName}
                    </div>
                    <div className="font-mono text-[10px] text-stone-400 uppercase mt-0.5">
                      {currentTestimonial.location}
                    </div>
                  </div>

                  <div className="bg-stone-950/80 backdrop-blur-md text-stone-300 px-3 py-1.5 rounded text-[10px] font-mono border border-white/10 uppercase text-center truncate">
                    {currentTestimonial.project}
                  </div>
                </>
              )}
            </div>

            {/* Testimonial comments & controls */}
            <div className="md:col-span-8 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                {/* Star rating icons */}
                <div className="flex gap-1">
                  {[...Array(currentTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-amber-500 fill-current" />
                  ))}
                </div>

                {/* Main Quote */}
                <p className="font-serif text-base sm:text-lg md:text-xl italic text-stone-800 leading-relaxed font-light">
                  &ldquo;{currentTestimonial.quote}&rdquo;
                </p>

                {/* Project identity */}
                <div className="pt-2">
                  <h4 className="font-display font-semibold text-stone-900 text-sm">
                    {currentTestimonial.clientName}
                  </h4>
                  <p className="font-mono text-[10px] tracking-widest text-[#1B4332] uppercase mt-0.5 font-bold">
                    {currentTestimonial.project}
                  </p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between md:justify-start gap-4 pt-4 border-t border-stone-200">
                <span className="font-mono text-xs text-stone-400">
                  {testIdx + 1} of {testimonials.length} clients
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrevTest}
                    className="p-2 bg-white hover:bg-stone-100 border border-stone-200 hover:border-stone-300 rounded-full text-stone-600 transition-all cursor-pointer shadow-sm hover:scale-105"
                    aria-label="Previous testimonial"
                    id="btn-prev-testimonial"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextTest}
                    className="p-2 bg-white hover:bg-stone-100 border border-stone-200 hover:border-stone-300 rounded-full text-stone-600 transition-all cursor-pointer shadow-sm hover:scale-105"
                    aria-label="Next testimonial"
                    id="btn-next-testimonial"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
