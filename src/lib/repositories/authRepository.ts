import { User } from "next-auth";
import * as authDB from "../services/db/authDB";

export const authRepository = {
  loginUser: async (email: string, password: string): Promise<User | null> => {
    const foundUser = await authDB.loginUser(email, password);
    if (foundUser) {
      return {
        id: String(foundUser.id),
        name: foundUser.name,
        role: foundUser.role,
        email: foundUser.email,
        sekolah_id: foundUser.sekolahId ?? 0,
      };
    }
    return null;
  },
};
