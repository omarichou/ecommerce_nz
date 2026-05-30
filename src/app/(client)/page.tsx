import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { HeroSlider } from "@/components/home/HeroSlider";
import { CategoryCarousel } from "@/components/home/CategoryCarousel";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ServicesSection } from "@/components/home/ServicesSection";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-luxury text-foreground">
      <Header />
      <main>
        <HeroSlider />

        {/* <section className="-mt-12 sm:-mt-16 lg:-mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="relative rounded-3xl border border-border/70 bg-background/90 backdrop-blur-xl shadow-elevated">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/30 pointer-events-none" />
              <div className="relative grid grid-cols-2 lg:grid-cols-4 divide-x divide-border/60 overflow-hidden">
                {[
                  { label: "Clients satisfaits", value: "8K+", sub: "Note 4.9/5" },
                  { label: "Références", value: "1.2K", sub: "Stocks variés" },
                  { label: "Livraison rapide", value: "24/48h", sub: "Suivi inclus" },
                  { label: "Retours faciles", value: "7 jours", sub: "Satisfait ou remboursé" },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className={`px-4 sm:px-6 py-5 sm:py-6 text-center ${index > 1 ? "border-t border-border/60 lg:border-t-0" : ""}`}
                  >
                    <p className="font-display text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground">
                      {item.value}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-1">
                      {item.label}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                      <span className="h-1 w-5 rounded-full bg-primary/70" />
                      {item.sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section> */}

        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Finitions traditionnelles",
                  description: "Doré, bordeaux, ivoire et détails soignés pour vos cérémonies.",
                },
                {
                  title: "Personnalisation atelier",
                  description: "Broderie, impression thermique, verre et vinyle selon votre thème.",
                },
                {
                  title: "Vente & location déco",
                  description: "Des pièces seules aux packs complets pour préparer votre soirée.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-border/60 bg-background/80 p-6 sm:p-7 shadow-luxury"
                >
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mt-2">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ServicesSection />

        <section className="py-2 sm:py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="h-px bg-border/60" />
          </div>
        </section>

        <CategoryCarousel />

        <section className="py-2 sm:py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="h-px bg-border/60" />
          </div>
        </section>

        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-6">
              <span className="inline-block text-primary text-xs sm:text-sm tracking-[0.25em] uppercase">Sélections</span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mt-2">
                Découvrez nos essentiels de fête
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">
                Plateaux, coffrets, décors et packs prêts pour vos moments importants.
              </p>
            </div>
          </div>
          <ProductGrid />
        </section>

        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-secondary/40 via-background to-secondary/20 p-6 sm:p-10 lg:p-12 shadow-luxury">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
              <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr,1fr] items-center">
                <div>
                  <span className="text-xs sm:text-sm tracking-[0.3em] uppercase text-primary font-body">
                    Collection Signature
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold mt-3">
                    Préparez une cérémonie chaleureuse avec nos essentiels traditionnels
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-xl">
                    Des plateaux henné aux packs complets, chaque détail est pensé pour une fête élégante, personnalisée et facile à organiser.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                  <a
                    href="/collections"
                    className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium shadow-gold hover:shadow-elevated transition-all"
                  >
                    Explorer les catégories
                  </a>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full border border-primary/40 text-primary px-6 py-3 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    Demander conseil
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="pb-20 lg:pb-0">
        <Footer />
      </div>

      <MobileBottomNav />
    </div>
  );
}

