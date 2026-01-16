import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface ProductImageSliderProps {
  images: string[];
  productName: string;
  discount: number | null;
  inStock: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isToggling: boolean;
}

export function ProductImageSlider({
  images,
  productName,
  discount,
  inStock,
  isFavorite,
  onToggleFavorite,
  isToggling,
}: ProductImageSliderProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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
    (index: number) => emblaApi?.scrollTo(index),
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
    <div className="mb-6">
      {/* Main Slider */}
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
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-md text-muted-foreground">
            <Share2 className="h-5 w-5" />
          </button>
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

      {/* Thumbnail Gallery */}
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
  );
}