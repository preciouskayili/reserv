"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
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
    __reservMapsReady?: () => void;
  }
}

// Share script loading across pickers, including Strict Mode remounts.
let mapsLoading: Promise<typeof google> | null = null;
function loadGoogleMapsScript(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject(new Error("Maps require a browser"));
  if (window.google && typeof window.google.maps?.importLibrary === "function") return Promise.resolve(window.google);
  if (mapsLoading) return mapsLoading;
  mapsLoading = new Promise<typeof google>((resolve, reject) => {
    const existing = document.getElementById("google-maps-api-script");
    const script = existing ?? document.createElement("script");
    const cleanup = () => {
      clearTimeout(timeout);
      script.removeEventListener("load", loaded);
      script.removeEventListener("error", failed);
      delete window.__reservMapsReady;
    };
    const loaded = () => {
      if (!window.google || typeof window.google.maps?.importLibrary !== "function") return;
      cleanup(); resolve(window.google);
    };
    const failed = () => {
      cleanup();
      if (!existing) script.remove();
      reject(new Error("Google Maps could not load"));
    };
    const timeout = setTimeout(failed, 15000);
    if (existing) script.addEventListener("load", loaded);
    script.addEventListener("error", failed);
    if (!existing) {
      window.__reservMapsReady = loaded;
      const tag = script as HTMLScriptElement;
      tag.id = "google-maps-api-script";
      tag.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&v=weekly&callback=__reservMapsReady`;
      tag.async = true;
      document.head.appendChild(tag);
    }
  }).catch(error => { mapsLoading = null; throw error; });
  return mapsLoading;
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
  const [predictions, setPredictions] = useState<google.maps.places.PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapsReady, setMapsReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placesLibraryRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestVersion = useRef(0);
  const mounted = useRef(false);
  const onChangeRef = useRef(onChange);
  const initialAddress = useRef(value);
  const suggestionsId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Import the new Places library once; never construct legacy Places services.
  useEffect(() => {
    mounted.current = true;
    let alive = true;
    if (apiKey) {
      void loadGoogleMapsScript(apiKey).then(async (g) => {
        const places = await g.maps.importLibrary("places") as google.maps.PlacesLibrary;
        if (!alive) return;
        placesLibraryRef.current = places;
        geocoderRef.current = new g.maps.Geocoder();
        setMapsReady(true);
      }).catch(() => {
        if (alive) setMapsError("Map search is unavailable. You can type your full address above.");
      });
    }
    return () => {
      alive = false;
      mounted.current = false;
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [apiKey]);

  const movePin = useCallback((location: google.maps.LatLng) => {
    mapInstanceRef.current?.setCenter(location);
    mapInstanceRef.current?.setZoom(16);
    markerRef.current?.setPosition(location);
  }, []);

  const reverseGeocode = useCallback(async (location: google.maps.LatLng) => {
    const version = ++requestVersion.current;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setIsSearching(false);
    setPredictions([]);
    setDropdownOpen(false);
    sessionRef.current = null;
    try {
      const response = await geocoderRef.current?.geocode({ location });
      if (!mounted.current || version !== requestVersion.current) return;
      const address = response?.results[0]?.formatted_address;
      if (!address) throw new Error("No address found");
      onChangeRef.current(address);
      setMapsError("");
    } catch {
      if (mounted.current && version === requestVersion.current) setMapsError("Couldn’t find an address for this pin. You can enter it manually.");
    }
  }, []);

  // The map and its listeners are independent of the address being typed.
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || !window.google?.maps) return;
    const g = window.google;
    const defaultCenter = { lat: 9.0765, lng: 7.3986 };
    const map = new g.maps.Map(mapContainerRef.current, {
      center: defaultCenter, zoom: 14, disableDefaultUI: true, zoomControl: true,
      styles: MINIMAL_MAP_STYLE, gestureHandling: "cooperative",
    });
    mapInstanceRef.current = map;
    const marker = new g.maps.Marker({
      position: defaultCenter, map, draggable: true, title: "Drag to set exact location",
      icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#23395d", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
    });
    markerRef.current = marker;
    const dragListener = marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (position) void reverseGeocode(position);
    });
    const clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
      if (event.latLng) { marker.setPosition(event.latLng); void reverseGeocode(event.latLng); }
    });
    let alive = true;
    const version = requestVersion.current;
    if (initialAddress.current && version === 0) {
      void geocoderRef.current?.geocode({ address: initialAddress.current }).then(({ results }) => {
        if (alive && version === requestVersion.current && results[0]) movePin(results[0].geometry.location);
      }).catch(() => { /* A saved address remains editable if geocoding fails. */ });
    }
    return () => {
      alive = false;
      dragListener.remove(); clickListener.remove(); marker.setMap(null);
      markerRef.current = null; mapInstanceRef.current = null;
    };
  }, [mapsReady, movePin, reverseGeocode]);

  const closeSuggestions = () => {
    requestVersion.current++;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setIsSearching(false); setDropdownOpen(false); setActiveIndex(-1);
  };

  const handleQueryChange = (text: string) => {
    const version = ++requestVersion.current;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    onChange(text);
    setIsLocating(false); setMapsError(""); setPredictions([]); setActiveIndex(-1);
    setDropdownOpen(false);
    const places = placesLibraryRef.current;
    if (text.trim().length < 2 || !places) {
      setIsSearching(false);
      if (!text.trim()) sessionRef.current = null;
      return;
    }
    setIsSearching(true);
    sessionRef.current ??= new places.AutocompleteSessionToken();
    const sessionToken = sessionRef.current;
    searchTimer.current = setTimeout(async () => {
      try {
        const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: text, sessionToken });
        if (!mounted.current || version !== requestVersion.current) return;
        const placesFound = suggestions.flatMap(suggestion => suggestion.placePrediction ? [suggestion.placePrediction] : []);
        setPredictions(placesFound); setDropdownOpen(placesFound.length > 0);
      } catch {
        if (mounted.current && version === requestVersion.current) setMapsError("Address suggestions are unavailable. You can still type your full address.");
      } finally {
        if (mounted.current && version === requestVersion.current) setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectPrediction = async (prediction: google.maps.places.PlacePrediction) => {
    closeSuggestions();
    const version = requestVersion.current;
    onChange(prediction.text.toString());
    setPredictions([]); setMapsError(""); setIsSearching(true);
    // toPlace preserves the search session token for its first fetchFields call.
    const place = prediction.toPlace();
    sessionRef.current = null;
    try {
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      if (!mounted.current || version !== requestVersion.current) return;
      if (place.formattedAddress) onChangeRef.current(place.formattedAddress);
      if (place.location) movePin(place.location);
    } catch {
      if (mounted.current && version === requestVersion.current) setMapsError("The address is selected, but its pin couldn’t load. You can adjust the map manually.");
    } finally {
      if (mounted.current && version === requestVersion.current) setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setMapsError("Location access is unavailable. Enter your address manually."); return; }
    closeSuggestions();
    const version = requestVersion.current;
    setIsLocating(true); setMapsError("");
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mounted.current || version !== requestVersion.current || !window.google?.maps) return;
      setIsLocating(false);
      const location = new window.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      movePin(location); void reverseGeocode(location);
    }, () => {
      if (!mounted.current || version !== requestVersion.current) return;
      setIsLocating(false); setMapsError("Couldn’t access your location. Search for your address or place the pin manually.");
    }, { timeout: 10000, enableHighAccuracy: true });
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Autocomplete Input Container */}
      <div className="relative">
        <div className="relative flex items-center">
          <Input
            type="text"
            role="combobox"
            aria-label="Business address"
            aria-autocomplete="list"
            aria-expanded={dropdownOpen && predictions.length > 0}
            aria-controls={dropdownOpen ? suggestionsId : undefined}
            aria-activedescendant={dropdownOpen && activeIndex >= 0 ? `${suggestionsId}-${activeIndex}` : undefined}
            onBlur={closeSuggestions}
            onKeyDown={(event) => {
              if (event.key === "Escape") { event.preventDefault(); closeSuggestions(); }
              if (!dropdownOpen || !predictions.length) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex(index => (index + (event.key === "ArrowDown" ? 1 : -1) + predictions.length) % predictions.length);
              }
              if (event.key === "Enter" && activeIndex >= 0) { event.preventDefault(); void handleSelectPrediction(predictions[activeIndex]); }
            }}
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
                onClick={() => handleQueryChange("")}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
                aria-label="Clear location input"
              >
                <IconX size={13} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating || !mapsReady}
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
            <div id={suggestionsId} role="listbox" aria-label="Address suggestions" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-2xl border-0 bg-white p-1.5 shadow-none ring-1 ring-black/5">
              {predictions.map((p, index) => (
                <button
                  key={p.placeId}
                  id={`${suggestionsId}-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  tabIndex={-1}
                  onPointerDown={event => event.preventDefault()}
                  type="button"
                  onClick={() => void handleSelectPrediction(p)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] text-foreground transition hover:bg-muted aria-selected:bg-muted"
                >
                  <IconMapPin size={15} className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{p.text.toString()}</span>
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
          {mapsReady ? "Click or drag pin to fine-tune location" : apiKey && !mapsError ? "Loading map…" : "Enter your address above"}
        </div>
      </div>
    </div>
  );
}
