"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { adminRepository } from "@/src/lib/repositories/adminRepository";
import {
  Role,
  User,
  UserImportRow,
} from "@/src/app/types/admin";

export function useUsersViewModel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: session,
    status,
  } = useSession();

  const sekolahId = session?.user?.sekolah_id ?? 0;

  const fetchUsers = useCallback(async () => {
    if (!sekolahId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await adminRepository.getUsers(sekolahId);

      setUsers(result);
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error,
      );

      alert(
        "Gagal mengambil data pengguna.",
      );
    } finally {
      setLoading(false);
    }
  }, [sekolahId]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    fetchUsers();
  }, [status, fetchUsers]);

  const handleDelete = async (id: number) => {
    try {
      setActionLoading(true);

      await adminRepository.deleteUser(id);

      await fetchUsers();
    } catch (error: any) {
      alert(
        error?.message ||
        "Gagal menghapus pengguna.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = async (
    name: string,
    role: Role,
    email: string,
    password: string,
  ) => {
    try {
      setActionLoading(true);

      await adminRepository.addUser(
        {
          name,
          role,
          email,
          password,
        },
        sekolahId,
      );

      await fetchUsers();
    } catch (error: any) {
      alert(
        error?.message ||
        "Gagal menambahkan pengguna.",
      );

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (
    id: number,
    data: Partial<User>,
  ) => {
    try {
      setActionLoading(true);

      await adminRepository.updateUser(
        id,
        data,
      );

      await fetchUsers();
    } catch (error: any) {
      alert(
        error?.message ||
        "Gagal memperbarui pengguna.",
      );

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (
    id: number,
    password: string,
  ) => {
    try {
      setActionLoading(true);

      await adminRepository.resetPassword(
        id,
        password,
      );

      alert(
        "Password berhasil direset.",
      );
    } catch (error: any) {
      alert(
        error?.message ||
        "Gagal mereset password.",
      );

      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchImport = async (
    rows: UserImportRow[],
  ) => {
    try {
      setActionLoading(true);

      const count =
        await adminRepository.addUsersBatch(
          rows,
          sekolahId,
        );

      await fetchUsers();

      alert(
        `${count} pengguna berhasil ditambahkan.`,
      );

      return true;
    } catch (error: any) {
      alert(
        error?.message ||
        "Gagal mengimport pengguna.",
      );

      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    users,
    loading,
    actionLoading,

    handleDelete,
    handleAdd,
    handleEdit,
    handleResetPassword,
    handleBatchImport,
    refresh: fetchUsers,
  };
}