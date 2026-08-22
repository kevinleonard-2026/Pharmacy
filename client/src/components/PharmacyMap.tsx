import { MapView } from "@/components/Map";
import { Crosshair, MapPin, Navigation, Search, Store, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Pharmacy = { id: string; name: string; address: string; open: string; distance: string; position: google.maps.LatLngLiteral };

export const filterPharmacies = (pharmacies: Pharmacy[], query: string) => pharmacies.filter((place) => !query || `${place.name} ${place.address}`.toLowerCase().includes(query.toLowerCase()));

const nearbyPharmacies: Pharmacy[] = [
  { id: "northstar", name: "Northstar Pharmacy", address: "14 Mercer Street", open: "Open until 20:00", distance: "0.4 km", position: { lat: 40.7242, lng: -74.0016 } },
  { id: "harbor", name: "Harbor Health", address: "62 Hudson Avenue", open: "Open until 22:00", distance: "0.8 km", position: { lat: 40.7184, lng: -74.0096 } },
  { id: "greenline", name: "Greenline Chemist", address: "88 Canal Street", open: "Open until 19:30", distance: "1.2 km", position: { lat: 40.7168, lng: -73.9991 } },
];

export default function PharmacyMap() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const watchRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [livePosition, setLivePosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "live" | "denied">("idle");

  const visible = useMemo(() => filterPharmacies(nearbyPharmacies, query), [query]);

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current); markersRef.current.forEach((marker) => { marker.map = null; }); }, []);

  const focusPharmacy = (pharmacy: Pharmacy) => { setSelected(pharmacy); mapRef.current?.panTo(pharmacy.position); mapRef.current?.setZoom(15); };
  const locateMe = () => {
    if (!navigator.geolocation) { setLocationState("denied"); return; }
    setLocationState("idle");
    watchRef.current = navigator.geolocation.watchPosition((position) => { const next = { lat: position.coords.latitude, lng: position.coords.longitude }; setLivePosition(next); setLocationState("live"); mapRef.current?.panTo(next); }, () => setLocationState("denied"), { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
  };

  const setupMarkers = (map: google.maps.Map) => {
    mapRef.current = map;
    markersRef.current = visible.map((pharmacy) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: pharmacy.position, title: pharmacy.name });
      marker.addListener("click", () => focusPharmacy(pharmacy));
      return marker;
    });
  };

  useEffect(() => { if (!mapRef.current) return; markersRef.current.forEach((marker) => { marker.map = null; }); markersRef.current = visible.map((pharmacy) => { const marker = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current!, position: pharmacy.position, title: pharmacy.name }); marker.addListener("click", () => focusPharmacy(pharmacy)); return marker; }); }, [visible]);

  return <div className="pharmacy-map-widget">
    <div className="map-toolbar"><div className="map-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search nearby pharmacies" aria-label="Search nearby pharmacies" /></div><button onClick={locateMe} className={`map-locate ${locationState === "live" ? "is-live" : ""}`} aria-label="Use current location"><Crosshair size={15} /> <span>{locationState === "live" ? "Live location" : "Locate me"}</span></button></div>
    <div className="map-canvas"><MapView className="pharmacy-map" initialCenter={{ lat: 40.721, lng: -74.004 }} initialZoom={14} onMapReady={setupMarkers} />{livePosition && <div className="live-location-pulse" title="Your live location" />}</div>
    <div className="map-legend"><span><i className="legend-dot pharmacy-dot" /> pharmacy</span><span><i className="legend-dot user-dot" /> your position</span><span className="map-live-label"><span /> updating live</span></div>
    <div className="map-results">{visible.map((pharmacy) => <button className={`pharmacy-result ${selected?.id === pharmacy.id ? "selected" : ""}`} key={pharmacy.id} onClick={() => focusPharmacy(pharmacy)}><span className="result-icon"><Store size={14} /></span><span><strong>{pharmacy.name}</strong><small>{pharmacy.address} · {pharmacy.distance}</small></span><span className="result-open">{pharmacy.open}</span></button>)}{visible.length === 0 && <div className="map-empty">No nearby pharmacy matches this search.</div>}</div>
    {selected && <div className="selected-pharmacy"><div className="selected-pharmacy-heading"><div><span className="eyebrow">SELECTED LOCATION</span><strong>{selected.name}</strong><small>{selected.address} · {selected.open}</small></div><button onClick={() => setSelected(null)} aria-label="Close selected pharmacy"><X size={15} /></button></div><button className="directions-button" onClick={() => mapRef.current?.panTo(selected.position)}><Navigation size={14} /> Center map</button></div>}
  </div>;
}
