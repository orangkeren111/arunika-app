import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Buku } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useBukuViewModel() {
  const [bukuList, setBukuList] = useState<Buku[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  const fetchBuku = () => {
    if (status !== "authenticated" || !session?.user?.id) return;
    setLoading(true);
    guruRepository.getBukuList(Number(session.user.id)).then((res) => {
      setBukuList(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchBuku();
  }, [session, status]);

  const handleAddBuku = async (title: string, description: string) => {
    await guruRepository.addBuku(
      { title, description },
      Number(session?.user?.id ?? 0),
    );
    fetchBuku();
  };

  const handleEditBuku = async (id: string, buku: any) => {
    await guruRepository.updateBuku(id, buku);
    fetchBuku();
  };

  const handleDeleteBuku = async (id: string) => {
    await guruRepository.deleteBuku(id);
    fetchBuku();
  };

  return { bukuList, loading, handleAddBuku, handleEditBuku, handleDeleteBuku };
}
