import { useQuery } from "@tanstack/react-query";
import { securityApi } from "./security.api";

export const useGetSecurity = () => {
  return useQuery({
    queryKey: ["user-security"],
    queryFn: securityApi.getSecurity,
  });
};
