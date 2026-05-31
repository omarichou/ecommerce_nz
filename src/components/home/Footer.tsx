"use client";

import { forwardRef, useState } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      setClickCount(0);
      router.push("/admin/login");
    }

    setTimeout(() => setClickCount(0), 2000);
  };

  const handleNewsletterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newsletterEmail.trim();
    if (!email) {
      setNewsletterStatus("error");
      setNewsletterMessage("Veuillez saisir un email valide.");
      return;
    }
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      setNewsletterStatus("error");
      setNewsletterMessage("Format d'email invalide.");
      return;
    }

    try {
      setNewsletterStatus("loading");
      setNewsletterMessage("");
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Erreur lors de l'inscription");
      }
      setNewsletterStatus("success");
      setNewsletterMessage("Merci ! Vérifiez votre email pour confirmer votre inscription.");
      setNewsletterEmail("");
    } catch (error) {
      console.error(error);
      setNewsletterStatus("error");
      setNewsletterMessage("Impossible de finaliser l'inscription.");
    }
  };

  return (
    <footer ref={ref} className="bg-foreground text-background">
      <div className="border-b border-background/10">
        <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-display text-2xl lg:text-3xl font-semibold mb-3">Restez informé</h3>
            <p className="text-background/70 font-body mb-6">
              Recevez nos nouveautés ateliers, packs cérémonie et offres personnalisées.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body"
              />
              <Button variant="gold" className="gap-2" type="submit" disabled={newsletterStatus === "loading"}>
                <Send className="w-4 h-4" />
                {newsletterStatus === "loading" ? "Envoi..." : "S'inscrire"}
              </Button>
            </form>
            {newsletterMessage && (
              <p
                className={`mt-3 text-sm ${
                  newsletterStatus === "success" ? "text-emerald-400" : newsletterStatus === "error" ? "text-red-400" : "text-background/70"
                }`}
                aria-live="polite"
              >
                {newsletterMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-display text-2xl font-bold mb-4 text-gradient-gold">Ateliers Henna & Traditions</h4>
            <p className="text-background/70 font-body text-sm leading-relaxed mb-6">
              Plateaux henné, accessoires de fête, broderie, impression et vinyle adhésif pour célébrer les traditions avec soin.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h5 className="font-display text-lg font-semibold mb-4">Liens Rapides</h5>
            <ul className="space-y-3 font-body text-sm">
              {["Accueil", "Ateliers", "Catégories", "Packs", "Contact"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-background/70 hover:text-primary transition-colors hover-underline">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-display text-lg font-semibold mb-4">Catégories</h5>
            <ul className="space-y-3 font-body text-sm">
              {["Plateau Henné", "Accessoires Fiançailles", "Tenues Diplôme", "Soirée Henné", "Pack complet"].map((cat) => (
                <li key={cat}>
                  <a href="#" className="text-background/70 hover:text-primary transition-colors hover-underline">
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-display text-lg font-semibold mb-4">Contact</h5>
            <ul className="space-y-4 font-body text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-background/70">Nedroma, Tlemcen, Algérie</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="tel:+213772118770" className="text-background/70 hover:text-background transition-colors">
                  0772 11 87 70
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="mailto:Zinejod454@gmail com" className="text-background/70 hover:text-background transition-colors">
                  Zinejod454@gmail com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-background/50 text-sm font-body">
              © {" "}
              <span onClick={handleSecretClick} className="cursor-default select-none" title="">
                2026
              </span>{" "}
              Ateliers Henna & Traditions. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm font-body">
              <a href="#" className="text-background/50 hover:text-background transition-colors">
                Conditions d'utilisation
              </a>
              <a href="#" className="text-background/50 hover:text-background transition-colors">
                Politique de confidentialité
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
export { Footer };
