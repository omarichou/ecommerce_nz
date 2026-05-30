import Link from "next/link";
import { Heart, Award, Users, Truck, CheckCircle2, Sparkles } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Heart,
    title: "Passion",
    description: "Chaque produit est sélectionné avec amour et attention pour satisfaire nos clients.",
  },
  {
    icon: Award,
    title: "Qualité",
    description: "Nous ne proposons que des articles de qualité supérieure à des prix compétitifs.",
  },
  {
    icon: Users,
    title: "Service Client",
    description: "Une équipe dévouée à votre écoute pour répondre à toutes vos questions.",
  },
  {
    icon: Truck,
    title: "Livraison Rapide",
    description: "Expédition dans toute l'Algérie avec suivi de votre commande.",
  },
];

const stats = [
  { value: "5000+", label: "Clients Satisfaits" },
  { value: "10000+", label: "Commandes Livrées" },
  { value: "500+", label: "Produits Uniques" },
  { value: "58", label: "Wilayas Desservies" },
];

const features = [
  "Produits authentiques et de qualité premium",
  "Prix compétitifs sans intermédiaires",
  "Paiement sécurisé à la livraison",
  "Livraison rapide partout en Algérie",
  "Service client réactif et à l'écoute",
  "Politique de retour simplifiée",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-5" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <span className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4 block animate-fade-in">
              À Propos de Nous
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 animate-fade-in">
              Ateliers Henna & Traditions
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Votre adresse pour les plateaux henné, accessoires de fête, broderie et créations personnalisées.
              Nous accompagnons les familles dans la préparation de cérémonies chaleureuses et soignées.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
                <img
                  src="/hero/henna-hero.png"
                  alt="Notre atelier"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 sm:w-48 sm:h-48 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <div className="text-center text-primary-foreground">
                  <p className="font-display text-3xl sm:text-4xl font-bold">10+</p>
                  <p className="text-sm sm:text-base">Années de savoir-faire</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-8">
              <span className="text-primary font-body text-sm tracking-[0.2em] uppercase mb-4 block">
                Notre Histoire
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-6">
                Une tradition travaillée en atelier
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Ateliers Henna & Traditions réunit l’univers de la henna, des fiançailles, des remises de diplôme
                  et des fêtes familiales dans une boutique pensée pour les préparatifs importants.
                </p>
                <p>
                  Nous préparons des plateaux, coffrets, décors, impressions et détails personnalisés avec une
                  attention particulière aux couleurs, aux matières et aux finitions.
                </p>
                <p>
                  De la pièce simple au pack complet, notre objectif est de vous aider à organiser une cérémonie
                  belle, pratique et fidèle à vos traditions.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/category/tabaq-henna">
                  <Button variant="gold" size="lg">Découvrir nos produits</Button>
                </Link>
                <Link href="/contact">
                  <Button variant="outline" size="lg">Nous contacter</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-charcoal py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center animate-fade-in">
                  <p className="font-display text-4xl sm:text-5xl font-bold text-gradient-gold mb-2">
                    {stat.value}
                  </p>
                  <p className="text-cream/80 text-sm sm:text-base">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 sm:py-20">
          <div className="text-center mb-12">
            <span className="text-primary font-body text-sm tracking-[0.2em] uppercase mb-4 block">
              Nos Valeurs
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground">
              Ce Qui Nous Distingue
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-elevated transition-all duration-300 animate-fade-in"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-xl bg-primary/10 flex items-center justify-center">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-muted/50 py-16 sm:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
              <div>
                <span className="text-primary font-body text-sm tracking-[0.2em] uppercase mb-4 block">
                  Pourquoi Nous Choisir
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold text-foreground mb-6">
                  Votre Satisfaction, Notre Priorité
                </h2>
                <p className="text-muted-foreground mb-8">
                  Chez Ateliers Henna & Traditions, nous mettons tout en œuvre pour simplifier vos préparatifs.
                  Du choix du pack à la personnalisation, chaque détail compte.
                </p>

                <ul className="space-y-4">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                    <img
                    src="/category_image2/loouazem-khitba.png"
                      alt="Accessoires fiançailles"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                    {/* <img
                      src="/category_image2/tabaq-henna.png"
                      alt="Plateau henné"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    /> */}
                      <img
                      src="/category_image2/tabaq-henna.png"
                      alt="Plateau henné"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                    <img
                      src="/category_image2/qaada-henna.png"
                      alt="Soirée henné"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
                    <img
                      src="/category_image2/libas-takharuj.png"
                      alt="Tenues remise de diplôme"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto bg-gradient-gold rounded-3xl p-8 sm:p-12 text-center">
            <Sparkles className="w-12 h-12 text-primary-foreground mx-auto mb-6" />
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-primary-foreground mb-4">
              Prêt à célébrer ?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
              Explorez nos plateaux, accessoires et packs pour préparer votre cérémonie en toute sérénité.
            </p>
            <Link href="/collections">
              <Button variant="luxury" size="lg" className="bg-background text-foreground">
                Explorer la boutique
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
