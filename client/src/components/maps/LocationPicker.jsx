import React, { useCallback, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "@/utils/fixLeafletIcon";

const DEFAULT_CENTER = [20.5937, 78.9629];
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data?.display_name || "";
  } catch {
    return "";
  }
}

async function searchAddress(query) {
  if (!query?.trim()) return null;
  try {
    const res = await fetch(
      `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const first = data?.[0];
    if (!first) return null;
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      address: first.display_name || "",
    };
  } catch {
    return null;
  }
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      reverseGeocode(lat, lng).then((addr) => {
        onSelect({ lat, lng, address: addr || `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      });
    },
  });
  return null;
}

/**
 * Reusable map picker using Leaflet + OpenStreetMap.
 * Click on map to place marker, or search by address.
 * Calls onSelect({ lat, lng, address }) when a location is chosen.
 */
export default function LocationPicker({ onSelect, initialCenter, initialAddress }) {
  const [marker, setMarker] = useState(() => {
    if (initialCenter?.lat != null && initialCenter?.lng != null) {
      return [initialCenter.lat, initialCenter.lng];
    }
    return null;
  });
  const [searchQuery, setSearchQuery] = useState(initialAddress || "");
  const [searching, setSearching] = useState(false);
  const center = marker || DEFAULT_CENTER;

  const handleMapSelect = useCallback(
    ({ lat, lng, address }) => {
      setMarker([lat, lng]);
      onSelect?.({ lat, lng, address });
    },
    [onSelect]
  );

  const handleSearch = useCallback(async () => {
    setSearching(true);
    const result = await searchAddress(searchQuery);
    setSearching(false);
    if (result) {
      setMarker([result.lat, result.lng]);
      onSelect?.({ lat: result.lat, lng: result.lng, address: result.address });
    }
  }, [searchQuery, onSelect]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search location or click on map"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>
      <MapContainer
        center={center}
        zoom={marker ? 15 : 5}
        scrollWheelZoom={true}
        className="h-[320px] w-full rounded-lg border border-gray-200 z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={handleMapSelect} />
        {marker && <Marker position={marker} />}
      </MapContainer>
    </div>
  );
}
