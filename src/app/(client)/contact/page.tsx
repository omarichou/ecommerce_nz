"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, Facebook, Instagram } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/home/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Message envoyé !", { description: "Nous vous répondrons dans les plus brefs délais." });
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  const contactInfo = [
    { icon: MapPin, title: "Adresse", content: "Nedroma, Tlemcen, Algérie", subtitle: "Ateliers Henna & Traditions" },
    { icon: Phone, title: "Téléphone", content: "0772 11 87 70", subtitle: "Du Samedi au Jeudi" },
    { icon: Mail, title: "Email", content: "Zinejod454@gmail com", subtitle: "Réponse sous 24h" },
    { icon: Clock, title: "Horaires", content: "9h00 - 18h00", subtitle: "Samedi - Jeudi" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-28 sm:pt-32 pb-20">
        <section className="relative py-16 sm:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-gold opacity-10" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <span className="text-primary font-body text-sm tracking-[0.3em] uppercase mb-4 block">Nous Contacter</span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6">
              Restons en Contact
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une question, une commande spéciale ou un pack cérémonie à préparer ?
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 -mt-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-elevated transition-all duration-300 animate-fade-in"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                  <info.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">{info.title}</h3>
                <p className="text-foreground font-medium">{info.content}</p>
                <p className="text-sm text-muted-foreground mt-1">{info.subtitle}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Envoyez-nous un message</h2>
                  <p className="text-muted-foreground text-sm">Nous vous répondrons sous 24 heures</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nom complet *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Votre nom"
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0XXX XX XX XX"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Sujet *</label>
                    <input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Sujet de votre message"
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Votre message..."
                    rows={5}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>

                <Button type="submit" variant="gold" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                  {isSubmitting ? "Envoi en cours..." : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer le message
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-muted rounded-2xl overflow-hidden h-64 lg:h-80 relative">
                <iframe
                  src="https://www.google.com/maps?q=Nedroma,+Tlemcen,+Algeria&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">Suivez-nous</h3>
                <p className="text-muted-foreground mb-6">
                  Rejoignez notre communauté pour découvrir nos derniers plateaux, décors et ateliers.
                </p>
                <div className="flex gap-3">
                  <a href="#" className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10">
                    <Facebook className="w-5 h-5 text-primary" />
                  </a>
                  <a href="#" className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10">
                    <Instagram className="w-5 h-5 text-primary" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
