import axiosInstance from "../configs/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchUser = async () => {
  try {
    const res = await axiosInstance.get("/api/v1/auth/me");
    if (res.status === 200 && res.data.user) {
      return res.data.user;
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const useUser = () => {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const refetchUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user"] });
  };

  return { user, isLoading, refetchUser };
};
