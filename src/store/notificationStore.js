import { create } from "zustand";

const useNotificationStore = create((set) => ({
  hasNewRequest: false,

  setNewRequest: (value) => set({ hasNewRequest: value }),

  clearNewRequest: () => set({ hasNewRequest: false }),
}));

export default useNotificationStore;