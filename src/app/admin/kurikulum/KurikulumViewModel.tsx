import { useState } from "react";
import { adminRepository } from "@/src/lib/repositories/adminRepository";

export function useKurikulumViewModel() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("pdfFile", file);

    try {
      const res = await adminRepository.initiateKurikulumExtraction(formData);
      if (res.success) {
        setMessage("File kurikulum berhasil diunggah dan sedang diproses di antrean extraction!");
        setFile(null);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || "Gagal mengunggah file."}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    file,
    loading,
    message,
    handleFileChange,
    handleSubmit,
  };
}
