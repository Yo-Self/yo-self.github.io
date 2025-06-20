"use client";

import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import MenuSection from "@/components/MenuSection";
import SearchBar from "@/components/SearchBar";
import React, { useState } from "react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <Carousel />
      <MenuSection searchTerm={searchTerm} />
      {/* Modal will be added here */}
      <SearchBar searchTerm={searchTerm} onSearchTermChange={setSearchTerm} />
    </div>
  );
}
