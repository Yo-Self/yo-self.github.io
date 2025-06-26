"use client";
import { restaurants } from "@/components/data";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 md:p-10 mx-2">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Select Restaurant</h1>
        <div className="flex flex-col gap-8">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurant/${restaurant.id}`}
              className="block rounded-2xl overflow-hidden shadow group focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <div className="relative h-48 md:h-56 w-full">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 flex items-end rounded-2xl">
                  <span className="text-white text-2xl md:text-3xl font-bold p-6 pb-8 drop-shadow-lg">
                    {restaurant.name}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
