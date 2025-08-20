"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RestaurantClientPage from "../[slug]/RestaurantClientPage";
import type { Restaurant } from "@/components/data";
import { fetchFullRestaurants, fetchRestaurantByIdWithData } from "@/services/restaurants";

function EntryClient() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const [initialRestaurant, setInitialRestaurant] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  useEffect(() => {
    if (!id) return;
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

  if (!id || !initialRestaurant) {
    return null;
  }
  return <RestaurantClientPage initialRestaurant={initialRestaurant} restaurants={restaurants} />;
}

export default function RestaurantEntryPage() {
  return (
    <Suspense fallback={null}>
      <EntryClient />
    </Suspense>
  );
}


