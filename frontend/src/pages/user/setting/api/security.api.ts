import axiosInstance from "../../../../configs/axiosInstance";

export const securityApi = {
  getSecurity: async () => {
    const res = await axiosInstance.get("/api/v1/auth/security-settings");

    return res.data;
  },
};
