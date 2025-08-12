"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RestaurantClientPage from "../[id]/RestaurantClientPage";
import type { Restaurant } from "@/components/data";
import { fetchFullRestaurants, fetchRestaurantByIdWithData } from "@/services/restaurants";

export default function RestaurantEntryPage() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const [initialRestaurant, setInitialRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [r, all] = await Promise.all([
          fetchRestaurantByIdWithData(id),
          fetchFullRestaurants().catch(() => []),
        ]);
        if (!cancelled) {
          setInitialRestaurant(r);
          setRestaurants(all);
        }
      } catch {
        if (!cancelled) {
          setInitialRestaurant(null);
          setRestaurants([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (!id) {
    return null;
  }
  if (!initialRestaurant) {
    return null;
  }
  return <RestaurantClientPage initialRestaurant={initialRestaurant} restaurants={restaurants} />;
}


