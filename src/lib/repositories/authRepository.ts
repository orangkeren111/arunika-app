import { User } from "next-auth";
import bcrypt from "bcryptjs";
import * as authDB from "../services/db/authDB";

export const authRepository = {
  loginUser: async (email: string, password: string): Promise<User | null> => {
    const foundUser = await authDB.getUserByEmail(email);

    if (!foundUser) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, foundUser.password);

    if (isValidPassword) {
      return {
        id: String(foundUser.id),
        name: foundUser.name,
        role: foundUser.role,
        email: foundUser.email,
        sekolah_id: foundUser.sekolahId ?? 0,
        isRetired: foundUser.sekolah?.isRetired,
      };
    }

    return null;
  },
};
