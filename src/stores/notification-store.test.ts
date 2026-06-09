import { describe, it, expect, beforeEach, vi } from "vitest";
import { useNotificationStore } from "./notification-store";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "test-uuid-" + Math.random().toString(36).slice(2, 9)),
});

describe("notification-store", () => {
  beforeEach(() => {
    // Reset store between tests
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
    });
  });

  it("starts with empty notifications and zero unreadCount", () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it("addNotification adds a notification with auto-generated fields", () => {
    const store = useNotificationStore.getState();
    store.addNotification({
      type: "info",
      title: "Test notification",
      message: "Test message",
    });

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].title).toBe("Test notification");
    expect(state.notifications[0].message).toBe("Test message");
    expect(state.notifications[0].type).toBe("info");
    expect(state.notifications[0].read).toBe(false);
    expect(state.notifications[0].id).toBeTruthy();
    expect(state.notifications[0].createdAt).toBeTruthy();
    expect(state.unreadCount).toBe(1);
  });

  it("addNotification prepends new notifications (newest first)", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ type: "info", title: "First" });
    store.addNotification({ type: "success", title: "Second" });

    const state = useNotificationStore.getState();
    expect(state.notifications[0].title).toBe("Second");
    expect(state.notifications[1].title).toBe("First");
  });

  it("addNotification caps at 50 notifications", () => {
    const store = useNotificationStore.getState();
    for (let i = 0; i < 55; i++) {
      store.addNotification({ type: "info", title: `Notification ${i}` });
    }

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(50);
  });

  it("markAsRead marks a specific notification as read", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ type: "info", title: "First" });
    store.addNotification({ type: "warning", title: "Second" });

    let state = useNotificationStore.getState();
    const targetId = state.notifications[0].id;
    expect(state.unreadCount).toBe(2);

    store.markAsRead(targetId);

    state = useNotificationStore.getState();
    const marked = state.notifications.find((n) => n.id === targetId);
    expect(marked?.read).toBe(true);
    expect(state.unreadCount).toBe(1);
  });

  it("markAsRead with non-existent id does not change state", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ type: "info", title: "Test" });

    const beforeState = useNotificationStore.getState();
    store.markAsRead("non-existent-id");
    const afterState = useNotificationStore.getState();

    expect(afterState.unreadCount).toBe(beforeState.unreadCount);
  });

  it("markAllAsRead marks all notifications as read", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ type: "info", title: "First" });
    store.addNotification({ type: "warning", title: "Second" });
    store.addNotification({ type: "error", title: "Third" });

    expect(useNotificationStore.getState().unreadCount).toBe(3);

    store.markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    state.notifications.forEach((n) => {
      expect(n.read).toBe(true);
    });
  });

  it("clearAll removes all notifications", () => {
    const store = useNotificationStore.getState();
    store.addNotification({ type: "info", title: "First" });
    store.addNotification({ type: "success", title: "Second" });

    expect(useNotificationStore.getState().notifications).toHaveLength(2);

    store.clearAll();

    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it("unreadCount updates correctly through mixed operations", () => {
    const store = useNotificationStore.getState();

    store.addNotification({ type: "info", title: "A" });
    store.addNotification({ type: "info", title: "B" });
    store.addNotification({ type: "info", title: "C" });
    expect(useNotificationStore.getState().unreadCount).toBe(3);

    const firstId = useNotificationStore.getState().notifications[0].id;
    store.markAsRead(firstId);
    expect(useNotificationStore.getState().unreadCount).toBe(2);

    store.addNotification({ type: "info", title: "D" });
    expect(useNotificationStore.getState().unreadCount).toBe(3);

    store.markAllAsRead();
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });
});
