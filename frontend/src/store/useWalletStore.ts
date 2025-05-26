import { create } from "zustand";
import { persist } from "zustand/middleware";

type WalletState = {
  credits: number;
  addCredits: (amount: number) => void;
  useCredits: (amount: number) => boolean;
  hasEnoughCredits: (amount: number) => boolean;
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      credits: 0,
      addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
      useCredits: (amount) => {
        const currentCredits = get().credits;
        if (currentCredits >= amount) {
          set({ credits: currentCredits - amount });
          return true;
        }
        return false;
      },
      hasEnoughCredits: (amount) => get().credits >= amount,
    }),
    {
      name: "wallet-storage",
    }
  )
);