import type React from "react";
import { useUser } from "../../hooks/useUser";
import FullscreenLoader from "../FullscreenLoader";
import { Navigate } from "react-router-dom";
import useAuthModal from "../../hooks/useAuthModal";
import type { UserRole } from "../../shared";

interface GuardRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: UserRole[];
  requireUnVerified?: boolean;
}

function GuardRoute({
  children,
  requireAuth,
  roles,
  requireUnVerified,
}: GuardRouteProps) {
  const { user, isLoading } = useUser();
  const { openAuthModal } = useAuthModal();
  if (isLoading) return <FullscreenLoader />;

  if (requireAuth && !user) {
    openAuthModal();
    return <Navigate to={"/"} replace />;
  }

  if (requireUnVerified && user?.isVerified) {
    return <Navigate to={"/"} replace />;
  }

  if (requireAuth && roles && user && !roles.includes(user.role)) {
    return <Navigate to={"/unauthorized"} replace />;
  }

  return children;
}

export default GuardRoute;
