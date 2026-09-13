import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { Bab, Buku, Soal, UjianTemplate } from "@/src/app/types/guru";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useUjianViewModel() {
  // --- Existing Template List States ---
  const [templates, setTemplates] = useState<UjianTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  useEffect(() => {
    if (Number(session?.user.id)) {
      guruRepository.getTemplates(Number(session?.user.id ?? 0)).then((res) => {
        setTemplates(res);
        setLoading(false);
      });
    }
  }, [session]);

  return {
    templates,
    loading,
  };
}
