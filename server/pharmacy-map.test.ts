import { describe, expect, it } from "vitest";
import { filterPharmacies } from "../client/src/components/PharmacyMap";

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
});
