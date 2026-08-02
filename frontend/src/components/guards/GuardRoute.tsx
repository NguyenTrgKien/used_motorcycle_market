import type React from "react";
import { useUser } from "../../hooks/useUser";
import FullscreenLoader from "../FullscreenLoader";
import { Navigate } from "react-router-dom";
import useAuthModal from "../../hooks/useAuthModal";
import { UserRole, type UserRole as UserRoleType } from "../../shared";

interface GuardRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: UserRoleType[];
  requireUnVerified?: boolean;
  area?: "customer" | "admin";
}

function GuardRoute({
  children,
  requireAuth,
  roles,
  requireUnVerified,
  area,
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

  if (area === "customer" && user && user.role !== UserRole.USER) {
    return <Navigate to={"/admin"} replace />;
  }

  if (area === "admin" && user?.role === UserRole.USER) {
    return <Navigate to={"/"} replace />;
  }

  if (requireAuth && roles && user && !roles.includes(user.role)) {
    return (
      <Navigate to={user.role === UserRole.USER ? "/" : "/admin"} replace />
    );
  }

  return children;
}

export default GuardRoute;
