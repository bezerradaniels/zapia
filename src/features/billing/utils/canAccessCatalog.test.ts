import { describe, it, expect } from "vitest";
import { canAccessCatalog } from "./canAccessCatalog";

describe("canAccessCatalog", () => {
  it("returns false for null or undefined status", () => {
    expect(canAccessCatalog(null)).toBe(false);
    expect(canAccessCatalog(undefined)).toBe(false);
  });

  it("returns true for active subscription", () => {
    expect(
      canAccessCatalog({
        status: "active",
        trial_ends_at: null,
      }),
    ).toBe(true);
  });

  it("returns true for past_due subscription (grace period allowed)", () => {
    expect(
      canAccessCatalog({
        status: "past_due",
        trial_ends_at: null,
      }),
    ).toBe(true);
  });

  it("returns true for trialing store with future trial_ends_at", () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      canAccessCatalog({
        status: "trialing",
        trial_ends_at: future,
      }),
    ).toBe(true);
  });

  it("returns true for trialing store with null trial_ends_at (open trial)", () => {
    expect(
      canAccessCatalog({
        status: "trialing",
        trial_ends_at: null,
      }),
    ).toBe(true);
  });

  it("returns false for trialing store with expired trial_ends_at", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    expect(
      canAccessCatalog({
        status: "trialing",
        trial_ends_at: past,
      }),
    ).toBe(false);
  });

  it("returns false for unpaid, canceled, or paused subscriptions", () => {
    expect(canAccessCatalog({ status: "unpaid", trial_ends_at: null })).toBe(false);
    expect(canAccessCatalog({ status: "canceled", trial_ends_at: null })).toBe(false);
    expect(canAccessCatalog({ status: "paused", trial_ends_at: null })).toBe(false);
    expect(canAccessCatalog({ status: "incomplete", trial_ends_at: null })).toBe(false);
  });
});
