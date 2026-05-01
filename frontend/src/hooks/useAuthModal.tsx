import { useContext } from "react";
import { AuthModalContext } from "../contexts/AuthModelContext";

const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) throw new Error("Không có authModelContext!");
  return context;
};

export default useAuthModal;
