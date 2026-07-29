import React, { useState } from 'react';
import { X, CreditCard, ShieldCheck, Download, Sparkles, Check, CheckCircle2, ShoppingCart, ArrowLeft, Lock, Smartphone } from 'lucide-react';
import { ArchitecturalPlan, CartItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItem: CartItem | null;
  onPurchaseSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItem,
  onPurchaseSuccess
}: CheckoutModalProps) {
  if (!isOpen || !cartItem) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Tip states
  const [tipInput, setTipInput] = useState('0.00');
  const [tip, setTip] = useState(0);

  // Steps
  const [paymentStep, setPaymentStep] = useState<'billing' | 'pesapal'>('billing');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<'mtn' | 'airtel'>('mtn');
  const [paymentPhone, setPaymentPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Mobile money and payment simulation states
  const [simulatedStatus, setSimulatedStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleTipChange = (val: string) => {
    setTipInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      setTip(parsed);
    } else {
      setTip(0);
    }
  };

  const isBillingValid = name.trim() !== '' && email.trim() !== '' && phone.trim() !== '';

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBillingValid) return;
    setPaymentPhone(phone); // pre-populate phone with billing number
    setPaymentStep('pesapal');
  };

  const isPaymentValid = true;

  const handlePesapalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentValid) return;

    setIsSubmitting(true);
    setSimulatedStatus('processing');
    
    // Simulate transaction verification for MTN/Airtel payment
    setTimeout(() => {
      setSimulatedStatus('success');
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        setSimulatedStatus('idle');
        onPurchaseSuccess();
      }, 1500);
    }, 2500);
  };

  // Triggers client-side generation and download of actual plan guidelines & structure
  const handleDownloadBlueprint = () => {
    const blueprintData = `
================================================================================
                    OREN ARCHITECTURAL MARKETPLACE
                    STRUCTURAL & CONSTRUCTION DIRECTORY
================================================================================
ORDER ID: ORN-ORD-${Math.floor(100000 + Math.random() * 900000)}
PLAN: ${cartItem.plan.name} (${cartItem.plan.subtitle})
CLASSIFICATION: ${cartItem.plan.style}
LICENSE PACKAGE: ${cartItem.licenseType}
TRANSACTION AMOUNT: $ ${(cartItem.price + tip).toLocaleString()}
DATE OF ISSUANCE: ${new Date().toLocaleDateString()}

--------------------------------------------------------------------------------
BUILDING METRICS:
- Plot Size: ${cartItem.plan.sqft.toLocaleString()} Sq. Ft.
- Width Dimension: ${cartItem.plan.width}
- Depth Dimension: ${cartItem.plan.depth}
- Stories: ${cartItem.plan.stories}
- Garage Bay Count: ${cartItem.plan.garageBays}

--------------------------------------------------------------------------------
ARCHITECTURAL GROUND LEVEL ROOM SCHEDULES:
${cartItem.plan.floors[0].rooms.map(r => `- ${r.name}: ${r.dimensions} [X-Pct:${r.x}%, Y-Pct:${r.y}%]\n  Description: ${r.description}`).join('\n')}

--------------------------------------------------------------------------------
BUILDER LICENSE GUIDELINES:
1. This file represents a certified draft package license. Under the selection
   of the ${cartItem.licenseType} package, you have been issued a single-build
   and structural layout license for construction.
2. Ensure you hand over this document along with the associated Vector CAD DWG
   files (enclosed in full packages) to a local licensed structural engineer
   or architect. They will append structural stamps complying with regional
   seismic, snow load, and environmental setback conditions.
3. This blueprint is equipped with standard timber specifications.
   Materials lists and lumber takeoffs are cataloged in supplemental chapters.

Thank you for choosing OREN Architectural Marketplace.
Engineering the boundaries of modern living.
================================================================================
    `;

    const blob = new Blob([blueprintData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OREN_BLUEPRINT_PACKAGE_${cartItem.plan.id.toUpperCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const finalUSDTotal = cartItem.price + tip;
  const finalUGXTotal = finalUSDTotal * 3700;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Outer Checkout Layout */}
      <div className="w-full max-w-5xl h-[95vh] sm:h-[90vh] rounded-2xl shadow-[0_45px_90px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative animate-scale-up bg-[#0B0D11] text-stone-100 border border-stone-800">
        
        {/* Loader Overlays with Interactive Mobile Money Simulator */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-[#0B0D11]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
            <div className="bg-[#16181E] border border-stone-800 p-8 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl">
              <div className="relative flex items-center justify-center h-12 w-12 mx-auto">
                <div className="h-12 w-12 rounded-full border-4 border-stone-800 border-t-[#84e114] animate-spin absolute" />
                <ShieldCheck className="h-5 w-5 text-[#84e114] absolute animate-pulse" />
              </div>
              <h3 className="text-white font-sans font-semibold text-sm">Verifying Transfer</h3>
              <p className="text-stone-400 font-sans text-xs leading-relaxed">
                Contacting network operators to securely verify the manual transfer to our {selectedPaymentOption === 'mtn' ? 'MTN number +256 773 633868' : 'Airtel number 0207 857000'}.
              </p>
              <div className="text-[10px] text-stone-500 font-mono">
                Please wait while we secure your blueprint download package. This will take a few seconds...
              </div>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="py-4 px-6 sm:px-8 border-b flex justify-between items-center shrink-0 bg-[#0F1115] border-stone-850">
          {isSuccess ? (
            <span className="font-sans font-semibold text-sm text-white flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-[#84e114]" />
              <span>Purchase Completed Successfully</span>
            </span>
          ) : paymentStep === 'pesapal' ? (
            <>
              <button
                onClick={() => setPaymentStep('billing')}
                className="font-sans font-medium text-stone-300 hover:text-white text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Billing</span>
              </button>
              <span className="font-sans text-xs sm:text-sm text-[#84e114] font-semibold flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#84e114]" /> Secure checkout
              </span>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="font-sans font-medium text-stone-300 hover:text-white text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Plan</span>
              </button>
              <span className="font-sans text-xs sm:text-sm text-[#84e114] font-semibold flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#84e114]" /> Secure Checkout
              </span>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full cursor-pointer transition-colors text-stone-400 hover:text-white bg-stone-900/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          {isSuccess ? (
            /* Success confirmation panel */
            <div className="text-center py-6 space-y-6 animate-fade-in text-stone-100 max-w-xl mx-auto text-left">
              <div className="bg-green-950/40 text-green-400 p-4 rounded-full w-14 h-14 mx-auto flex items-center justify-center border border-green-800">
                <Check className="h-7 w-7" />
              </div>
              
              <div className="space-y-2 text-center">
                <h3 className="font-serif text-2xl font-bold text-white">Blueprint Secured</h3>
                <p className="font-sans font-light text-stone-400 text-xs sm:text-sm max-w-md mx-auto">
                  Thank you, <span className="font-semibold text-stone-200">{name}</span>. Your payment was processed successfully. Your licensing files and digital packages are generated and ready for instant handoff.
                </p>
              </div>

              {/* Order invoice summary */}
              <div className="bg-[#16181E] border border-stone-800 rounded-xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400 font-mono uppercase text-[9px]">Receipt ID</span>
                  <span className="font-semibold text-stone-200 font-mono">#ORN-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">Design Chosen:</span>
                  <span className="font-medium text-stone-200">{cartItem.plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">License Package:</span>
                  <span className="font-medium text-stone-200">{cartItem.licenseType}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-400">Tip Added:</span>
                    <span className="font-medium text-stone-200">$ {tip.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-stone-800 pt-2 font-semibold">
                  <span className="text-stone-200">Total Charged:</span>
                  <span className="text-[#84e114] font-mono text-sm">$ {(cartItem.price + tip).toLocaleString()}</span>
                </div>
              </div>

              {/* DOWNLOAD AND FINISH ACTIONS */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleDownloadBlueprint}
                  className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01]"
                >
                  <Download className="h-4.5 w-4.5" />
                  <span>Download Blueprint Package</span>
                </button>
                
                <p className="font-mono text-[9px] tracking-wide text-stone-500 text-center">
                  This contains complete CAD instructions, room dimensions and lumber specifications.
                </p>

                <button
                  onClick={onPurchaseSuccess}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-white py-3 px-6 rounded-xl font-display font-semibold text-sm transition-colors duration-200 cursor-pointer border border-stone-800"
                >
                  Done & Continue
                </button>
              </div>
            </div>
          ) : paymentStep === 'pesapal' ? (
            /* Clear & simple payment page showing ONLY logos and phone numbers */
            <div className="max-w-2xl mx-auto space-y-8 py-8 animate-fade-in text-left">
              <div className="text-center space-y-2">
                <h3 className="font-serif text-2xl font-bold text-white tracking-tight">Manual Mobile Money Payment</h3>
                <p className="text-xs text-stone-400 font-light max-w-md mx-auto">
                  Please make your manual transfer to either of our registered numbers below. Our design team will verify the transfer and grant instant license access.
                </p>
              </div>

              {/* Row of Cards with Brand Logos and numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* 1. MTN */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentOption('mtn')}
                  className={`border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg transition-all cursor-pointer ${
                    selectedPaymentOption === 'mtn'
                      ? 'border-[#84e114] bg-[#16181E] ring-2 ring-[#84e114]/30'
                      : 'border-stone-800 bg-[#16181E]/60 hover:bg-[#16181E]'
                  }`}
                >
                  <div className="bg-[#FFCC00] rounded-xl px-4 py-2 flex flex-col items-center justify-center border border-yellow-400 w-32 shadow-md shrink-0">
                    <span className="text-xs font-black tracking-tighter text-black uppercase leading-none border border-black px-2 py-0.5 rounded-full">MTN</span>
                    <span className="text-[7px] uppercase font-bold text-black leading-none mt-1">mobile money</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-stone-400 tracking-wider font-sans">MTN Number</span>
                    <span className="block font-mono font-bold text-lg text-white">+256 773 633868</span>
                  </div>
                </button>

                {/* 2. Airtel */}
                <button
                  type="button"
                  onClick={() => setSelectedPaymentOption('airtel')}
                  className={`border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow-lg transition-all cursor-pointer ${
                    selectedPaymentOption === 'airtel'
                      ? 'border-[#84e114] bg-[#16181E] ring-2 ring-[#84e114]/30'
                      : 'border-stone-800 bg-[#16181E]/60 hover:bg-[#16181E]'
                  }`}
                >
                  <div className="bg-[#E31221] rounded-xl px-4 py-2.5 flex flex-col items-center justify-center text-white font-sans font-bold text-[10px] leading-tight w-32 shadow-md shrink-0">
                    <span className="font-extrabold tracking-tighter leading-none text-white text-xs">airtel</span>
                    <span className="text-[7px] uppercase font-light leading-none text-white/90 mt-1">money</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-stone-400 tracking-wider font-sans">Airtel Number</span>
                    <span className="block font-mono font-bold text-lg text-white">0207 857000</span>
                  </div>
                </button>
              </div>

              {/* Action Buttons inside content block */}
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <button
                  onClick={handlePesapalSubmit}
                  className="w-full bg-[#852C3C] hover:bg-[#9E3547] text-white py-3.5 px-8 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <span>Proceed to Download</span>
                </button>
                <button
                  onClick={() => setPaymentStep('billing')}
                  className="w-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 py-3.5 px-8 rounded-xl font-display font-semibold text-sm transition-colors duration-200 cursor-pointer"
                >
                  Back to Billing
                </button>
              </div>
            </div>
          ) : (
            /* Billing Information & Payment Summary Column View (first screenshot) */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left animate-fade-in">
              {/* Left Column: Billing info */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="font-sans text-2xl font-bold text-stone-100 tracking-tight">Billing Information</h3>
                  <p className="text-xs text-stone-400 font-light mt-1">
                    Enter your billing details to complete the purchase.
                  </p>
                </div>

                <div className="bg-[#16181E] border border-stone-800 rounded-xl p-5 sm:p-6 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-stone-400 block mb-1.5 font-medium text-[11px] uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#13151A] border border-stone-800 text-stone-100 focus:border-[#84e114] rounded-lg p-3 outline-none font-medium text-sm transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-stone-400 block mb-1.5 font-medium text-[11px] uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#13151A] border border-stone-800 text-stone-100 focus:border-[#84e114] rounded-lg p-3 outline-none font-medium text-sm transition-colors"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-stone-400 block mb-1.5 font-medium text-[11px] uppercase tracking-wider">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#13151A] border border-stone-800 text-stone-100 focus:border-[#84e114] rounded-lg p-3 outline-none font-medium text-sm transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#16181E] border border-stone-800 rounded-xl p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <h4 className="font-display font-semibold text-sm text-stone-100">Payment Summary</h4>
                  </div>
                  
                  {/* Selected Drawings Box */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Selected Drawings</span>
                    <div className="bg-[#1C1F26] border border-stone-800 rounded-lg p-3.5 flex justify-between items-center">
                      <div>
                        <h5 className="font-sans font-medium text-xs text-stone-100">Architectural Drawings</h5>
                        <p className="text-[10px] text-stone-400 mt-0.5">Floor plans, elevations, sections</p>
                      </div>
                      <span className="font-mono font-bold text-stone-100 text-sm">$ {cartItem.price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Tip Box */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-stone-400 font-mono uppercase tracking-wider block">Add a Tip (Optional)</label>
                    <input
                      type="text"
                      value={tipInput}
                      onChange={(e) => handleTipChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#13151A] border border-stone-800 text-stone-100 focus:border-[#84e114] rounded-lg p-3 outline-none font-mono text-sm transition-colors"
                    />
                    <span className="text-[9px] text-stone-500 block">Enter a tip amount in USD</span>
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-stone-800 pt-3.5 space-y-2.5 text-xs">
                    <div className="flex justify-between text-stone-400 font-sans">
                      <span>Drawings Subtotal</span>
                      <span className="font-mono">$ {cartItem.price.toLocaleString()}</span>
                    </div>
                    {tip > 0 && (
                      <div className="flex justify-between text-stone-400 font-sans">
                        <span>Tip Amount</span>
                        <span className="font-mono">$ {tip.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-end border-t border-[#84e114]/20 pt-3">
                      <span className="text-stone-300 font-semibold font-sans">Final Total</span>
                      <div className="text-right">
                        <span className="text-[9px] text-stone-400 block font-mono uppercase leading-none">USD</span>
                        <span className="text-2xl font-mono font-bold text-stone-100 leading-none">$ {finalUSDTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Request a Discount Banner */}
                  <div className="bg-[#1C1F26] border border-stone-800 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-4.5 w-4.5 text-[#84e114] shrink-0 animate-pulse" />
                      <div className="text-left">
                        <h5 className="font-sans font-medium text-[11px] text-stone-100">Request a Discount</h5>
                        <p className="text-[9px] text-stone-400">Apply for a special offer before purchasing</p>
                      </div>
                    </div>
                    <span className="bg-[#852C3C]/20 border border-[#852C3C]/40 text-[#ff8e9e] font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                      Special...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Bar */}
        {!isSuccess && (
          <div className="p-5 shrink-0 flex flex-col items-center gap-2 border-t bg-[#0F1115] border-stone-850">
            {paymentStep === 'billing' ? (
              <>
                <button
                  onClick={handleProceedToPayment}
                  disabled={!isBillingValid}
                  className={`w-full max-w-2xl py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    !isBillingValid
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-850'
                      : 'bg-[#852C3C] hover:bg-[#9E3547] text-white hover:scale-[1.01]'
                  }`}
                >
                  <span>Proceed to Payment - $ {finalUSDTotal.toLocaleString()}</span>
                </button>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-1">
                  <ShieldCheck className="h-4 w-4 text-[#84e114] shrink-0" />
                  <span>Secure payment via Mobile Money</span>
                </div>
              </>
            ) : (
              <div className="text-[11.5px] text-stone-500 font-mono text-center">
                Make your manual mobile money transfer to our registered lines above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
