import { describe, it, expect, beforeEach } from "vitest";
import { useStarredGrants } from "./use-starred-grants";

describe("useStarredGrants", () => {
  beforeEach(() => {
    // Reset the store between tests
    useStarredGrants.setState({ starredIds: [] });
  });

  it("starts with empty starred list", () => {
    const state = useStarredGrants.getState();
    expect(state.starredIds).toEqual([]);
  });

  it("toggles a grant to starred", () => {
    useStarredGrants.getState().toggle("grant-1");
    expect(useStarredGrants.getState().starredIds).toContain("grant-1");
  });

  it("toggles a grant to unstarred", () => {
    useStarredGrants.getState().toggle("grant-1");
    useStarredGrants.getState().toggle("grant-1");
    expect(useStarredGrants.getState().starredIds).not.toContain("grant-1");
  });

  it("reports isStarred correctly", () => {
    expect(useStarredGrants.getState().isStarred("grant-1")).toBe(false);
    useStarredGrants.getState().toggle("grant-1");
    expect(useStarredGrants.getState().isStarred("grant-1")).toBe(true);
  });

  it("handles multiple starred grants", () => {
    useStarredGrants.getState().toggle("grant-1");
    useStarredGrants.getState().toggle("grant-2");
    useStarredGrants.getState().toggle("grant-3");
    const state = useStarredGrants.getState();
    expect(state.starredIds).toHaveLength(3);
    expect(state.isStarred("grant-1")).toBe(true);
    expect(state.isStarred("grant-2")).toBe(true);
    expect(state.isStarred("grant-3")).toBe(true);
  });
});
