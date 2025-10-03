"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const TABLE_STORAGE_KEY = "table_id";
const TABLE_TIMESTAMP_KEY = "table_scanned_at";

/**
 * Component that handles the 'table' query parameter from QR codes.
 * When the app loads with a ?table=XXX parameter:
 * 1. Saves the table ID to localStorage
 * 2. Removes the parameter from the URL
 */
export default function TableParamHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const tableParam = searchParams.get("table");

    if (tableParam) {
      try {
        // Save table ID and timestamp to localStorage
        const timestamp = new Date().toISOString();
        localStorage.setItem(TABLE_STORAGE_KEY, tableParam);
        localStorage.setItem(TABLE_TIMESTAMP_KEY, timestamp);
        
        // Create new URLSearchParams without the 'table' parameter
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete("table");

        // Build new URL
        const newUrl = newSearchParams.toString()
          ? `${pathname}?${newSearchParams.toString()}`
          : pathname;

        // Replace current URL without the 'table' parameter
        router.replace(newUrl, { scroll: false });

        console.log(`[TableParamHandler] Table ID "${tableParam}" saved to localStorage at ${timestamp}`);
      } catch (error) {
        console.error("[TableParamHandler] Error saving table ID:", error);
      }
    }
  }, [searchParams, router, pathname]);

  return null;
}

/**
 * Utility function to get the current table ID from localStorage
 */
export function getTableId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(TABLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Utility function to get the timestamp when the table was scanned
 * @returns ISO timestamp string or null if not available
 */
export function getTableScannedAt(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(TABLE_TIMESTAMP_KEY);
  } catch {
    return null;
  }
}

/**
 * Utility function to clear the table ID and timestamp from localStorage
 */
export function clearTableId(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(TABLE_STORAGE_KEY);
    localStorage.removeItem(TABLE_TIMESTAMP_KEY);
  } catch (error) {
    console.error("[TableParamHandler] Error clearing table ID:", error);
  }
}
