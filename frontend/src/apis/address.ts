import axiosInstance from "../configs/axiosInstance";

export const getAddresses = async () => {
  const res = await axiosInstance.get("/api/v1/addresses");
  return res.data;
};

export const getUserAddresses = async () => {
  const res = await axiosInstance.get("/api/v1/user-addresses");
  return res.data;
};
