// "use client";

// import { useRef } from "react";
// import Link from "next/link";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { categories } from "@/data/products";

// export const CategoryCarousel = () => {
//   const scrollRef = useRef<HTMLDivElement>(null);

//   const scroll = (direction: "left" | "right") => {
//     if (scrollRef.current) {
//       const scrollAmount = 280;
//       scrollRef.current.scrollBy({
//         left: direction === "left" ? -scrollAmount : scrollAmount,
//         behavior: "smooth",
//       });
//     }
//   };

//   return (
//     <section className="py-10 sm:py-16 lg:py-24 bg-gradient-to-b from-background to-secondary/30">
//       <div className="container mx-auto px-4 sm:px-6 lg:px-12">
//         <div className="text-center mb-8 sm:mb-12">
//           <span className="inline-block text-primary font-body text-xs sm:text-sm tracking-[0.2em] uppercase mb-2 sm:mb-3">
//             Parcourez
//           </span>
//           <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mb-3 sm:mb-4">
//             Nos Catégories
//           </h2>
//             <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto font-body">
//               Trouvez rapidement l’inspiration grâce à nos univers soigneusement sélectionnés.
//             </p>
//           <div className="flex items-center justify-center gap-3">
//             <div className="h-px w-12 sm:w-16 bg-gradient-to-r from-transparent to-primary" />
//             <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
//             <div className="h-px w-12 sm:w-16 bg-gradient-to-l from-transparent to-primary" />
//           </div>
//         </div>

//         <div className="relative group">
//           <button
//             onClick={() => scroll("left")}
//             className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-card shadow-elevated border border-border text-foreground hover:bg-accent transition-all duration-300 hover:scale-110 hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100"
//             aria-label="Scroll left"
//           >
//             <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
//           </button>
//           <button
//             onClick={() => scroll("right")}
//             className="absolute -right-3 lg:-right-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-card shadow-elevated border border-border text-foreground hover:bg-accent transition-all duration-300 hover:scale-110 hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100"
//             aria-label="Scroll right"
//           >
//             <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
//           </button>

//           <div
//             ref={scrollRef}
//             className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-2 snap-x snap-mandatory"
//           >
//             {categories.map((category, index) => (
//               <Link
//                 key={category.name_search}
//                 href={`/category/${category.name_search}`}
//                 className="flex-shrink-0 group/card cursor-pointer snap-start"
//                 style={{ animationDelay: `${index * 100}ms` }}
//               >
//                 <div className="relative w-28 sm:w-40 lg:w-48 bg-card rounded-2xl overflow-hidden shadow-luxury hover:shadow-elevated transition-all duration-500 border border-border hover:border-primary/30">
//                   <div className="relative aspect-square overflow-hidden">
//                     <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent z-10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
//                     <img
//                       src={category.img_url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop"}
//                       alt={category.name}
//                       className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).src =
//                           "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&h=300&fit=crop";
//                       }}
//                     />
//                   </div>

//                   <div className="p-2 sm:p-3 lg:p-4 text-center">
//                     <h3 className="font-display text-xs sm:text-sm lg:text-base font-semibold text-foreground group-hover/card:text-primary transition-colors duration-300 truncate">
//                       {category.name}
//                     </h3>
//                   </div>

//                   <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-gold transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 origin-left" />
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };


"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { categories } from "@/data/products";

export const CategoryCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8 sm:mb-10">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary">
              Nos catégories
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">
              Explorez nos univers traditionnels
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-body">
              Plateaux henné, fiançailles, diplôme et soirées complètes réunis au même endroit.
            </p>
          </div>
        
        </div>

        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className="absolute -left-3 lg:-left-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-card shadow-elevated border border-border text-foreground hover:bg-accent transition-all duration-300 hover:scale-110 hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute -right-3 lg:-right-6 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-card shadow-elevated border border-border text-foreground hover:bg-accent transition-all duration-300 hover:scale-110 hidden sm:flex sm:opacity-0 sm:group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-2 snap-x snap-mandatory"
          >
            {categories.map((category, index) => (
              <Link
                key={category.name_search}
                href={`/category/${category.name_search}`}
                className="flex-shrink-0 group/card cursor-pointer snap-start"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative w-32 sm:w-44 lg:w-52 bg-card rounded-3xl overflow-hidden shadow-luxury hover:shadow-elevated transition-all duration-500 border border-border/60 hover:border-primary/30">
                  <div className="relative aspect-square overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent z-10" />
                    <img
                      src={category.img_url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=320&h=320&fit=crop"}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=320&h=320&fit=crop";
                      }}
                    />
                    <div className="absolute bottom-3 left-3 right-3 z-20">
                      <div className="inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-[9px] sm:text-xs font-semibold text-foreground shadow-lg">
                        {category.name}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
