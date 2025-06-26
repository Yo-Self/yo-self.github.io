"use client";

import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";
import SearchBar from "@/components/SearchBar";
import React, { useState } from "react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100">
      <Header />
      <Carousel />
      <MenuSection searchTerm={searchTerm} />
      {/* Modal will be added here */}
      <SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
    </div>
  );
}
