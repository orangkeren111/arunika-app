import * as superadminDB from "../services/db/superadmin/superadminDB";

export const superadminRepository = {
  getSchoolsWithStats: async () => {
    return await superadminDB.getSchoolsWithStats();
  },

  createSchool: async (name: string, address?: string) => {
    return await superadminDB.createSchool(name, address);
  },

  updateSchool: async (id: string, name: string, address?: string) => {
    return await superadminDB.updateSchool(parseInt(id), name, address);
  },

  deleteSchool: async (id: string) => {
    return await superadminDB.deleteSchool(parseInt(id));
  },

  getSchoolMembers: async (sekolahId: string) => {
    const raw = await superadminDB.getSchoolMembers(parseInt(sekolahId));
    return raw.map((u) => ({
      id: u.id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  },
};
