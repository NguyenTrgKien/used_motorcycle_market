import bcrypt from 'bcrypt';

const salt = 10;
export const hashPass = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, salt);
};

export const comparePass = async (
  passRaw: string,
  password: string,
): Promise<boolean> => {
  return await bcrypt.compare(passRaw, password);
};
