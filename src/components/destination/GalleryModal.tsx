"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Share2, Info, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GalleryImage {
  id?: string;
  url: string;
  label?: string;
  category?: string;
  caption?: string;
  attribution?: string;
}

interface GalleryModalProps {
  images: GalleryImage[];
  initialIndex: number;
  destination: string;
  isOpen: boolean;
  onClose: () => void;
}

export function GalleryModal({
  images,
  initialIndex,
  destination,
  isOpen,
  onClose,
}: GalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
  }, [initialIndex, isOpen]);

  const activeItem = images[currentIndex] || images[0];

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen || !activeItem) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = activeItem.url;
    link.target = "_blank";
    link.download = `${destination.toLowerCase()}-photo-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${destination} Photo`,
        text: activeItem.caption || `Explore ${destination}`,
        url: activeItem.url,
      });
    } else {
      navigator.clipboard.writeText(activeItem.url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 text-white relative z-20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              {activeItem.category || "Gallery"} • {currentIndex + 1} of {images.length}
            </span>
            <h4 className="text-sm md:text-base font-bold font-headline uppercase truncate max-w-xs md:max-w-md">
              {activeItem.label || destination}
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title={isZoomed ? "Zoom Out" : "Zoom In"}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            title="Share Image"
          >
            {copiedShare ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors ml-2"
            title="Close Preview"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-4 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Image Container */}
        <div className="relative max-w-5xl max-h-[75vh] flex items-center justify-center overflow-auto rounded-2xl transition-all duration-300">
          <img
            src={activeItem.url}
            alt={activeItem.caption || destination}
            className={`object-contain transition-transform duration-500 rounded-2xl shadow-2xl ${
              isZoomed ? "scale-150 cursor-zoom-out" : "scale-100 cursor-zoom-in"
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-4 z-30 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10 flex items-center justify-center transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Info & Captions Bar */}
      <div className="p-4 md:p-6 border-t border-white/10 text-white bg-black/50 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5 text-center md:text-left">
          <p className="text-xs font-bold text-zinc-200">
            {activeItem.caption || `High resolution visual of ${destination}`}
          </p>
          <span className="text-[9px] font-medium text-zinc-400 block">
            {activeItem.attribution || "Photo via Unsplash / OnlyExplore"}
          </span>
        </div>

        {/* Thumbnails Row */}
        <div className="flex gap-2 overflow-x-auto max-w-md pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setIsZoomed(false); setCurrentIndex(i); }}
              className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                i === currentIndex ? "border-primary scale-105 opacity-100" : "border-transparent opacity-40 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={img.label || `Thumb ${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
