import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ManagedIntern } from "../types";
import { persistManagedInterns, readManagedInterns } from "../utils/storage";

export function useInterns(seed: () => ManagedIntern[]): {
  managedInterns: ManagedIntern[];
  setManagedInterns: Dispatch<SetStateAction<ManagedIntern[]>>;
  updateManagedInterns: (updater: (current: ManagedIntern[]) => ManagedIntern[]) => void;
} {
  const [managedInterns, setManagedInterns] = useState<ManagedIntern[]>(() => readManagedInterns(seed));

  const updateManagedInterns = (updater: (current: ManagedIntern[]) => ManagedIntern[]): void => {
    setManagedInterns((current) => {
      const next = updater(current);
      persistManagedInterns(next);
      return next;
    });
  };

  return { managedInterns, setManagedInterns, updateManagedInterns };
}
