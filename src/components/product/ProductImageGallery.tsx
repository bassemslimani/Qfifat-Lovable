import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Share2, ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  discount: number | null;
  inStock: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isToggling: boolean;
  onShare?: () => void;
}

export function ProductImageGallery({
  images,
  productName,
  discount,
  inStock,
  isFavorite,
  onToggleFavorite,
  isToggling,
  onShare,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, direction: "rtl" });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
      setSelectedIndex(index);
    },
    [emblaApi]
  );

  const validImages = images.filter(Boolean);

  if (validImages.length === 0) {
    return (
      <div className="mb-6">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary">
          <img
            src="/placeholder.svg"
            alt={productName}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Zoom Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center p-4"
            style={{ zIndex: 99998 }}
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation for zoomed view */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev + 1) % validImages.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.img
              key={selectedIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={validImages[selectedIndex]}
              alt={productName}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Thumbnails in zoom view */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {validImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(index);
                    }}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedIndex === index
                        ? "border-white ring-2 ring-white/50"
                        : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 lg:mb-0">
        {/* Desktop Layout: Main Image + Vertical Thumbnails */}
        <div className="hidden lg:flex lg:gap-4">
          {/* Vertical Thumbnails */}
          {validImages.length > 1 && (
            <div className="flex flex-col gap-3 w-24">
              {validImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedIndex === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-border"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 relative">
            <div
              className="relative aspect-square rounded-2xl overflow-hidden bg-secondary cursor-zoom-in group"
              onClick={() => setIsZoomed(true)}
            >
              <motion.img
                key={selectedIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={validImages[selectedIndex]}
                alt={`${productName} - صورة ${selectedIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Zoom hint */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-900/90 rounded-full p-3">
                  <ZoomIn className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {discount && (
                  <span className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    -{discount}%
                  </span>
                )}
                {!inStock && (
                  <span className="bg-gray-800/80 text-white text-sm font-medium px-3 py-1.5 rounded-lg">
                    نفذ المخزون
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout: Carousel */}
        <div className="lg:hidden">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex">
                {validImages.map((img, index) => (
                  <div
                    key={index}
                    className="relative flex-[0_0_100%] min-w-0 aspect-square bg-secondary"
                  >
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={img}
                      alt={`${productName} - صورة ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={scrollNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg text-foreground hover:bg-card transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={scrollPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-lg text-foreground hover:bg-card transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {discount && (
                <span className="bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded-lg">
                  -{discount}%
                </span>
              )}
              {!inStock && (
                <span className="bg-muted text-muted-foreground text-sm font-medium px-3 py-1 rounded-lg">
                  نفذ المخزون
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-4 left-4 flex gap-2">
              <button
                onClick={onToggleFavorite}
                disabled={isToggling}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isFavorite ? "bg-red-500 text-white" : "bg-card text-muted-foreground"
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>
              {onShare && (
                <button
                  onClick={onShare}
                  className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Dots Indicator */}
            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {validImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedIndex
                        ? "bg-primary w-6"
                        : "bg-card/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery (Mobile) */}
          {validImages.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
              {validImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedIndex === index
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
