import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { guruRepository } from "@/src/lib/repositories/guruRepository";

export function useValidateCaptionsViewModel(bukuId: string) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bukuData, setBukuData] = useState<any>(null);

  // Existing image captions state: array of { id, caption, babId, contextText, imagePath, pageNumber }
  const [imagesList, setImagesList] = useState<any[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);

  // Newly added extra images state: array of { imagePath, caption, babId }
  const [newImages, setNewImages] = useState<
    Array<{ imagePath: string; caption: string; babId?: number | null }>
  >([]);

  // Add extra image modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newImageData, setNewImageData] = useState<{
    caption: string;
    babId: string;
    imageFile: File | null;
    imagePath: string;
  }>({
    caption: "",
    babId: "",
    imageFile: null,
    imagePath: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await guruRepository.getCaptionValidationData(bukuId);
        if (data) {
          setBukuData(data);
          setImagesList(data.images || []);
        }
      } catch (err) {
        console.error("Failed to load caption validation data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bukuId]);

  const handleCaptionChange = (id: number, newCaption: string) => {
    setImagesList((prev) =>
      prev.map((img) => (img.id === id ? { ...img, caption: newCaption } : img))
    );
  };

  const handleBabChange = (id: number, newBabId: number | null) => {
    setImagesList((prev) =>
      prev.map((img) => (img.id === id ? { ...img, babId: newBabId } : img))
    );
  };

  const handleDeleteImage = (id: number) => {
    setDeletedImageIds((prev) => [...prev, id]);
    setImagesList((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDeleteNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload handler for extra custom image
  const handleUploadImageFile = async (file: File) => {
    try {
      setUploadingImage(true);
      const url = await guruRepository.uploadImage(file);
      setNewImageData((prev) => ({ ...prev, imagePath: url }));
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Gagal mengunggah gambar. Menggunakan pratinjau lokal.");
      const tempUrl = URL.createObjectURL(file);
      setNewImageData((prev) => ({ ...prev, imagePath: tempUrl }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddExtraImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageData.caption.trim()) {
      alert("Harap isi deskripsi/caption gambar.");
      return;
    }
    if (!newImageData.imagePath) {
      alert("Harap pilih gambar terlebih dahulu.");
      return;
    }

    setNewImages((prev) => [
      ...prev,
      {
        imagePath: newImageData.imagePath,
        caption: newImageData.caption.trim(),
        babId: newImageData.babId ? parseInt(newImageData.babId) : null,
      },
    ]);

    setIsModalOpen(false);
    setNewImageData({ caption: "", babId: "", imageFile: null, imagePath: "" });
  };

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      await guruRepository.confirmCaptionValidation(
        bukuId,
        imagesList.map((img) => ({
          id: img.id,
          caption: img.caption,
          contextText: img.contextText,
          babId: img.babId,
        })),
        deletedImageIds,
        newImages
      );
      router.push("/guru/buku");
    } catch (err) {
      console.error("Failed to submit caption validation:", err);
      alert("Gagal menyimpan validasi caption. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const babs = bukuData?.bab || [];
  const totalImagesCount = imagesList.length + newImages.length;

  return {
    loading,
    submitting,
    bukuData,
    imagesList,
    newImages,
    isModalOpen,
    setIsModalOpen,
    newImageData,
    setNewImageData,
    uploadingImage,
    handleCaptionChange,
    handleBabChange,
    handleDeleteImage,
    handleDeleteNewImage,
    handleUploadImageFile,
    handleAddExtraImageSubmit,
    handleConfirm,
    babs,
    totalImagesCount,
  };
}
