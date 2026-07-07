export const getPriceDigits = (value: string) => value.replace(/\D/g, "");

export const formatPriceInput = (value: string) => {
  const digits = getPriceDigits(value);

  if (!digits) return "";

  return `${Number(digits).toLocaleString("vi-VN")}đ`;
};