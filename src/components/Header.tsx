import React from "react";

export default function Header() {
  return (
    <header className="header bg-white dark:bg-black shadow-sm py-4">
      <div className="container mx-auto flex items-center justify-between px-4">
        <button
          className="menu-toggle text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          id="menuToggle"
          aria-label="Open menu"
        >
          <span>≡</span>
        </button>
        <h1 className="logo text-xl font-bold text-gray-900 dark:text-gray-100">The Golden Spoon</h1>
        <button
          className="share-btn p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          id="shareBtn"
          aria-label="Share"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>
    </header>
  );
} 