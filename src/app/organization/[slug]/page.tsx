import React from "react";
import { notFound } from "next/navigation";
import OrganizationClient from "./OrganizationClient";

// For static export compatibility, we need generateStaticParams
// but the actual data will be fetched dynamically on the client
export async function generateStaticParams() {
  // Return common organization slugs for static generation
  // The actual data will be fetched dynamically on the client
  return [
    { slug: 'auri-monteiro' },
    { slug: 'test-org' }
  ];
}

export default function OrganizationPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  
  // Protect against accidental call with literal "[slug]" during static export
  const decoded = (() => { 
    try { 
      return decodeURIComponent(slug); 
    } catch { 
      return slug; 
    } 
  })();
  
  if (decoded === '[slug]') {
    return notFound();
  }
  
  return <OrganizationClient slug={decoded} />;
}
