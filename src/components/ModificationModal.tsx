import React, { useState, useRef } from 'react';
import { X, Sparkles, Check, Paperclip, Send, AlertCircle, FileText, Trash2, UploadCloud } from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { saveInquiry } from '../lib/firebase';

interface ModificationModalProps {
  plan: ArchitecturalPlan | null;
  onClose: () => void;
}

export default function ModificationModal({ plan, onClose }: ModificationModalProps) {
  if (!plan) return null;

  const [clientName, setClientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMods, setSelectedMods] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const modOptions = [
    "Flip / Mirror Layout (Reverse Orientation)",
    "Extend or Alter Garage Bay Capacity",
    "Add / Reconfigure Bedrooms & Bathrooms",
    "Adjust Ceiling Heights or Entry Foyer",
    "Modify Roof Pitch / Pitch Geometry",
    "Adapt Siding Material Specifications"
  ];

  const handleModToggle = (opt: string) => {
    if (selectedMods.includes(opt)) {
      setSelectedMods(selectedMods.filter((o) => o !== opt));
    } else {
      setSelectedMods([...selectedMods, opt]);
    }
  };

  // Drag and drop events for file uploading
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setAttachments((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !email || !phone) return;

    setIsSubmitting(true);
    
    const newReq = {
      planId: plan.id,
      planName: plan.name,
      clientName,
      email,
      phone,
      details: instructions || `Requested modifications: ${selectedMods.join(', ')}`,
      selectedModifications: selectedMods,
      timestamp: new Date().toISOString()
    };

    // Save to server database so admin panel lists it across all devices
    try {
      await saveInquiry(newReq);
    } catch (err) {
      console.error('Failed to save inquiry to server database:', err);
    }

    // Also save to localStorage
    try {
      const existingStr = localStorage.getItem('oren_modification_requests') || localStorage.getItem('atelier_modification_requests') || '[]';
      const existing = JSON.parse(existingStr);
      localStorage.setItem('oren_modification_requests', JSON.stringify([newReq, ...existing]));
    } catch (err) {
      console.error('Failed to save request:', err);
    }

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const isFormValid = clientName && email && phone && selectedMods.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden relative animate-scale-up">
        
        {/* Sticky Modal Header */}
        <div className="bg-stone-50 border-b border-stone-100 py-4 px-6 flex justify-between items-center shrink-0">
          <span className="font-display font-semibold text-stone-900 text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#1B4332]" />
            <span>Request Layout Modification</span>
          </span>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 bg-stone-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
          {isSuccess ? (
            /* Successful intake response */
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="bg-green-50 text-[#1B4332] p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center border border-green-200">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-stone-900">Custom Intake Registered</h3>
                <p className="font-display font-light text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="font-semibold text-stone-800">{clientName}</span>. Your modification specifications for <span className="font-semibold text-stone-900">{plan.name}</span> have been sent directly to our master drafting team.
                </p>
              </div>

              {/* Summary specifications */}
              <div className="bg-stone-50 border border-stone-100 rounded-xl p-5 text-left font-display text-xs space-y-3 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-stone-200 pb-2">
                  <span className="text-stone-400 font-mono uppercase text-[9px]">Intake Receipt ID</span>
                  <span className="font-semibold text-stone-700 font-mono">#MOD-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
                <div>
                  <span className="text-stone-400 block mb-1">Requested Adjustments:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedMods.map((m) => (
                      <span key={m} className="bg-stone-200 text-stone-800 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                        {m.split(' (')[0]}
                      </span>
                    ))}
                  </div>
                </div>
                {instructions && (
                  <div>
                    <span className="text-stone-400 block">Brief Instructions:</span>
                    <p className="text-stone-700 mt-0.5 leading-relaxed italic pr-2 truncate max-h-16 overflow-hidden">
                      &ldquo;{instructions}&rdquo;
                    </p>
                  </div>
                )}
                {attachments.length > 0 && (
                  <div>
                    <span className="text-stone-400 block">Uploaded Sketches ({attachments.length}):</span>
                    <div className="text-stone-700 mt-1 space-y-1">
                      {attachments.map((file, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10.5px]">
                          <FileText className="h-3 w-3 text-[#1B4332]" />
                          <span className="font-mono truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Informative next steps */}
              <div className="max-w-md mx-auto bg-stone-100 border border-stone-200 p-4 rounded-xl text-xs text-stone-600 flex gap-2 text-left">
                <AlertCircle className="h-5 w-5 text-[#1B4332] shrink-0" />
                <p className="leading-normal">
                  Our core architectural drafting consultant will review your lot dimensions, local code restrictions, and specifications, then contact you via email (<span className="font-semibold">{email}</span>) within <strong>24 business hours</strong> with a detailed quote.
                </p>
              </div>

              <div className="pt-4 max-w-sm mx-auto">
                <button
                  onClick={onClose}
                  className="w-full bg-stone-900 hover:bg-[#1B4332] text-white py-3.5 px-6 rounded-xl font-display font-semibold text-sm transition-colors duration-300 shadow-md cursor-pointer"
                >
                  Done & Close Drawer
                </button>
              </div>
            </div>
          ) : (
            /* Modification Form inputs */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan badge display */}
              <div className="bg-green-50/50 border border-green-200/50 p-4 rounded-xl flex gap-4 items-center">
                <div className="p-2 bg-stone-900 text-[#cbe3db] rounded-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">Modifying {plan.name}</h4>
                  <p className="font-display font-light text-stone-500 text-xs">
                    Adjusting dimensions: {plan.sqft.toLocaleString()} Sq. Ft. • {plan.beds} Bed, {plan.baths} Bath blueprint layout.
                  </p>
                </div>
              </div>

              {/* Contact Information Fields */}
              <div className="space-y-3.5 text-xs font-display text-left">
                <h4 className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold border-b border-stone-100 pb-1">
                  1. Contact Coordinates
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mod-name" className="text-stone-500 block mb-1 font-semibold">Your Full Name</label>
                    <input
                      type="text"
                      id="mod-name"
                      required
                      placeholder="e.g. Marcus Sterling"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#1B4332] rounded-lg p-2.5 outline-none font-medium text-stone-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="mod-phone" className="text-stone-500 block mb-1 font-semibold">Phone Number</label>
                    <input
                      type="tel"
                      id="mod-phone"
                      required
                      placeholder="e.g. (615) 301-4402"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-[#1B4332] rounded-lg p-2.5 outline-none font-medium text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mod-email" className="text-stone-500 block mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    id="mod-email"
                    required
                    placeholder="e.g. marcus@sterling-development.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-[#1B4332] rounded-lg p-2.5 outline-none font-medium text-stone-900"
                  />
                </div>

                {/* Modification Type Checkboxes */}
                <h4 className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold border-b border-stone-100 pb-1 pt-3">
                  2. Targeted Adjustments (Select at least one)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {modOptions.map((opt) => {
                    const isChecked = selectedMods.includes(opt);
                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleModToggle(opt)}
                        className={`p-3 border rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer ${
                          isChecked
                            ? 'border-[#1B4332] bg-[#1B4332]/5 font-semibold text-stone-950'
                            : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                        }`}
                      >
                        <div className={`h-4 w-4 border rounded flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-[#1B4332] border-[#1B4332] text-white' : 'border-stone-300'
                        }`}>
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="text-[11px] leading-tight">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Text Instructions */}
                <h4 className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold border-b border-stone-100 pb-1 pt-3">
                  3. Detailed Modification Directive
                </h4>

                <div>
                  <label htmlFor="mod-instructions" className="text-stone-500 block mb-1 font-semibold">Custom Guidelines, Lot Slopes, or Room Alterations</label>
                  <textarea
                    id="mod-instructions"
                    rows={3}
                    placeholder="e.g. 'I would like to flip the entire kitchen wing to face the eastern side to capture sunrise light, and increase the double garage width by 4 feet to fit a workshop bench...'"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 focus:border-[#1B4332] rounded-lg p-2.5 outline-none font-medium text-stone-900 resize-none"
                  />
                </div>

                {/* Usability Drag and Drop File Uploader */}
                <h4 className="font-mono text-[10px] tracking-wider text-stone-400 uppercase font-bold border-b border-stone-100 pb-1 pt-3">
                  4. Supplemental Sketches or Plot Maps
                </h4>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                    isDragging
                      ? 'border-[#1B4332] bg-[#1B4332]/10'
                      : 'border-stone-300 hover:border-[#1B4332] hover:bg-stone-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.dwg"
                  />
                  <UploadCloud className="h-8 w-8 text-stone-400 mb-1" />
                  <p className="text-xs font-semibold text-stone-700">Drag & Drop files here, or click to browse</p>
                  <p className="text-[10px] text-stone-400">Accepts PNG, JPG, PDF, or DWG plots up to 25MB.</p>
                </div>

                {/* Render Attachments list */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-3 bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="font-mono text-[9px] tracking-wider text-stone-400 uppercase font-bold block mb-1">
                      Attachments ({attachments.length})
                    </span>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-stone-200/50">
                          <div className="flex items-center gap-1.5 min-w-0 pr-4">
                            <FileText className="h-3.5 w-3.5 text-[#1B4332] shrink-0" />
                            <span className="font-mono text-[11px] text-stone-700 truncate">{file.name}</span>
                            <span className="text-[9.5px] text-stone-400 font-sans shrink-0">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAttachment(idx);
                            }}
                            className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-[#1B4332] cursor-pointer"
                            title="Remove attachment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form submit with disabled state */}
              <div className="pt-4 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-full py-4 px-6 rounded-xl font-display font-semibold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    isSubmitting
                      ? 'bg-stone-400 text-stone-100 cursor-not-allowed'
                      : !isFormValid
                      ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      : 'bg-stone-900 hover:bg-[#1B4332] text-white hover:scale-[1.01]'
                  }`}
                  id="modification-submit-button"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">Analyzing Plot & Request...</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Submit Modification Request</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
