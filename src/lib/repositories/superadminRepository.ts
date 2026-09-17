import { Tingkat } from "@/src/app/types/admin";
import * as superadminDB from "../services/db/superadmin/superadminDB";

export const superadminRepository = {
  getSchoolsWithStats: async () => {
    return await superadminDB.getSchoolsWithStats();
  },

  createSchool: async (
    name: string,
    address?: string,
    tingkat?: Tingkat,
    adminData?: { name: string; email: string; password?: string }
  ) => {
    return await superadminDB.createSchool(name, address, tingkat, adminData);
  },

  updateSchool: async (id: string, name: string, address?: string) => {
    return await superadminDB.updateSchool(parseInt(id), name, address);
  },

  deleteSchool: async (id: string) => {
    return await superadminDB.deleteSchool(parseInt(id));
  },

  activateSchool: async (id: string) => {
    return await superadminDB.activateSchool(parseInt(id));
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

  getSchoolDetailStats: async (sekolahId: string) => {
    return await superadminDB.getSchoolDetailStats(parseInt(sekolahId));
  },

  // LLM API Keys
  getApiKeys: async () => {
    return await superadminDB.getApiKeys();
  },

  createApiKey: async (data: { provider: string; name?: string; key: string; isActive?: boolean }) => {
    return await superadminDB.createApiKey(data);
  },

  updateApiKey: async (
    id: string,
    data: { provider?: string; name?: string; key?: string; isActive?: boolean }
  ) => {
    return await superadminDB.updateApiKey(id, data);
  },

  deleteApiKey: async (id: string) => {
    return await superadminDB.deleteApiKey(id);
  },

  toggleApiKeyStatus: async (id: string) => {
    return await superadminDB.toggleApiKeyStatus(id);
  },

  // LLM Task Routing
  getTaskRoutings: async (taskTypeFilter?: string) => {
    return await superadminDB.getTaskRoutings(taskTypeFilter);
  },

  createTaskRouting: async (data: {
    taskType: string;
    provider: string;
    modelName: string;
    priority: number;
    isActive?: boolean;
  }) => {
    return await superadminDB.createTaskRouting(data);
  },

  updateTaskRouting: async (
    id: string,
    data: { taskType?: string; provider?: string; modelName?: string; priority?: number; isActive?: boolean }
  ) => {
    return await superadminDB.updateTaskRouting(id, data);
  },

  deleteTaskRouting: async (id: string) => {
    return await superadminDB.deleteTaskRouting(id);
  },

  toggleTaskRoutingStatus: async (id: string) => {
    return await superadminDB.toggleTaskRoutingStatus(id);
  },
};

