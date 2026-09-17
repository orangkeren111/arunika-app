"use client";

import Link from "next/link";
import {
    User,
    BarChart3,
    ShieldCheck,
    Mail,
    School,
    KeyRound,
    Lock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
} from "lucide-react";

import ThemeToggle from "@/src/components/ThemeToggle";

import {
    useProfileViewModel,
    type ProfileData,
    type ProfileStatistics,
} from "./ProfileViewModel";

export default function ProfilePage() {
    const {
        profile,
        statistics,
        activeSection,
        setActiveSection,

        currentPassword,
        setCurrentPassword,

        newPassword,
        setNewPassword,

        confirmPassword,
        setConfirmPassword,

        isChangingPassword,

        passwordMessage,
        passwordError,

        changePassword,
    } = useProfileViewModel();

    const menuItems = [
        {
            id: "profile" as const,
            label: "Profil",
            icon: User,
        },
        {
            id: "statistics" as const,
            label: "Statistik",
            icon: BarChart3,
        },
        {
            id: "security" as const,
            label: "Keamanan",
            icon: ShieldCheck,
        },
    ];

    const dashboardPath = getDashboardPath(profile?.role);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link
                        href={dashboardPath}
                        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
                    >
                        <ArrowLeft size={18} />
                        <span>Kembali</span>
                    </Link>

                    <ThemeToggle />
                </div>
            </header>

            {/* Page */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Page Heading */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                                Pengaturan Akun
                            </h1>

                            <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                Kelola informasi profil, aktivitas, dan keamanan akunmu.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
                    {/* Inner Sidebar */}
                    <aside className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-2 h-fit">
                        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveSection(item.id)}
                                        className={`shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${isActive
                                                ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                                : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                            }`}
                                    >
                                        <Icon size={17} />
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Content */}
                    <main className="min-w-0">
                        {/* Profile */}
                        {activeSection === "profile" && (
                            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6">
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                                        Informasi Profil
                                    </h2>

                                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                        Informasi dasar yang digunakan pada akunmu.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-[var(--border)]">
                                    <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-2xl font-bold shrink-0">
                                        {profile?.name?.charAt(0).toUpperCase() ?? "?"}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-xl font-bold text-[var(--foreground)]">
                                            {profile?.name ?? "Pengguna"}
                                        </h3>

                                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                            {profile?.role ?? "Pengguna"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]">
                                        <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
                                            <Mail size={16} />
                                            <span className="text-xs font-medium">
                                                Email
                                            </span>
                                        </div>

                                        <p className="text-sm font-semibold text-[var(--foreground)] break-all">
                                            {profile?.email}
                                        </p>
                                    </div>

                                    <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]">
                                        <div className="flex items-center gap-2 text-[var(--muted-foreground)] mb-2">
                                            <School size={16} />
                                            <span className="text-xs font-medium">
                                                Sekolah
                                            </span>
                                        </div>

                                        <p className="text-sm font-semibold text-[var(--foreground)]">
                                            {profile?.schoolName ?? "Belum terdaftar"}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Statistics */}
                        {activeSection === "statistics" && (
                            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6">
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-[var(--foreground)]">
                                        Statistik Aktivitas
                                    </h2>

                                    <p className="text-sm text-[var(--muted-foreground)] mt-1">
                                        Ringkasan aktivitas akunmu di Arunika.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <StatCard
                                        label="Total Ujian"
                                        value={statistics?.totalExams ?? 0}
                                    />

                                    <StatCard
                                        label="Selesai"
                                        value={statistics?.completedExams ?? 0}
                                    />

                                    <StatCard
                                        label="Sudah Dinilai"
                                        value={statistics?.gradedExams ?? 0}
                                    />

                                    <StatCard
                                        label="Rata-rata Nilai"
                                        value={statistics?.averageScore ?? 0}
                                    />
                                </div>

                                <div className="mt-5 p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)]">
                                    <p className="text-sm text-[var(--foreground)]">
                                        Statistik ini memberikan gambaran singkat
                                        mengenai aktivitas akunmu.
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Security */}
                        {activeSection === "security" && (
                            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-[var(--muted)] flex items-center justify-center">
                                            <KeyRound
                                                size={19}
                                                className="text-[var(--primary)]"
                                            />
                                        </div>

                                        <div>
                                            <h2 className="text-lg font-bold text-[var(--foreground)]">
                                                Ubah Password
                                            </h2>

                                            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                                                Perbarui password untuk menjaga keamanan akun.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {passwordMessage && (
                                    <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-sm text-[var(--foreground)]">
                                        <CheckCircle2
                                            size={16}
                                            className="text-[var(--success)] shrink-0"
                                        />

                                        {passwordMessage}
                                    </div>
                                )}

                                {passwordError && (
                                    <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-[var(--error)]/10 border border-[var(--error)]/30 text-sm text-[var(--foreground)]">
                                        <AlertCircle
                                            size={16}
                                            className="text-[var(--error)] shrink-0"
                                        />

                                        {passwordError}
                                    </div>
                                )}

                                <div className="max-w-xl space-y-4">
                                    <PasswordField
                                        label="Password saat ini"
                                        value={currentPassword}
                                        onChange={setCurrentPassword}
                                        placeholder="Masukkan password saat ini"
                                    />

                                    <PasswordField
                                        label="Password baru"
                                        value={newPassword}
                                        onChange={setNewPassword}
                                        placeholder="Minimal 8 karakter"
                                    />

                                    <PasswordField
                                        label="Konfirmasi password baru"
                                        value={confirmPassword}
                                        onChange={setConfirmPassword}
                                        placeholder="Masukkan ulang password baru"
                                    />

                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={changePassword}
                                            disabled={isChangingPassword}
                                            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isChangingPassword
                                                ? "Menyimpan..."
                                                : "Ubah Password"}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 rounded-xl bg-[var(--muted)] border border-[var(--border)] flex gap-3">
                                    <Lock
                                        size={17}
                                        className="text-[var(--primary)] mt-0.5 shrink-0"
                                    />

                                    <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                                        Gunakan password yang berbeda dari password
                                        sebelumnya dan minimal 8 karakter.
                                    </p>
                                </div>
                            </section>
                        )}
                    </main>
                </div>
            </main>
        </div>
    );
}

function getDashboardPath(role?: string | null) {
    switch (role) {
        case "SUPERADMIN":
            return "/superadmin/dashboard";

        case "GURU":
            return "/guru/dashboard";

        case "SISWA":
            return "/siswa/dashboard";

        default:
            return "/";
    }
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: number;
}) {
    return (
        <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--card)]">
            <p className="text-xs text-[var(--muted-foreground)]">
                {label}
            </p>

            <p className="text-2xl font-bold text-[var(--foreground)] mt-2">
                {value}
            </p>
        </div>
    );
}

function PasswordField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                {label}
            </label>

            <input
                type="password"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition"
            />
        </div>
    );
}