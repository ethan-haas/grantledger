import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

describe("useUnsavedChanges", () => {
  it("starts with isDirty false", () => {
    const { result } = renderHook(() => useUnsavedChanges());
    expect(result.current.isDirty).toBe(false);
  });

  it("sets dirty state", () => {
    const { result } = renderHook(() => useUnsavedChanges());
    act(() => result.current.setDirty());
    expect(result.current.isDirty).toBe(true);
  });

  it("resets dirty state", () => {
    const { result } = renderHook(() => useUnsavedChanges());
    act(() => result.current.setDirty());
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.resetDirty());
    expect(result.current.isDirty).toBe(false);
  });

  it("adds beforeunload listener when dirty", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { result } = renderHook(() => useUnsavedChanges());
    act(() => result.current.setDirty());
    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    addSpy.mockRestore();
  });

  it("removes beforeunload listener when clean", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { result } = renderHook(() => useUnsavedChanges());
    act(() => result.current.setDirty());
    act(() => result.current.resetDirty());
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
    removeSpy.mockRestore();
  });
});
