"use client";

import React from "react";
import {
  KeyRound,
  Route,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Power,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  useAiModelsViewModel,
  KNOWN_TASK_TYPES,
  KNOWN_PROVIDERS,
} from "./AiModelsViewModel";
import { maskApiKey } from "@/src/lib/utils/hasher";

export default function AiModelsPage() {
  const {
    activeTab,
    setActiveTab,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    // API Keys
    apiKeys,
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
    taskRoutings,
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
  } = useAiModelsViewModel();

  const totalKeys = apiKeys.length;
  const activeKeysCount = apiKeys.filter((k) => k.isActive).length;
  const totalRoutings = taskRoutings.length;
  const uniqueTasksCount = new Set(taskRoutings.map((r) => r.taskType)).size;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                AI Models & Task Routing
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Kelola API Key provider LLM (terenkripsi lokal) dan konfigurasi alur kerja task AI.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button depending on active tab */}
        {activeTab === "keys" ? (
          <button
            onClick={openAddApiKeyModal}
            className="w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah API Key Provider
          </button>
        ) : (
          <button
            onClick={openAddRoutingModal}
            className="w-full sm:w-auto bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-xl font-semibold hover:opacity-95 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Task Routing
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start justify-between gap-3 bg-red-500/10 border border-red-500/30 text-[var(--foreground)] p-4 rounded-xl text-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-[var(--muted-foreground)] hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start justify-between gap-3 bg-emerald-500/10 border border-emerald-500/30 text-[var(--foreground)] p-4 rounded-xl text-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            <p className="font-medium">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-[var(--muted-foreground)] hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider">
            <span>Total API Keys</span>
            <KeyRound className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-3xl font-black text-[var(--foreground)]">
            {totalKeys}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {activeKeysCount} Kunci Aktif
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider">
            <span>Enkripsi Lokal</span>
            <Lock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-sm font-semibold text-emerald-500 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4" />
            Hasher Env Active
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            HMAC SHA-256 Secret Protection
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider">
            <span>Total Task Routings</span>
            <Route className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-3xl font-black text-[var(--foreground)]">
            {totalRoutings}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {uniqueTasksCount} Jenis Task Terdaftar
          </p>
        </div>

        <div className="bg-[var(--card)] p-5 rounded-2xl border border-[var(--border)] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider">
            <span>Provider Didukung</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-[var(--foreground)]">
            {KNOWN_PROVIDERS.length}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            Gemini, Claude, Groq, & OpenAI
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[var(--muted)] rounded-xl border border-[var(--border)] self-start md:self-auto">
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "keys"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <KeyRound className="w-4 h-4" />
            API Keys Provider ({apiKeys.length})
          </button>
          <button
            onClick={() => setActiveTab("routing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "routing"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
          >
            <Route className="w-4 h-4" />
            Task Routing Models ({taskRoutings.length})
          </button>
        </div>

        {/* Tab-specific Controls */}
        {activeTab === "keys" ? (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Cari provider atau nama key..."
              value={searchApiKey}
              onChange={(e) => setSearchApiKey(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none transition"
            />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 justify-end max-w-xl">
            {/* Task Type Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-sm rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none transition"
              >
                <option value="ALL">Semua Jenis Task</option>
                {KNOWN_TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Routing Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Cari model atau task..."
                value={searchRouting}
                onChange={(e) => setSearchRouting(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Areas */}
      {loading ? (
        <div className="flex items-center justify-center p-16 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : activeTab === "keys" ? (
        /* ==================== API KEYS SECTION ==================== */
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {apiKeys.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <KeyRound className="w-12 h-12 text-[var(--muted-foreground)] mx-auto opacity-50" />
              <p className="font-semibold text-[var(--foreground)]">Belum ada API Key</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Klik tombol "Tambah API Key Provider" untuk mendaftarkan kunci provider LLM pertama Anda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4">Provider</th>
                    <th className="p-4">Nama Deskriptif</th>
                    <th className="p-4">Hashed API Key</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Error / Cooldown</th>
                    <th className="p-4">Dibuat Pada</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                  {apiKeys.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/50 transition">
                      <td className="p-4 font-bold flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-xs">
                          {item.provider}
                        </span>
                      </td>
                      <td className="p-4 font-medium">
                        {item.name || <span className="text-[var(--muted-foreground)] italic">Tanpa Nama</span>}
                      </td>
                      <td className="p-4 font-mono text-xs text-[var(--muted-foreground)]">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{maskApiKey(item.key)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleApiKeyStatus(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${item.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-600 border border-red-500/30"
                            }`}
                        >
                          <Power className="w-3 h-3" />
                          {item.isActive ? "Aktif" : "Non-Aktif"}
                        </button>
                      </td>
                      <td className="p-4 text-xs text-[var(--muted-foreground)]">
                        {item.errorCount > 0 ? (
                          <span className="text-red-500 font-semibold">{item.errorCount} error</span>
                        ) : (
                          <span className="text-emerald-500">Normal (0 error)</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-[var(--muted-foreground)]">
                        {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditApiKeyModal(item)}
                            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition"
                            title="Edit Key"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteApiKey(item.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                            title="Hapus Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ==================== TASK ROUTING SECTION ==================== */
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          {taskRoutings.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Route className="w-12 h-12 text-[var(--muted-foreground)] mx-auto opacity-50" />
              <p className="font-semibold text-[var(--foreground)]">Belum ada Task Routing</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Klik tombol "Tambah Task Routing" untuk menentukan pemetaan model LLM berdasarkan jenis task.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[var(--muted)] text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-wider border-b border-[var(--border)]">
                    <th className="p-4">Jenis Task</th>
                    <th className="p-4">Priority Order</th>
                    <th className="p-4">Provider LLM</th>
                    <th className="p-4">Nama Model</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--foreground)]">
                  {taskRoutings.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--muted)]/50 transition">
                      <td className="p-4 font-semibold">
                        <span className="px-3 py-1 rounded-xl bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)] text-xs font-mono">
                          {item.taskType}
                        </span>
                      </td>
                      <td className="p-4 font-bold">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${item.priority === 1
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                              : "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--border)]"
                            }`}
                        >
                          P{item.priority} {item.priority === 1 ? "(Primary)" : "(Fallback)"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                          {item.provider}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs font-medium text-[var(--foreground)]">
                        {item.modelName}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleRoutingStatus(item.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${item.isActive
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-600 border border-red-500/30"
                            }`}
                        >
                          <Power className="w-3 h-3" />
                          {item.isActive ? "Aktif" : "Non-Aktif"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRoutingModal(item)}
                            className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition"
                            title="Edit Routing"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTaskRouting(item.id)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                            title="Hapus Routing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== API KEY MODAL ==================== */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl p-6 space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[var(--primary)]" />
                {editingApiKey ? "Edit API Key Provider" : "Tambah API Key Provider"}
              </h3>
              <button
                onClick={() => setIsApiKeyModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                  LLM Provider
                </label>
                <select
                  value={apiKeyForm.provider}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, provider: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm"
                >
                  {KNOWN_PROVIDERS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                  Nama Kunci (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Gemini Production Key 1"
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                  API Key String {editingApiKey && "(Kosongkan jika tidak ingin mengubah)"}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder={editingApiKey ? "••••••••••••••••" : "Masukkan string API key..."}
                    value={apiKeyForm.key}
                    onChange={(e) => setApiKeyForm({ ...apiKeyForm, key: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm font-mono"
                  />
                </div>
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Kunci ini akan di-hash/enkripsi secara otomatis di server menggunakan <code>KEY_HASHER_SECRET</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="keyIsActive"
                  checked={apiKeyForm.isActive}
                  onChange={(e) => setApiKeyForm({ ...apiKeyForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--primary)] border-[var(--input)] focus:ring-[var(--ring)]"
                />
                <label htmlFor="keyIsActive" className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
                  Aktifkan API Key ini secara langsung
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsApiKeyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95 transition shadow-sm"
                >
                  {editingApiKey ? "Simpan Perubahan" : "Tambah Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TASK ROUTING MODAL ==================== */}
      {isRoutingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl p-6 space-y-6 relative overflow-hidden">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                <Route className="w-5 h-5 text-[var(--primary)]" />
                {editingRouting ? "Edit Task Routing Rule" : "Tambah Task Routing Rule"}
              </h3>
              <button
                onClick={() => setIsRoutingModalOpen(false)}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskRouting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                  Jenis Task (Task Type)
                </label>
                <input
                  type="text"
                  list="task-type-options"
                  placeholder="Misal: fast_text, smart_text, vision"
                  value={routingForm.taskType}
                  onChange={(e) => setRoutingForm({ ...routingForm, taskType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm font-mono"
                />
                <select className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm font-mono" value={routingForm.taskType} onChange={(e) => setRoutingForm({ ...routingForm, taskType: e.target.value })}>
                  {KNOWN_TASK_TYPES.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                    Provider LLM
                  </label>
                  <select
                    value={routingForm.provider}
                    onChange={(e) => setRoutingForm({ ...routingForm, provider: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm"
                  >
                    {KNOWN_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                    Priority (1 = Utuh)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={routingForm.priority}
                    onChange={(e) => setRoutingForm({ ...routingForm, priority: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1.5">
                  Nama Model (Model Identifier)
                </label>
                <input
                  type="text"
                  placeholder="Misal: gemini-2.5-flash, claude-3-5-sonnet-20240620"
                  value={routingForm.modelName}
                  onChange={(e) => setRoutingForm({ ...routingForm, modelName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--input)] bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] outline-none text-sm font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="routingIsActive"
                  checked={routingForm.isActive}
                  onChange={(e) => setRoutingForm({ ...routingForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--primary)] border-[var(--input)] focus:ring-[var(--ring)]"
                />
                <label htmlFor="routingIsActive" className="text-sm font-medium text-[var(--foreground)] cursor-pointer">
                  Aktifkan aturan routing ini
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsRoutingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-95 transition shadow-sm"
                >
                  {editingRouting ? "Simpan Perubahan" : "Tambah Routing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
