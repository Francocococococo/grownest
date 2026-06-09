import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { AuthUser } from "../types";
import { clearStoredUser, persistStoredUser, readStoredUser } from "../utils/storage";

export function useAuth(): {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
} {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const login = (nextUser: AuthUser): void => {
    persistStoredUser(nextUser);
    setUser(nextUser);
  };

  const logout = (): void => {
    clearStoredUser();
    setUser(null);
  };

  return { user, login, logout, setUser };
}
