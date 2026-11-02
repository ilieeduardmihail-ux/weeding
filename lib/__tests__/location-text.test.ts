import { describe, expect, it } from "vitest";
import { cleanLocation, cleanLocationText, locationLabel } from "../location-text";

describe("location text", () => {
  it("repairs mojibake from the first seed", () => {
    expect(cleanLocationText("BisericÄƒ SfÃ¢ntul Nicolae")).toBe("Biserică Sfântul Nicolae");
    expect(cleanLocationText("È˜oseaua È˜tefan")).toBe("Șoseaua Ștefan");
  });

  it("translates old English labels", () => {
    expect(locationLabel("church", "Church ceremony")).toBe("Biserică");
    expect(locationLabel("venue", "Venue")).toBe("Local");
  });

  it("keeps custom labels and repairs the rest of the location", () => {
    const cleaned = cleanLocation({
      key: "church",
      label: "Catedrala",
      name: "Biserica SfÃ¢ntul Nicolae",
      address: "Strada È˜tefan 1",
      event_time: "16:00",
      embed_url: null,
    });
    expect(cleaned).toEqual({
      key: "church",
      label: "Catedrala",
      name: "Biserica Sfântul Nicolae",
      address: "Strada Ștefan 1",
      event_time: "16:00",
      embed_url: null,
    });
  });
});
