import { create } from "zustand";

type WalletState = {
  credits: number;
  addCredits: (amount: number) => void;
  useCredit: () => void;
};

export const useWalletStore = create<WalletState>((set) => ({
  credits: 0,
  addCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
  useCredit: () => set((state) => ({ credits: state.credits > 0 ? state.credits - 1 : 0 })),
}));
