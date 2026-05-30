import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const collections = [
  {
    href: "/collections/nouveautes",
    slug: "nouveautes",
    name: "Nouveautés atelier",
    description: "Les dernières créations pour henna, fiançailles et fêtes.",
    image: "/collection/nouveautes.png",
  },
  {
    href: "/collections/populaires",
    slug: "populaires",
    name: "Coups de cœur",
    description: "Les plateaux, coffrets et décors les plus demandés.",
    image: "/collection/populaires.png",
  },
  {
    href: "/collections/promotions",
    slug: "promotions",
    name: "Offres cérémonie",
    description: "Des remises pour préparer vos grands moments.",
    image: "/collection/promotions.png",
  },
  {
    href: "/collections/top-ventes",
    slug: "top-ventes",
    name: "Packs demandés",
    description: "Les formules complètes pour petits espaces, salons et grandes salles.",
    image: "/collection/top-ventes.png",
  },
];

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8 sm:mb-10">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary">
                Collections
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground">
                Explorez nos univers traditionnels
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl font-body">
                Des sélections inspirantes pour henna, fiançailles, diplôme et soirées familiales.
              </p>
            </div>
        
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={collection.href}
                className="group relative rounded-3xl overflow-hidden border border-border/60 bg-card shadow-luxury hover:shadow-elevated transition-all duration-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent z-10" />
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                    Collection
                  </div>
                  <h2 className="mt-3 font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {collection.name}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">{collection.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
