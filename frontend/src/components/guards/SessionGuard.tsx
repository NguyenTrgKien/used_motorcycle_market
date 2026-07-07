import { Navigate } from "react-router-dom";

export default function SessionGuard({
  sessionKey,
  children,
}: {
  sessionKey: string;
  children: React.ReactNode;
}) {
  const value = sessionStorage.getItem(sessionKey);
  if (!value) return <Navigate to="/" replace />;
  return children;
}
