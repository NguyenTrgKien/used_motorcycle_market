import axiosInstance from "../configs/axiosInstance";
import type { UserInfoForm } from "../pages/user/setting/Profile";

export const updateUserBasic = async (data: UserInfoForm, userId: number) => {
  const dataRequest = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(data).filter(([_, value]) => Boolean(value)),
  );

  const res = await axiosInstance.patch(`/api/v1/users/${userId}`, {
    ...dataRequest,
  });
  return {
    status: res.status,
    data: res.data,
  };
};

export const getDataSecurity = async () => {
  const res = await axiosInstance.get("/api/v1/auth/security-settings");
  return res;
};

export const updateCreatePostGuideSeen = async (
  hasSeenCreatePostGuide: boolean,
) => {
  const res = await axiosInstance.patch("/api/v1/users/create-post-guide", {
    hasSeenCreatePostGuide,
  });
  return res.data;
};
