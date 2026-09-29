import * as adminDB from "../services/db/adminDB";

export const adminPaymentRepository = {
  getPaymentHistory: async (sekolahId: string) => {
    return await adminDB.getAdminSchoolPaymentHistory(parseInt(sekolahId));
  },
};
