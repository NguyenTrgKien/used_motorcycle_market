import { createContext } from "react";

interface AuthModalContextType {
  isOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
export const AuthModalContext = createContext<AuthModalContextType | null>(
  null,
);
