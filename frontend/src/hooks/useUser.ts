import { useEffect } from "react";
import axiosInstance from "../configs/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchUser = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/auth/me");
    return res.data.user;
  } catch {
    return null;
  }
};

export const useUser = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        queryClient.invalidateQueries({ queryKey: ["user"] });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [queryClient]);

  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return { user, isLoading, refetchUser };
};
