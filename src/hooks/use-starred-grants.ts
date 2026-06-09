import { create } from "zustand";
import { persist } from "zustand/middleware";

interface StarredGrantsState {
  starredIds: string[];
  toggle: (id: string) => void;
  isStarred: (id: string) => boolean;
}

export const useStarredGrants = create<StarredGrantsState>()(
  persist(
    (set, get) => ({
      starredIds: [],
      toggle: (id: string) => {
        set((state) => {
          const isCurrentlyStarred = state.starredIds.includes(id);
          return {
            starredIds: isCurrentlyStarred
              ? state.starredIds.filter((sid) => sid !== id)
              : [...state.starredIds, id],
          };
        });
      },
      isStarred: (id: string) => get().starredIds.includes(id),
    }),
    {
      name: "grantledger-starred-grants",
    }
  )
);
