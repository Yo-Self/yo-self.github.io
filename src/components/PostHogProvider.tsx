"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog if the key is provided
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        
        // Exception Autocapture - automatically capture unhandled errors
        capture_exceptions: true,
        
        // Page tracking
        capture_pageview: false, // Disable automatic pageview capture as we'll do this manually
        capture_pageleave: true, // Track when users leave pages
        
        // Debug mode in development
        debug: process.env.NODE_ENV === "development",
        
        // Session recording
        disable_session_recording: false,
        
        // Privacy settings
        respect_dnt: false,
        
        // Performance monitoring
        capture_performance: true,
        
        // Autocapture settings
        autocapture: true,
        
        // Configurações para evitar bloqueio de ad blockers
        // Disable loading external scripts that might be blocked
        advanced_disable_decide: false, // Keep feature flags enabled
        
        // Configurações de persistência
        persistence: "localStorage+cookie",
        
        // Carregar scripts de forma assíncrona
        opt_in_site_apps: true,
        
        // Evitar carregar recursos externos que podem ser bloqueados
        disable_external_dependency_loading: false,
        
        // Configurar callbacks para lidar com erros de rede silenciosamente
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development") {
            console.log("PostHog loaded successfully")
          }
        },
        
        // Configurar retry com backoff exponencial
        xhr_headers: {},
        
        // Sanitize properties to avoid leaking sensitive data (usando before_send)
        before_send: (event) => {
          // Remove sensitive data if needed
          // You can modify event.properties here
          return event
        },
      })
      
      // Suprimir erros de rede do PostHog no console
      const originalError = console.error
      console.error = (...args) => {
        // Filtrar erros do PostHog relacionados a bloqueio
        const errorString = args.join(' ')
        if (
          errorString.includes('posthog') && 
          (errorString.includes('ERR_BLOCKED_BY_CLIENT') || 
           errorString.includes('net::ERR_'))
        ) {
          // Silenciar erro de bloqueio do PostHog
          if (process.env.NODE_ENV === "development") {
            console.warn("PostHog request blocked by ad blocker - analytics may be limited")
          }
          return
        }
        originalError.apply(console, args)
      }
    } else {
      console.warn("PostHog key not provided, analytics disabled")
    }
  }, [])

  // If PostHog key is not provided, just return children without PostHog provider
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}