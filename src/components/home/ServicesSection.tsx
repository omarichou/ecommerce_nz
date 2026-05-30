import { GlassWater, Palette, Sparkles, Tags } from "lucide-react";

const services = [
  {
    icon: Sparkles,
    title: "طبق الحنة بكل لوازمه",
    description: "Plateau henné complet avec ornements, rubans et bougies.",
  },
  {
    icon: Palette,
    title: "الطرز الإلكتروني / طباعة حرارية",
    description: "Broderie numérique et impression thermique personnalisée.",
  },
  {
    icon: GlassWater,
    title: "طباعة على الزجاج / قارورة الماء",
    description: "Impression sur verre et gourdes pour cadeaux de fête.",
  },
  {
    icon: Tags,
    title: "بيع ورق الفينيل",
    description: "Vinyle adhésif lettres, formes, gros et détail.",
  },
];

export const ServicesSection = () => {
  return (
    <section className="py-10 sm:py-14 lg:py-18 border-t border-b border-border bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center mb-8">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-primary">
            Nos ateliers
          </span>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground mt-3">
            Créations traditionnelles & personnalisation
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
          {services.map((service, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-gold mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-gold">
                <service.icon className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xs sm:text-base lg:text-lg font-semibold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors leading-tight">
                {service.title}
              </h3>
              <p className="text-[10px] sm:text-sm text-muted-foreground font-body line-clamp-2 px-1">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
