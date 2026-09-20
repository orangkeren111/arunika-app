import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { superadminRepository } from "@/src/lib/repositories/superadminRepository";

export interface ApiKeyItem {
  id: string;
  provider: string;
  name: string | null;
  key: string;
  isActive: boolean;
  errorCount: number;
  cooldownUntil: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRoutingItem {
  id: string;
  taskType: string;
  provider: string;
  modelName: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const KNOWN_TASK_TYPES = [
  "fast_text",
  "smart_text",
  "process-book",
  "vision",
  "prompt_guard",
  "generate_report",
  "quiz_agent",
];

export const KNOWN_PROVIDERS = ["GEMINI", "CLAUDE", "GROQ", "OPENAI", "MISTRAL", "DEEPSEEK"];

export function useAiModelsViewModel() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<"keys" | "routing">("keys");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [searchApiKey, setSearchApiKey] = useState("");
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKeyItem | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({
    provider: "GEMINI",
    name: "",
    key: "",
    isActive: true,
  });

  // Task Routing state
  const [taskRoutings, setTaskRoutings] = useState<TaskRoutingItem[]>([]);
  const [taskTypeFilter, setTaskTypeFilter] = useState("ALL");
  const [searchRouting, setSearchRouting] = useState("");
  const [isRoutingModalOpen, setIsRoutingModalOpen] = useState(false);
  const [editingRouting, setEditingRouting] = useState<TaskRoutingItem | null>(null);
  const [routingForm, setRoutingForm] = useState({
    taskType: "fast_text",
    provider: "GEMINI",
    modelName: "gemini-3.6-flash",
    priority: 1,
    isActive: true,
  });

  const loadData = async () => {
    if (status !== "authenticated" || session?.user?.role !== "SUPERADMIN") return;
    setLoading(true);
    try {
      const [keysData, routingsData] = await Promise.all([
        superadminRepository.getApiKeys(),
        superadminRepository.getTaskRoutings(taskTypeFilter),
      ]);
      setApiKeys(keysData as any);
      setTaskRoutings(routingsData as any);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data AI Models.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session, status, taskTypeFilter]);

  // --- API KEY ACTIONS ---
  const openAddApiKeyModal = () => {
    setEditingApiKey(null);
    setApiKeyForm({
      provider: "GEMINI",
      name: "",
      key: "",
      isActive: true,
    });
    setIsApiKeyModalOpen(true);
  };

  const openEditApiKeyModal = (item: ApiKeyItem) => {
    setEditingApiKey(item);
    setApiKeyForm({
      provider: item.provider,
      name: item.name || "",
      key: "", // Leave key empty unless user wants to change it
      isActive: item.isActive,
    });
    setIsApiKeyModalOpen(true);
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApiKey && !apiKeyForm.key.trim()) {
      setError("API Key wajib diisi!");
      return;
    }

    try {
      if (editingApiKey) {
        await superadminRepository.updateApiKey(editingApiKey.id, {
          provider: apiKeyForm.provider,
          name: apiKeyForm.name,
          key: apiKeyForm.key.trim() ? apiKeyForm.key.trim() : undefined,
          isActive: apiKeyForm.isActive,
        });
        setSuccessMsg("API Key berhasil diperbarui.");
      } else {
        await superadminRepository.createApiKey({
          provider: apiKeyForm.provider,
          name: apiKeyForm.name,
          key: apiKeyForm.key.trim(),
          isActive: apiKeyForm.isActive,
        });
        setSuccessMsg("API Key baru berhasil ditambahkan.");
      }
      setIsApiKeyModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan API Key.");
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus API Key ini?")) return;
    try {
      await superadminRepository.deleteApiKey(id);
      setSuccessMsg("API Key berhasil dihapus.");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus API Key.");
    }
  };

  const handleToggleApiKeyStatus = async (id: string) => {
    try {
      await superadminRepository.toggleApiKeyStatus(id);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal mengubah status API Key.");
    }
  };

  // --- TASK ROUTING ACTIONS ---
  const openAddRoutingModal = () => {
    setEditingRouting(null);
    setRoutingForm({
      taskType: "fast_text",
      provider: "GEMINI",
      modelName: "gemini-3.6-flash",
      priority: 1,
      isActive: true,
    });
    setIsRoutingModalOpen(true);
  };

  const openEditRoutingModal = (item: TaskRoutingItem) => {
    setEditingRouting(item);
    setRoutingForm({
      taskType: item.taskType,
      provider: item.provider,
      modelName: item.modelName,
      priority: item.priority,
      isActive: item.isActive,
    });
    setIsRoutingModalOpen(true);
  };

  const handleSaveTaskRouting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingForm.taskType || !routingForm.modelName) {
      setError("Jenis Task dan Nama Model wajib diisi!");
      return;
    }

    try {
      if (editingRouting) {
        await superadminRepository.updateTaskRouting(editingRouting.id, {
          taskType: routingForm.taskType,
          provider: routingForm.provider,
          modelName: routingForm.modelName,
          priority: Number(routingForm.priority),
          isActive: routingForm.isActive,
        });
        setSuccessMsg("Task Routing berhasil diperbarui.");
      } else {
        await superadminRepository.createTaskRouting({
          taskType: routingForm.taskType,
          provider: routingForm.provider,
          modelName: routingForm.modelName,
          priority: Number(routingForm.priority),
          isActive: routingForm.isActive,
        });
        setSuccessMsg("Task Routing baru berhasil ditambahkan.");
      }
      setIsRoutingModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan Task Routing.");
    }
  };

  const handleDeleteTaskRouting = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus Task Routing ini?")) return;
    try {
      await superadminRepository.deleteTaskRouting(id);
      setSuccessMsg("Task Routing berhasil dihapus.");
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal menghapus Task Routing.");
    }
  };

  const handleToggleRoutingStatus = async (id: string) => {
    try {
      await superadminRepository.toggleTaskRoutingStatus(id);
      loadData();
    } catch (err: any) {
      setError(err?.message || "Gagal mengubah status Task Routing.");
    }
  };

  // Filtered lists for UI rendering
  const filteredApiKeys = apiKeys.filter((item) => {
    const query = searchApiKey.toLowerCase();
    return (
      item.provider.toLowerCase().includes(query) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      item.key.toLowerCase().includes(query)
    );
  });

  const filteredTaskRoutings = taskRoutings.filter((item) => {
    const query = searchRouting.toLowerCase();
    const matchesSearch =
      item.taskType.toLowerCase().includes(query) ||
      item.provider.toLowerCase().includes(query) ||
      item.modelName.toLowerCase().includes(query);
    return matchesSearch;
  });

  return {
    activeTab,
    setActiveTab,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    // API Keys
    apiKeys: filteredApiKeys,
    searchApiKey,
    setSearchApiKey,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    editingApiKey,
    apiKeyForm,
    setApiKeyForm,
    openAddApiKeyModal,
    openEditApiKeyModal,
    handleSaveApiKey,
    handleDeleteApiKey,
    handleToggleApiKeyStatus,
    // Task Routings
    taskRoutings: filteredTaskRoutings,
    taskTypeFilter,
    setTaskTypeFilter,
    searchRouting,
    setSearchRouting,
    isRoutingModalOpen,
    setIsRoutingModalOpen,
    editingRouting,
    routingForm,
    setRoutingForm,
    openAddRoutingModal,
    openEditRoutingModal,
    handleSaveTaskRouting,
    handleDeleteTaskRouting,
    handleToggleRoutingStatus,
    refresh: loadData,
  };
}
