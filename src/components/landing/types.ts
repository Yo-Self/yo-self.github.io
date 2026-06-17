import type { ReactNode } from "react";

export interface LandingDish {
  name: string;
  description: string;
  price: string;
  image: string;
  tags?: string[];
}

export type LandingAccent = "cyan" | "amber";

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  colSpan?: 1 | 2 | 4;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: ReactNode;
}
