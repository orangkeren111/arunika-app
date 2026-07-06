import { guruRepository } from "@/src/lib/repositories/guruRepository";
import { UjianTemplate } from "@/src/app/types/guru";
import { useEffect, useState } from "react";

export function useUjianViewModel() {
  const [templates, setTemplates] = useState<UjianTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guruRepository.getTemplates().then(res => {
      setTemplates(res);
      setLoading(false);
    });
  }, []);

  return { templates, loading };
}