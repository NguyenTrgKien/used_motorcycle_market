export const MotorCondition = {
  NEW: "new",
  USED: "used",
} as const;

export type MotorCondition =
  (typeof MotorCondition)[keyof typeof MotorCondition];

export const MotorFuelType = {
  GASOLINE: "gasoline",
  ELECTRICITY: "electricity",
} as const;

export type MotorFuelType = (typeof MotorFuelType)[keyof typeof MotorFuelType];

export const MotorTransmission = {
  AUTOMATIC: "automatic",
  SEMI_AUTOMATIC: "semi-automatic",
} as const;

export type MotorTransmission =
  (typeof MotorTransmission)[keyof typeof MotorTransmission];
