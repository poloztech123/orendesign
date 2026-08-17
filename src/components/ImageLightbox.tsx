import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Sparkles, Play, Video } from 'lucide-react';
import { ArchitecturalPlan } from '../types';
import { downloadWatermarkedImage } from '../utils/watermark';
import { getEmbedVideoUrl, isEmbedVideo, isDataVideo } from '../utils/video';
import { formatImageUrls } from '../utils/image';

interface ImageLightboxProps {
  plan: ArchitecturalPlan | null;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ plan, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract all media items safely (images followed by videos)
  const rawPlanImages = plan ? (plan.images && plan.images.length > 0 ? plan.images : [plan.image]) : [];
  const planImages = formatImageUrls(rawPlanImages);
  const planVideos = plan?.videos || [];
  const mediaItems = [
    ...planImages.map((img) => ({ type: 'image' as const, url: img })),
    ...planVideos.map((vid) => ({ type: 'video' as const, url: vid }))
  ];

  const handlePrev = () => {
    if (mediaItems.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleNext = () => {
    if (mediaItems.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % mediaItems.length);
  };

  // Sync index when lightbox opens or plan changes
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      document.body.style.overflow = 'hidden'; // Lock background scrolling
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialIndex, plan]);

  // Keyboard navigation (Always registered, but conditionally executed)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, mediaItems.length]);

  if (!isOpen || !plan || mediaItems.length === 0) return null;

  const handleDownload = async () => {
    if (isDownloading) return;
    const activeMedia = mediaItems[activeIndex];
    if (!activeMedia || activeMedia.type !== 'image') return;
    setIsDownloading(true);
    try {
      await downloadWatermarkedImage(activeMedia.url, plan.name, plan.projectNo);
    } catch (err) {
      console.error('Failed to download watermarked image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 md:p-8 animate-fade-in select-none">
      
      {/* Lightbox Header */}
      <div className="flex justify-between items-center w-full z-10 py-2 border-b border-stone-850">
        <div className="text-left">
          <span className="font-mono text-[9px] font-bold tracking-widest text-[#84e114] uppercase block">
            {plan.style}
          </span>
          <h3 className="font-sans font-bold text-white text-base sm:text-lg tracking-tight leading-tight">
            {plan.name} – Gallery Slideshow
          </h3>
          <p className="font-mono text-[10px] text-stone-400 mt-0.5">
            {mediaItems[activeIndex]?.type === 'video' ? 'Video' : 'Photo'} {activeIndex + 1} of {mediaItems.length}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {/* Download Render */}
          {mediaItems[activeIndex]?.type === 'image' && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-stone-900/80 hover:bg-stone-800 disabled:opacity-50 text-white border border-stone-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-md outline-none"
              title="Download this watermarked render"
            >
              {isDownloading ? (
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
              <span className="hidden sm:inline">Download Render</span>
            </button>
          )}

          {/* Download All (Bulk Download) */}
          {planImages.length > 0 && (
            <button
              onClick={async () => {
                if (isDownloading) return;
                setIsDownloading(true);
                try {
                  for (let i = 0; i < planImages.length; i++) {
                    const imgUrl = planImages[i];
                    const customName = `${plan.name} Image ${i + 1}`;
                    await downloadWatermarkedImage(imgUrl, customName, plan.projectNo);
                    if (i < planImages.length - 1) {
                      await new Promise((r) => setTimeout(r, 600));
                    }
                  }
                } catch (err) {
                  console.error("Bulk watermark download failed:", err);
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="bg-stone-900/80 hover:bg-stone-800 disabled:opacity-50 text-[#84e114] border border-stone-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shadow-md outline-none"
              title="Download all project images"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Download All ({planImages.length})</span>
              <span className="sm:hidden">All ({planImages.length})</span>
            </button>
          )}

          {/* Close Lightbox */}
          <button
            onClick={onClose}
            className="p-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-full border border-stone-800 transition-transform hover:rotate-90 duration-300 cursor-pointer outline-none"
            aria-label="Close slideshow"
            id="close-lightbox"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Slideshow viewport */}
      <div className="flex-1 relative flex items-center justify-center my-4 sm:my-6 md:my-8 max-h-[70vh]">
        {/* Previous Button */}
        {mediaItems.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-0 sm:left-4 z-20 p-3 rounded-full bg-stone-900/60 hover:bg-stone-800/90 border border-stone-800/50 text-white hover:text-[#84e114] transition-all cursor-pointer outline-none shadow-lg transform active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Center Active Media */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl border border-stone-900 shadow-2xl bg-stone-950">
          {mediaItems[activeIndex]?.type === 'video' ? (
            isDataVideo(mediaItems[activeIndex].url) ? (
              <video
                src={mediaItems[activeIndex].url}
                className="max-w-full max-h-full object-contain select-none animate-scale-up"
                controls
                playsInline
                autoPlay
                muted
                key={mediaItems[activeIndex].url}
              />
            ) : isEmbedVideo(mediaItems[activeIndex].url) ? (
              <iframe
                src={getEmbedVideoUrl(mediaItems[activeIndex].url)}
                className="w-full h-full aspect-video max-w-4xl max-h-[60vh] rounded-lg shadow-xl"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                key={mediaItems[activeIndex].url}
              />
            ) : (
              <video
                src={mediaItems[activeIndex].url}
                className="max-w-full max-h-full object-contain select-none animate-scale-up"
                controls
                playsInline
                autoPlay
                muted
                key={mediaItems[activeIndex].url}
              />
            )
          ) : (
            <img
              src={mediaItems[activeIndex]?.url}
              alt={`${plan.name} photo detail`}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain select-none animate-scale-up"
              key={mediaItems[activeIndex]?.url} // Force component remount to trigger animate-scale-up
            />
          )}
        </div>

        {/* Next Button */}
        {mediaItems.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 sm:right-4 z-20 p-3 rounded-full bg-stone-900/60 hover:bg-stone-800/90 border border-stone-800/50 text-white hover:text-[#84e114] transition-all cursor-pointer outline-none shadow-lg transform active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnails list at bottom */}
      <div className="w-full shrink-0 z-10 pt-4 border-t border-stone-850">
        <div className="max-w-4xl mx-auto">
          {mediaItems.length > 1 && (
            <div className="flex justify-center gap-2.5 overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {mediaItems.map((item, idx) => {
                const isVid = item.type === 'video';
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative h-14 w-24 rounded-lg border transition-all duration-350 overflow-hidden shrink-0 cursor-pointer ${
                      activeIndex === idx
                        ? 'border-[#84e114] ring-2 ring-[#84e114]/30 scale-105 shadow-[0_0_15px_rgba(132,225,20,0.2)]'
                        : 'border-stone-800 opacity-60 hover:opacity-100 hover:border-stone-600'
                    }`}
                  >
                    {isVid ? (
                      <div className="h-full w-full bg-stone-900 flex flex-col items-center justify-center relative">
                        {isDataVideo(item.url) ? (
                          <video src={item.url} className="h-full w-full object-cover opacity-70" muted controls={false} />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-stone-950 text-stone-500">
                            <Video className="h-4 w-4 text-[#84e114]/80" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <Play className="h-3.5 w-3.5 text-white fill-white" />
                        </div>
                      </div>
                    ) : (
                      <img src={item.url} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover select-none" />
                    )}
                    <div className={`absolute inset-0 bg-stone-950/20 transition-opacity ${activeIndex === idx ? 'opacity-0' : 'hover:opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          )}
          
          {/* Quick tips label */}
          <div className="text-center text-[10px] text-stone-500 font-mono mt-1 select-none">
            Use Left & Right arrow keys to navigate • Press Escape to exit
          </div>
        </div>
      </div>
      
    </div>
  );
}
