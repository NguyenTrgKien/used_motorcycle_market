import type React from "react";
import { useUser } from "../hooks/useUser";
import { Navigate } from "react-router-dom";
import FullscreenLoader from "./FullscreenLoader";

function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return <FullscreenLoader />;
  }

  if (!user?.isVerified) {
    return <Navigate to={"/verify"} />;
  }

  return children;
}

export default VerifiedRoute;
