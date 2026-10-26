import React, { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceArea,
    BarChart,
    Bar,
    Legend,
    TooltipProps
} from 'recharts';
import { ChartProps } from '../app/types/report';

// --- COMPONENT 2: ACCURACY BAR CHART ---
export const BloomAccuracyChart: React.FC<ChartProps> = ({ questions }) => {
    const aggregatedData = useMemo(() => {
        // Inisialisasi semua level Bloom agar tetap muncul meski kosong
        const bloomStats: Record<string, { bloom: string; benar: number; salah: number }> = {
            "C1": { bloom: "C1", benar: 0, salah: 0 },
            "C2": { bloom: "C2", benar: 0, salah: 0 },
            "C3": { bloom: "C3", benar: 0, salah: 0 },
            "C4": { bloom: "C4", benar: 0, salah: 0 },
            "C5": { bloom: "C5", benar: 0, salah: 0 },
            "C6": { bloom: "C6", benar: 0, salah: 0 },
        };

        questions.forEach((q) => {
            const level = q.bloomLevel?.toUpperCase() || 'C1';
            if (bloomStats[level]) {
                if (q.isCorrect) {
                    bloomStats[level].benar += 1;
                } else {
                    bloomStats[level].salah += 1;
                }
            }
        });

        return Object.values(bloomStats);
    }, [questions]);

    // Tooltip custom untuk Bar Chart
    const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
        if (active && payload && payload.length) {
            const benar = payload.find(p => p.dataKey === 'benar')?.value || 0;
            const salah = payload.find(p => p.dataKey === 'salah')?.value || 0;
            const total = benar + salah;

            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 border border-[#cde4d2] rounded-xl shadow-lg min-w-[150px]">
                    <p className="font-bold text-[#2e5e3b] mb-2 border-b pb-1">Level {label}</p>
                    <div className="text-sm space-y-1">
                        <p className="flex justify-between"><span className="text-gray-500">Benar:</span> <span className="font-medium text-emerald-600">{benar}</span></p>
                        <p className="flex justify-between"><span className="text-gray-500">Salah:</span> <span className="font-medium text-rose-500">{salah}</span></p>
                        <p className="flex justify-between pt-1 border-t mt-1"><span className="font-medium text-gray-700">Total Soal:</span> <span className="font-bold text-gray-800">{total}</span></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-[#e8f1ea]">
            <h3 className="text-lg font-bold text-[#2e5e3b] mb-1">Akurasi per Taksonomi Bloom</h3>
            <p className="text-sm text-gray-500 mb-6">Perbandingan jawaban benar dan salah pada masing-masing level kognitif.</p>

            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={aggregatedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                        <XAxis dataKey="bloom" tick={{ fill: '#4b5563', fontWeight: 500 }} axisLine={{ stroke: '#cde4d2' }} tickLine={false} />
                        <YAxis tick={{ fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8faf8' }} />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }}
                        />
                        {/* Stacked Bars - Hijau Ivory untuk Benar, Netral Ivory/Abu untuk Salah */}
                        <Bar dataKey="benar" name="Jawaban Benar" stackId="a" fill="#66bb6a" radius={[0, 0, 4, 4]} animationDuration={1000} />
                        <Bar dataKey="salah" name="Jawaban Salah" stackId="a" fill="#e5e7eb" radius={[4, 4, 0, 0]} animationDuration={1000} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};