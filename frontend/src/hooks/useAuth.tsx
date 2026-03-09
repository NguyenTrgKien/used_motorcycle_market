import axiosInstance from "../configs/axiosInstance";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAuth = () => {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      axiosInstance.post("/api/v1/auth/login", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => axiosInstance.post("/api/v1/auth/logout"),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["user"] });
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoading: loginMutation.isPending || logoutMutation.isPending,
  };
};
