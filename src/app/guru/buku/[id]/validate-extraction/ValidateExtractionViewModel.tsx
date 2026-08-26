import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { guruRepository } from "@/src/lib/repositories/guruRepository";

export function useValidateExtractionViewModel(bukuId: string) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bukuData, setBukuData] = useState<any>(null);

  // Active Tab: "images" | "kompetensi"
  const [activeTab, setActiveTab] = useState<"images" | "kompetensi">("images");

  // Image Keep Map: imageId -> boolean (true = keep, false = discard)
  const [imageKeepMap, setImageKeepMap] = useState<Record<number, boolean>>({});
  const [imageFilter, setImageFilter] = useState<"ALL" | "KEPT" | "DISCARDED">("ALL");

  // Kompetensi state per bab: array of babs with their kompetensi items
  const [babsKompetensi, setBabsKompetensi] = useState<
    Array<{
      babId: number;
      judulBab: string;
      kompetensiList: Array<{ id?: number; nomerKompetensi: string; isiKompetensi: string }>;
    }>
  >([]);

  // Editing competency state
  const [editingItem, setEditingItem] = useState<{
    babId: number;
    index: number;
    nomer: string;
    isi: string;
  } | null>(null);

  // New competency modal/inline state
  const [newItem, setNewItem] = useState<{ babId: number; nomer: string; isi: string } | null>(
    null
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await guruRepository.getExtractionValidationData(bukuId);
        if (data) {
          setBukuData(data);

          // Initialize image keep map
          const keepMap: Record<number, boolean> = {};
          (data.images || []).forEach((img: any) => {
            keepMap[img.id] = img.isKept !== false;
          });
          setImageKeepMap(keepMap);

          // Initialize babs & kompetensi
          const babsFormatted = (data.bab || []).map((b: any) => ({
            babId: b.id,
            judulBab: b.judulBab,
            kompetensiList: (b.kompetensi || []).map((k: any) => ({
              id: k.id,
              nomerKompetensi: k.nomerKompetensi,
              isiKompetensi: k.isiKompetensi,
            })),
          }));
          setBabsKompetensi(babsFormatted);
        }
      } catch (err) {
        console.error("Failed to load extraction validation data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bukuId]);

  const toggleImageKeep = (imageId: number) => {
    setImageKeepMap((prev) => ({
      ...prev,
      [imageId]: !prev[imageId],
    }));
  };

  const setAllImagesKeepStatus = (status: boolean) => {
    const updated: Record<number, boolean> = {};
    Object.keys(imageKeepMap).forEach((id) => {
      updated[Number(id)] = status;
    });
    setImageKeepMap(updated);
  };

  // Kompetensi CRUD handlers
  const handleAddKompetensi = (babId: number) => {
    if (!newItem || !newItem.nomer.trim() || !newItem.isi.trim()) return;
    setBabsKompetensi((prev) =>
      prev.map((b) => {
        if (b.babId === babId) {
          return {
            ...b,
            kompetensiList: [
              ...b.kompetensiList,
              { nomerKompetensi: newItem.nomer.trim(), isiKompetensi: newItem.isi.trim() },
            ],
          };
        }
        return b;
      })
    );
    setNewItem(null);
  };

  const handleUpdateKompetensi = () => {
    if (!editingItem || !editingItem.nomer.trim() || !editingItem.isi.trim()) return;
    setBabsKompetensi((prev) =>
      prev.map((b) => {
        if (b.babId === editingItem.babId) {
          const updatedList = [...b.kompetensiList];
          updatedList[editingItem.index] = {
            ...updatedList[editingItem.index],
            nomerKompetensi: editingItem.nomer.trim(),
            isiKompetensi: editingItem.isi.trim(),
          };
          return { ...b, kompetensiList: updatedList };
        }
        return b;
      })
    );
    setEditingItem(null);
  };

  const handleDeleteKompetensi = (babId: number, index: number) => {
    setBabsKompetensi((prev) =>
      prev.map((b) => {
        if (b.babId === babId) {
          const updatedList = b.kompetensiList.filter((_, i) => i !== index);
          return { ...b, kompetensiList: updatedList };
        }
        return b;
      })
    );
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await guruRepository.confirmExtractionValidation(
        bukuId,
        imageKeepMap,
        babsKompetensi.map((b) => ({
          babId: b.babId,
          kompetensiList: b.kompetensiList,
        }))
      );
      router.push("/guru/buku");
    } catch (err) {
      console.error("Failed to submit extraction validation:", err);
      alert("Gagal menyimpan validasi. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const images = bukuData?.images || [];
  const keptCount = Object.values(imageKeepMap).filter(Boolean).length;
  const discardedCount = images.length - keptCount;

  const filteredImages = images.filter((img: any) => {
    const isKept = imageKeepMap[img.id] !== false;
    if (imageFilter === "KEPT") return isKept;
    if (imageFilter === "DISCARDED") return !isKept;
    return true;
  });

  return {
    loading,
    submitting,
    bukuData,
    activeTab,
    setActiveTab,
    imageKeepMap,
    imageFilter,
    setImageFilter,
    babsKompetensi,
    editingItem,
    setEditingItem,
    newItem,
    setNewItem,
    toggleImageKeep,
    setAllImagesKeepStatus,
    handleAddKompetensi,
    handleUpdateKompetensi,
    handleDeleteKompetensi,
    handleConfirm,
    images,
    keptCount,
    discardedCount,
    filteredImages,
  };
}
