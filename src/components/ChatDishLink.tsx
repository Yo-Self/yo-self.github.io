import React from "react";
import { Dish } from "./data";

interface ChatDishLinkProps {
  dish: Dish;
  onClick?: () => void;
}

export default function ChatDishLink({ dish, onClick }: ChatDishLinkProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium underline decoration-dotted underline-offset-2 transition-colors duration-200"
    >
      <span>{dish.name}</span>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  );
} 