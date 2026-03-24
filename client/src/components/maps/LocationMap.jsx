import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "@/utils/fixLeafletIcon";

export default function LocationMap({ lat, lng, label = "Pickup Location" }) {
  if (!lat || !lng) {
    return (
      <div className="h-60 flex items-center justify-center text-gray-400 border rounded-lg">
        Location not available
      </div>
    );
  }

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-60 w-full rounded-xl z-0"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
