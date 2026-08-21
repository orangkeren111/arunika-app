"use client";

import { adminRepository } from "@/src/lib/repositories/adminRepository";
import { Role, User } from "@/src/app/types/admin";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useUsersViewModel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const sekolahId = session?.user?.sekolah_id ?? 0;
  const fetchUsers = () => {
    setLoading(true);
    console.log(session);

    adminRepository.getUsers(sekolahId).then((res) => {
      setUsers(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: number) => {
    const success = await adminRepository.deleteUser(id);
    if (success) fetchUsers();
  };

  const handleAdd = async (name: string, role: Role, email: string) => {
    try {
      await adminRepository.addUser({ name, role, email }, sekolahId);
      fetchUsers();
    } catch (error: any) {
      alert(error.message || "Gagal menambahkan pengguna.");
    }
  };

  const handleEdit = async (id: number, data: Partial<User>) => {
    try {
      await adminRepository.updateUser(id, data);
      fetchUsers();
    } catch (error: any) {
      alert(error.message || "Gagal memperbarui pengguna.");
    }
  };

  return { users, loading, handleDelete, handleAdd, handleEdit };
}
