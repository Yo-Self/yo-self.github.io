"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface GooglePlacesAutocompleteRobustProps {
  value: string;
  onChange: (address: string) => void;
  onCoordinatesChange?: (coordinates: { latitude: number; longitude: number } | null, address?: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Variável global para controlar o carregamento da API
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

export default function GooglePlacesAutocompleteRobust({
  value,
  onChange,
  onCoordinatesChange,
  placeholder = "Digite seu endereço completo",
  className = "",
  disabled = false
}: GooglePlacesAutocompleteRobustProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGoogleMapsScript = useCallback(async (): Promise<void> => {
    if (typeof document === 'undefined') return;

    if (isGoogleMapsLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    if (typeof (window as any).google !== 'undefined' && 
        (window as any).google.maps && 
        (window as any).google.maps.places && 
        (window as any).google.maps.places.PlaceAutocompleteElement) {
      console.log('Google Maps Places já está carregado');
      setIsLoaded(true);
      return Promise.resolve();
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('API key não configurada');
      return Promise.resolve();
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (typeof (window as any).google !== 'undefined' && 
              (window as any).google.maps && 
              (window as any).google.maps.places && 
              (window as any).google.maps.places.PlaceAutocompleteElement) {
            clearInterval(checkInterval);
            console.log('Google Maps Places carregado via script existente');
            setIsLoaded(true);
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          setError('Timeout ao carregar Google Maps');
          resolve();
        }, 10000);
      });
    }

    isGoogleMapsLoading = true;
    setIsLoading(true);
    
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsLoading(false);
        setIsLoaded(true);
        isGoogleMapsLoading = false;
        resolve();
      };

      script.onerror = () => {
        console.error('Erro ao carregar Google Maps');
        setIsLoading(false);
        setError('Erro ao carregar Google Maps');
        isGoogleMapsLoading = false;
        reject(new Error('Failed to load Google Maps'));
      };

      document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
  }, []);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || isInitializedRef.current) {
      return;
    }

    if (typeof (window as any).google === 'undefined' || 
        !(window as any).google.maps || 
        !(window as any).google.maps.places || 
        !(window as any).google.maps.places.PlaceAutocompleteElement) {
      console.log('Google Maps Places ainda não está disponível, aguardando...');
      return;
    }

    try {
      if (autocompleteRef.current) {
        try {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          // Ignorar erro ao limpar listeners
        }
        autocompleteRef.current = null;
      }
      
      const autocompleteElement = new (window as any).google.maps.places.PlaceAutocompleteElement({
        inputElement: inputRef.current,
        componentRestrictions: { country: 'br' },
        types: ['address'],
      });

      autocompleteRef.current = autocompleteElement;

      const listener = autocompleteElement.addEventListener('gmp-placechange', (event: any) => {
        const place = event.detail.place;
        
        if (place.formattedAddress) {
          onChange(place.formattedAddress);
          
          if (place.location) {
            const coordinates = {
              latitude: place.location.latitude,
              longitude: place.location.longitude
            };
            onCoordinatesChange?.(coordinates, place.formattedAddress);
          } else {
            onCoordinatesChange?.(null);
          }
        }
      });

      (autocompleteElement as any).listener = listener;

      const style = document.createElement('style');
      style.id = 'google-places-attribution-hide';
      style.textContent = `
        .pac-container {
          z-index: 999999 !important;
        }
        .pac-container:after {
          display: none !important;
        }
        .pac-container .pac-item {
          padding: 8px 12px !important;
          border-bottom: 1px solid #e5e7eb !important;
          cursor: pointer !important;
        }
        .pac-container .pac-item:hover {
          background-color: #f3f4f6 !important;
        }
        .pac-container .pac-item-selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
        .pac-container .pac-item-selected:hover {
          background-color: #2563eb !important;
        }
      `;
      document.head.appendChild(style);

      isInitializedRef.current = true;
      
    } catch (err) {
      console.error('Erro ao inicializar Google Places Autocomplete:', err);
      setError('Erro ao carregar autocompletar de endereços');
    }
  }, [onChange, onCoordinatesChange]);

  useEffect(() => {
    loadGoogleMapsScript();
  }, [loadGoogleMapsScript]);

  useEffect(() => {
    if (isLoaded && !isInitializedRef.current) {
      const timer = setTimeout(() => {
        initializeAutocomplete();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, initializeAutocomplete]);

  useEffect(() => {
    return () => {
      if (autocompleteRef.current) {
        try {
          (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (e) {
          // Ignorar erro ao limpar
        }
        autocompleteRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && value !== undefined) {
      inputRef.current.value = value;
    }
  }, [value]);

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        disabled={disabled || isLoading}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`
          w-full px-4 py-3 
          border border-gray-300 dark:border-gray-600 
          rounded-lg 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 
          placeholder-gray-500 dark:placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors duration-200
          ${className}
        `}
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}
