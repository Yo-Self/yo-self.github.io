"use client";

import React from "react";
import { useTranslation } from "./i18n";

export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="header bg-white dark:bg-black shadow-sm py-4">
      <div className="container mx-auto flex items-center justify-center px-4">
        <h1 className="logo text-xl font-bold text-gray-900 dark:text-gray-100">The Golden Spoon</h1>
      </div>
    </header>
  );
} 