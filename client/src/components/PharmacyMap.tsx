import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Crosshair, Flag, Heart, MapPin, Navigation, Search, Store, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type Pharmacy = { id: string; name: string; address: string; open: string; distance?: string; position: google.maps.LatLngLiteral };
export const filterPharmacies = (pharmacies: Pharmacy[], query: string) => pharmacies.filter((place) => !query || `${place.name} ${place.address}`.toLowerCase().includes(query.toLowerCase()));
export const toggleFavoriteId = (ids: string[], id: string) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
export const formatRouteSummary = (leg: { distance?: { text?: string } | null; duration?: { text?: string } | null }) => ({ distance: leg.distance?.text || "—", duration: leg.duration?.text || "—" });
export const getLocationStateMessage = (state: "idle" | "live" | "denied") => state === "live" ? "updating live" : state === "denied" ? "location permission needed" : "location private";
export const shouldQueueFavoriteRemoval = (isSaved: boolean, savedRecordId?: number) => isSaved && !savedRecordId;

export default function PharmacyMap() {
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const watchRef = useRef<number | null>(null);
  const [query, setQuery] = useState("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selected, setSelected] = useState<Pharmacy | null>(null);
  const [livePosition, setLivePosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [locationState, setLocationState] = useState<"idle" | "live" | "denied">("idle");
  const [route, setRoute] = useState<{ distance: string; duration: string } | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("medgrid-favorites") || "[]"); } catch { return []; } });
  const [favoriteRecordIds, setFavoriteRecordIds] = useState<Record<string, number>>({});
  const pendingFavoriteRemovals = useRef(new Set<string>());
  const favoriteQuery = trpc.favorites.list.useQuery(undefined, { retry: false });
  const saveFavorite = trpc.favorites.save.useMutation();
  const removeFavorite = trpc.favorites.remove.useMutation();
  const favoriteUtils = trpc.useUtils();

  const visible = useMemo(() => filterPharmacies(pharmacies, query), [pharmacies, query]);
  const favoritePlaces = useMemo(() => pharmacies.filter((place) => favorites.includes(place.id)), [pharmacies, favorites]);

  useEffect(() => () => { if (watchRef.current !== null) navigator.geolocation?.clearWatch(watchRef.current); markersRef.current.forEach((marker) => { marker.map = null; }); userMarkerRef.current && (userMarkerRef.current.map = null); }, []);
  useEffect(() => { localStorage.setItem("medgrid-favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { if (favoriteQuery.data) { setFavorites(favoriteQuery.data.map((favorite) => favorite.externalId)); setFavoriteRecordIds(Object.fromEntries(favoriteQuery.data.map((favorite) => [favorite.externalId, favorite.id]))); } }, [favoriteQuery.data]);

  const renderMarkers = (map: google.maps.Map, places: Pharmacy[]) => {
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current = places.map((place) => { const marker = new google.maps.marker.AdvancedMarkerElement({ map, position: place.position, title: place.name }); marker.addListener("click", () => focusPharmacy(place)); return marker; });
  };

  const loadNearby = async (position: google.maps.LatLngLiteral) => {
    if (!window.google?.maps?.places?.Place) return;
    try {
      const result = await (google.maps.places.Place as any).searchNearby({ fields: ["displayName", "location", "formattedAddress", "id"], locationRestriction: { center: position, radius: 5000 }, includedPrimaryTypes: ["pharmacy"], maxResultCount: 10 });
      const places: Pharmacy[] = (result.places || []).map((place: any, index: number) => ({ id: place.id || `nearby-${index}`, name: place.displayName || "Local pharmacy", address: place.formattedAddress || "Nearby location", open: "Nearby", position: { lat: place.location.lat(), lng: place.location.lng() } }));
      setPharmacies(places);
      if (mapRef.current) renderMarkers(mapRef.current, places);
    } catch { setPharmacies([]); }
  };

  const locateMe = () => {
    if (!navigator.geolocation) { setLocationState("denied"); return; }
    setLocationState("idle");
    watchRef.current = navigator.geolocation.watchPosition((position) => { const next = { lat: position.coords.latitude, lng: position.coords.longitude }; setLivePosition(next); setLocationState("live"); mapRef.current?.panTo(next); if (mapRef.current && !userMarkerRef.current) userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({ map: mapRef.current, position: next, title: "Your current location" }); else if (userMarkerRef.current) userMarkerRef.current.position = next; if (!pharmacies.length) void loadNearby(next); }, () => setLocationState("denied"), { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 });
  };

  const focusPharmacy = (pharmacy: Pharmacy) => { setSelected(pharmacy); setRoute(null); mapRef.current?.panTo(pharmacy.position); mapRef.current?.setZoom(15); if (livePosition) getDirections(livePosition, pharmacy.position); };
  const getDirections = (origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral) => { if (!mapRef.current) return; const service = new google.maps.DirectionsService(); directionsRendererRef.current?.setMap(null); directionsRendererRef.current = new google.maps.DirectionsRenderer({ map: mapRef.current, suppressMarkers: true, polylineOptions: { strokeColor: "#12a1a4", strokeOpacity: .9, strokeWeight: 4 } }); service.route({ origin, destination, travelMode: google.maps.TravelMode.DRIVING, provideRouteAlternatives: false }, (response, status) => { if (status === "OK" && response?.routes[0]?.legs[0]) { const leg = response.routes[0].legs[0]; setRoute(formatRouteSummary(leg)); directionsRendererRef.current?.setDirections(response); } else setRoute(null); }); };
  const toggleFavorite = (pharmacy: Pharmacy) => { const isSaved = favorites.includes(pharmacy.id); setFavorites((items) => toggleFavoriteId(items, pharmacy.id)); const savedRecordId = favoriteRecordIds[pharmacy.id]; if (isSaved) { if (savedRecordId) removeFavorite.mutate({ id: savedRecordId }, { onSuccess: () => { setFavoriteRecordIds((items) => { const next = { ...items }; delete next[pharmacy.id]; return next; }); favoriteUtils.favorites.list.invalidate(); } }); else pendingFavoriteRemovals.current.add(pharmacy.id); } else saveFavorite.mutate({ externalId: pharmacy.id, name: pharmacy.name, address: pharmacy.address, latitude: pharmacy.position.lat, longitude: pharmacy.position.lng }, { onSuccess: (saved) => { if (pendingFavoriteRemovals.current.has(pharmacy.id)) { pendingFavoriteRemovals.current.delete(pharmacy.id); removeFavorite.mutate({ id: saved.id }, { onSuccess: () => favoriteUtils.favorites.list.invalidate() }); } else { setFavoriteRecordIds((items) => ({ ...items, [pharmacy.id]: saved.id })); favoriteUtils.favorites.list.invalidate(); } } }); };
  const setupMap = (map: google.maps.Map) => { mapRef.current = map; if (livePosition) { map.panTo(livePosition); } if (pharmacies.length) renderMarkers(map, pharmacies); };

  return <div className="pharmacy-map-widget">
    <div className="map-toolbar"><div className="map-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={locationState === "live" ? "Search nearby pharmacies" : "Enable location to search"} aria-label="Search nearby pharmacies" disabled={!locationState || locationState === "denied"} /></div><button onClick={locateMe} className={`map-locate ${locationState === "live" ? "is-live" : ""}`} aria-label="Use current location"><Crosshair size={15} /><span>{locationState === "live" ? "Live location" : "Locate me"}</span></button></div>
    <div className="map-canvas"><MapView className="pharmacy-map" initialCenter={{ lat: 20, lng: 0 }} initialZoom={2} onMapReady={setupMap} /></div>
    <div className="map-legend"><span><i className="legend-dot pharmacy-dot" /> nearby pharmacy</span><span><i className="legend-dot user-dot" /> your position</span><span className="map-live-label"><span /> {getLocationStateMessage(locationState)}</span></div>
    {locationState === "denied" && <div className="map-empty"><MapPin size={16} /> Allow location access to list pharmacies near you. No foreign-city locations are shown.</div>}
    {locationState !== "live" && locationState !== "denied" && <div className="map-empty"><Crosshair size={16} /> Tap “Locate me” to load pharmacies near your current location.</div>}
    {locationState === "live" && <><div className="nearby-heading"><span className="eyebrow">NEARBY / {visible.length} LOCATIONS</span><span>{favoritePlaces.length} saved</span></div>{favoritePlaces.length > 0 && <div className="favorite-strip"><span className="eyebrow"><Heart size={11} /> FAVORITES</span>{favoritePlaces.map((place) => <button key={place.id} onClick={() => focusPharmacy(place)}>{place.name}</button>)}</div>}<div className="map-results">{visible.map((pharmacy) => <button className={`pharmacy-result ${selected?.id === pharmacy.id ? "selected" : ""}`} key={pharmacy.id} onClick={() => focusPharmacy(pharmacy)}><span className="result-icon"><Store size={14} /></span><span><strong>{pharmacy.name}</strong><small>{pharmacy.address}</small></span><span className="favorite-control" onClick={(event) => { event.stopPropagation(); toggleFavorite(pharmacy); }} aria-label={favorites.includes(pharmacy.id) ? "Remove favorite" : "Save favorite"}><Heart size={14} fill={favorites.includes(pharmacy.id) ? "currentColor" : "none"} /></span></button>)}{visible.length === 0 && <div className="map-empty">No pharmacies found in this nearby area.</div>}</div></>}
    {selected && <div className="selected-pharmacy"><div className="selected-pharmacy-heading"><div><span className="eyebrow">SELECTED LOCATION</span><strong>{selected.name}</strong><small>{selected.address}</small></div><button onClick={() => setSelected(null)} aria-label="Close selected pharmacy"><X size={15} /></button></div>{route && <div className="route-summary"><span><Navigation size={13} /> {route.duration}</span><span><Flag size={13} /> {route.distance}</span><small>Driving route from your location</small></div>}<div className="selected-actions"><button className="directions-button" onClick={() => livePosition && getDirections(livePosition, selected.position)}><Navigation size={14} /> {route ? "Refresh route" : "Get directions"}</button><button className="favorite-button" onClick={() => toggleFavorite(selected)}><Heart size={14} fill={favorites.includes(selected.id) ? "currentColor" : "none"} /> {favorites.includes(selected.id) ? "Saved" : "Save"}</button></div></div>}
  </div>;
}
