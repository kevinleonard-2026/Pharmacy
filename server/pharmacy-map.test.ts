import { describe, expect, it } from "vitest";
import { filterPharmacies, formatRouteSummary, getLocationStateMessage, shouldQueueFavoriteRemoval, toggleFavoriteId } from "../client/src/components/PharmacyMap";

describe("pharmacy map search", () => {
  const pharmacies = [
    { id: "one", name: "Northstar Pharmacy", address: "14 Mercer Street", open: "Open", distance: "0.4 km", position: { lat: 1, lng: 1 } },
    { id: "two", name: "Harbor Health", address: "62 Hudson Avenue", open: "Open", distance: "0.8 km", position: { lat: 2, lng: 2 } },
  ];

  it("returns all locations for an empty query", () => {
    expect(filterPharmacies(pharmacies, "")).toHaveLength(2);
  });

  it("matches names and addresses case-insensitively", () => {
    expect(filterPharmacies(pharmacies, "northstar").map((place) => place.id)).toEqual(["one"]);
    expect(filterPharmacies(pharmacies, "HUDSON").map((place) => place.id)).toEqual(["two"]);
  });

  it("adds and removes favorites deterministically", () => {
    expect(toggleFavoriteId([], "one")).toEqual(["one"]);
    expect(toggleFavoriteId(["one", "two"], "one")).toEqual(["two"]);
  });

  it("queues a removal when a saved favorite has no server ID yet", () => {
    expect(shouldQueueFavoriteRemoval(true, undefined)).toBe(true);
    expect(shouldQueueFavoriteRemoval(true, 12)).toBe(false);
    expect(shouldQueueFavoriteRemoval(false, undefined)).toBe(false);
  });

  it("keeps location messaging privacy-safe across idle, live, and denied states", () => {
    expect(getLocationStateMessage("idle")).toBe("location private");
    expect(getLocationStateMessage("live")).toBe("updating live");
    expect(getLocationStateMessage("denied")).toBe("location permission needed");
  });

  it("formats route distance and travel time for the selected pharmacy", () => {
    expect(formatRouteSummary({ distance: { text: "1.4 km" }, duration: { text: "6 mins" } })).toEqual({ distance: "1.4 km", duration: "6 mins" });
    expect(formatRouteSummary({})).toEqual({ distance: "—", duration: "—" });
  });
});
