"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  IconCrosshair,
  IconLoader2,
  IconMapPin,
  IconX,
} from "@tabler/icons-react";
import { Input } from "@/components/ui/input";

interface LocationPickerProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
}

// Minimalist, calm Google Maps styling matching Reserv's muted aesthetic
const MINIMAL_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f7" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f7" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "on" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#efefef" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e6e6e6" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#e3e8ee" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

declare global {
  interface Window {
    google?: typeof google;
    __googleMapsLoaded?: boolean;
    __googleMapsCallback?: () => void;
  }
}

// Global script loader for Google Maps JS API
function loadGoogleMapsScript(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.google?.maps) return Promise.resolve(window.google);

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-api-script");
    if (existingScript) {
      if (window.google?.maps) {
        resolve(window.google);
        return;
      }
      existingScript.addEventListener("error", () => reject(new Error("Map could not load")), {once:true});
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google);
        else reject(new Error("Google Maps failed to initialize"));
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-api-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google);
      } else {
        reject(new Error("Google Maps loaded without window.google"));
      }
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export function LocationPicker({
  value,
  onChange,
  placeholder = "Enter your business address",
  className = "",
}: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const query = value;
  const [mapsError,setMapsError]=useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // Load Google Maps SDK
  useEffect(() => {
    if (!apiKey) return;
    let isMounted = true;

    loadGoogleMapsScript(apiKey)
      .then((g) => {
        if (!isMounted) return;
        setMapsReady(true);
        geocoderRef.current = new g.maps.Geocoder();
        autocompleteServiceRef.current = new g.maps.places.AutocompleteService();
      })
      .catch((err) => {
        console.warn("[LocationPicker] Could not load Google Maps SDK:", err);
        if(isMounted)setMapsError("Map search is unavailable. You can type your full address above.");
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Reverse geocode a LatLng coordinate and update value
  const reverseGeocode = useCallback(
    (latLng: google.maps.LatLng) => {
      if (!geocoderRef.current) return;
      geocoderRef.current.geocode({ location: latLng }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const formatted = results[0].formatted_address;

          onChange(formatted);
        }
      });
    },
    [onChange]
  );

  // Initialize interactive map when container is available and SDK ready
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      // Default center: Abuja (or geocode current value)
      const defaultCenter = { lat: 9.0765, lng: 7.3986 };

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        styles: MINIMAL_MAP_STYLE,
        gestureHandling: "cooperative",
      });

      mapInstanceRef.current = map;
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map,
        draggable: true,
        title: "Drag to set exact location",
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#23395d",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      markerRef.current = marker;

      // On marker drag end, update address
      marker.addListener("dragend", () => {
        const pos = marker.getPosition();
        if (pos) {
          reverseGeocode(pos);
        }
      });

      // On map click, move marker and update address
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          marker.setPosition(e.latLng);
          reverseGeocode(e.latLng);
        }
      });
    }

    // If we have an existing address value, center map on it
    if (value && geocoderRef.current) {
      geocoderRef.current.geocode({ address: value }, (results, status) => {
        if (status === "OK" && results && results[0] && mapInstanceRef.current && markerRef.current) {
          const loc = results[0].geometry.location;
          mapInstanceRef.current.setCenter(loc);
          mapInstanceRef.current.setZoom(15);
          markerRef.current.setPosition(loc);
        }
      });
    }
  }, [mapsReady, value, reverseGeocode]);

  // Autocomplete search on user typing
  const handleQueryChange = (text: string) => {

    onChange(text);

    if (!text.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      setDropdownOpen(false);
      return;
    }

    setIsSearching(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: text,
      },
      (res, status) => {
        setIsSearching(false);
        if (status === window.google?.maps.places.PlacesServiceStatus.OK && res) {
          setPredictions(res);
          setDropdownOpen(true);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  // Select place from autocomplete dropdown
  const handleSelectPrediction = (p: google.maps.places.AutocompletePrediction) => {
    const desc = p.description;

    onChange(desc);
    setDropdownOpen(false);
    setPredictions([]);

    // Geocode chosen place to move map
    if (geocoderRef.current && mapInstanceRef.current && markerRef.current) {
      geocoderRef.current.geocode({ placeId: p.place_id }, (results, status) => {
        if (status === "OK" && results && results[0] && mapInstanceRef.current && markerRef.current) {
          const loc = results[0].geometry.location;
          mapInstanceRef.current.setCenter(loc);
          mapInstanceRef.current.setZoom(16);
          markerRef.current.setPosition(loc);
        }
      });
    }
  };

  // Use device GPS location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        if (!window.google?.maps) return;
        const latLng = new window.google.maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude
        );
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter(latLng);
          mapInstanceRef.current.setZoom(16);
          markerRef.current.setPosition(latLng);
        }
        reverseGeocode(latLng);
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Autocomplete Input Container */}
      <div className="relative">
        <div className="relative flex items-center">
          <Input
            type="text"
            required
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => {
              if (predictions.length > 0) setDropdownOpen(true);
            }}
            placeholder={placeholder}
            className="min-h-10 w-full rounded-xl border-0 bg-muted pl-3.5 pr-20 text-[13px] text-foreground placeholder:text-muted-foreground shadow-none outline-none focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary transition"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {isSearching ? (
              <IconLoader2 size={16} className="animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                type="button"
                onClick={() => {

                  onChange("");
                  setPredictions([]);
                  setDropdownOpen(false);
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
                aria-label="Clear location input"
              >
                <IconX size={13} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              title="Pin my current location"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-muted-foreground hover:bg-white hover:text-primary transition shadow-none"
            >
              {isLocating ? (
                <IconLoader2 size={14} className="animate-spin text-primary" />
              ) : (
                <IconCrosshair size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Places Autocomplete Suggestions Dropdown */}
        {dropdownOpen && predictions.length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border-0 bg-white p-1.5 shadow-none ring-1 ring-black/5">
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => handleSelectPrediction(p)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] text-foreground transition hover:bg-muted"
                >
                  <IconMapPin size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{p.description}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {mapsError && <p role="status" className="text-xs text-muted-foreground">{mapsError}</p>}
      {/* Interactive Google Map Pin Picker */}
      <div className="relative h-48 w-full overflow-hidden rounded-2xl border-0 bg-muted">
        <div ref={mapContainerRef} className="h-full w-full" />
        <div className="pointer-events-none absolute bottom-2.5 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-foreground backdrop-blur-xs">
          Click or drag pin to fine-tune location
        </div>
      </div>
    </div>
  );
}
