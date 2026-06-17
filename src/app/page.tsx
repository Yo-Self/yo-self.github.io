"use client";

import { useEffect } from "react";
import { useRestaurant } from "@/context/RestaurantContext";
import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingCardapioSection from "@/components/landing/LandingCardapioSection";
import LandingGestorSection from "@/components/landing/LandingGestorSection";
import LandingPaymentsSection from "@/components/landing/LandingPaymentsSection";
import LandingUIShowcase from "@/components/landing/LandingUIShowcase";
import LandingCarouselDemo from "@/components/landing/LandingCarouselDemo";
import LandingCTA from "@/components/landing/LandingCTA";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  const { setRestaurantId } = useRestaurant();

  useEffect(() => {
    setRestaurantId("cafe-moendo");
  }, [setRestaurantId]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-gray-900 dark:text-gray-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      <LandingHero />
      <LandingHowItWorks />
      <LandingCardapioSection />
      <LandingPaymentsSection />
      <LandingGestorSection />
      <LandingCarouselDemo />
      <LandingUIShowcase />
      <LandingCTA />
      <LandingFooter />
    </main>
  );
}
