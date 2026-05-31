"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Slide {
  img: string;
  title: string;
  subtitle: string;
  cta: string;
  link_url: string;
}

const slides: Slide[] = [
  {
    img: "/hero/henna-hero.png",
    title: "Ateliers Henna & Traditions",
    subtitle: "Plateaux henné, accessoires de fête et détails personnalisés pour vos grandes occasions",
    cta: "Découvrir les plateaux",
    link_url: "/category/tabaq-henna",
  },
  {
    img: "/hero/fiancailles-hero.png",
    title: "لوازم الخطوبة",
    subtitle: "Coffrets alliance, bougies et décors de table prêts pour une demande soignée",
    cta: "Préparer la khitba",
    link_url: "/category/loouazem-khitba",
  },
  {
    img: "/hero/qaada-hero.png",
    title: "قعدة الحنة",
    subtitle: "Décors muraux, lanternes, coussins et packs complets pour une soirée chaleureuse",
    cta: "Voir les packs",
    link_url: "/category/qaada-loouazem",
  },
];

export const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const nextSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const prevSlide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const parallaxOffset = scrollY * 0.4;

  return (
    <section ref={sectionRef} className="relative h-[60vh] sm:h-[70vh] lg:h-[88vh] overflow-hidden mt-20">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-all duration-700 ease-out ${
              index === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
          >
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(120deg, hsla(30, 10%, 8%, 0.85) 0%, hsla(30, 10%, 8%, 0.45) 55%, hsla(30, 10%, 8%, 0.9) 100%)",
              }}
            />

            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translateY(${parallaxOffset}px) scale(1.1)`,
              }}
            >
              <Image src={slide.img} alt={slide.title} fill className="object-cover" sizes="100vw" />
            </div>

            <div className="absolute inset-0 z-20 flex items-center">
              <div className="container mx-auto px-4 sm:px-6 lg:px-12">
                <div className="max-w-2xl">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full bg-background/10 backdrop-blur-md border border-cream/20 px-3 py-1 text-[10px] sm:text-xs text-cream/90 mb-4 transition-all duration-700 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Personnalisation • Vente & location
                  </div>
              
                  <h1
                    className={`font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-3 sm:mb-6 leading-[1.15] text-cream transition-all duration-700 delay-100 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                  >
                    {slide.title}
                  </h1>
                  <p
                    className={`font-body text-sm sm:text-lg lg:text-xl text-cream/80 mb-4 sm:mb-8 max-w-lg leading-relaxed transition-all duration-700 delay-200 line-clamp-2 sm:line-clamp-none ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                  >
                    {slide.subtitle}
                  </p>
                  <div
                    className={`transition-all duration-700 delay-300 ${
                      index === currentSlide ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={slide.link_url}>
                        <Button
                          variant="gold"
                          size="default"
                          className="font-body tracking-wide group text-sm sm:text-base px-5 sm:px-7"
                        >
                          <span>{slide.cta}</span>
                          <ChevronRight className="w-4 h-4 ml-1.5 sm:ml-2 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                      <Link href="/collections">
                        <Button
                        variant="secondary"
                          size="default"
                          className="font-body tracking-wide text-sm sm:text-base px-5 sm:px-7"
                        >
                          Voir nos ateliers
                        </Button>
                      </Link>
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3 text-xs text-cream/80">
                      <span className="rounded-full border border-cream/30 px-3 py-1">Finitions dorées</span>
                      <span className="rounded-full border border-cream/30 px-3 py-1">Créations sur mesure</span>
                      <span className="rounded-full border border-cream/30 px-3 py-1">Paiement à la livraison</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* <button
        onClick={prevSlide}
        className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/10 backdrop-blur-sm border border-cream/20 text-cream hover:bg-background/20 transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-background/10 backdrop-blur-sm border border-cream/20 text-cream hover:bg-background/20 transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button> */}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-500 ${
              index === currentSlide ? "w-8 h-2 bg-primary rounded-full" : "w-2 h-2 bg-cream/50 rounded-full hover:bg-cream/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-50 bg-gradient-to-t from-charcoal/90 via-charcoal/90 to-transparent z-20 pointer-events-none" />

      {/* <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 hidden lg:flex flex-col items-center gap-2 animate-bounce">
        <div className="w-6 h-10 border-2 border-cream/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div> */}
    </section>
  );
};
