import React, { useMemo, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';

interface ChartProps {
    questions: any[]; // Sesuaikan dengan tipe QuestionDetail milikmu
}

const BLOOM_RANGES = [
    { level: 'C1', start: 760, end: 1160 },
    { level: 'C2', start: 920, end: 1320 },
    { level: 'C3', start: 1080, end: 1480 },
    { level: 'C4', start: 1240, end: 1640 },
    { level: 'C5', start: 1400, end: 1800 },
    { level: 'C6', start: 1560, end: 1960 },
];

const calculateQElo = (bloomLevel: string, difficulty: number): number => {
    const bloom = BLOOM_RANGES.find(b => b.level === bloomLevel?.toUpperCase());
    const baseFloor = bloom ? bloom.start : 760;
    return baseFloor + (difficulty * 40);
};

export const BloomProgressChart: React.FC<ChartProps> = ({ questions }) => {
    // State untuk menyimpan filter yang aktif (null = tampilkan semua)
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const chartData = useMemo(() => {
        return questions.map((q, index) => {
            const elo = calculateQElo(q.bloomLevel, q.difficulty);
            return {
                nomor: index + 1,
                elo: elo,
                bloom: q.bloomLevel?.toUpperCase() || 'C1',
                isCorrect: q.isCorrect,
                difficulty: q.difficulty,
                teksSoal: q.teksSoal
            };
        });
    }, [questions]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white/95 backdrop-blur-sm p-4 border border-[#7FA88F]/40 rounded-xl shadow-lg min-w-[200px] z-50">
                    <p className="font-bold text-[#39434D] mb-2 border-b pb-1">Soal No. {label}</p>
                    <div className="text-sm space-y-1">
                        <p><span className="text-gray-500">Domain Bloom:</span> <span className="font-bold text-[#7FA88F]">{data.bloom}</span></p>
                        <p><span className="text-gray-500">Difficulty:</span> <span className="font-medium">{data.difficulty}</span></p>
                        <p><span className="text-gray-500">Nilai Elo:</span> <span className="font-medium">{data.elo}</span></p>
                        <p className="mt-2 pt-2 border-t flex justify-between items-center">
                            <span className="text-gray-500">Status:</span>
                            <span className={`font-bold px-2 py-0.5 rounded ${data.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {data.isCorrect ? 'BENAR' : 'SALAH'}
                            </span>
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        // Cek apakah dot ini sedang di-filter
        const isFaded = activeFilter !== null && payload.bloom !== activeFilter;

        return (
            <circle
                cx={cx} cy={cy} r={5}
                stroke={payload.isCorrect ? "#059669" : "#e11d48"}
                strokeWidth={2}
                fill="#ffffff"
                // Kurangi opacity jika difilter
                opacity={isFaded ? 0.15 : 1}
                style={{ transition: 'opacity 0.3s ease' }}
            />
        );
    };

    const CustomLabel = (props: any) => {
        const { x, y, index } = props;
        const bloomText = chartData[index]?.bloom;

        // Jangan tampilkan label jika data tidak ada, atau jika sedang difilter dan bukan bagian dari filter
        const isFaded = activeFilter !== null && bloomText !== activeFilter;
        if (!bloomText || isFaded) return null;

        return (
            <text
                x={x}
                y={y - 12}
                fill="#7FA88F"
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
                style={{ transition: 'opacity 0.3s ease' }}
            >
                {bloomText}
            </text>
        );
    };

    const toggleFilter = (level: string) => {
        // Jika diklik level yang sama, matikan filter (kembali ke null)
        setActiveFilter(prev => prev === level ? null : level);
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-[#7FA88F]/20">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-[#39434D] mb-1">Perkembangan Kognitif Siswa</h3>
                <p className="text-sm text-[#39434D]/60">Menganalisis pencapaian siswa berdasarkan level soal dan Taksonomi Bloom.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 h-[450px]">
                {/* KOLOM KIRI: FILTER BUTTONS */}
                <div className="w-full md:w-24 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 flex-shrink-0">
                    {BLOOM_RANGES.map((b) => (
                        <button
                            key={b.level}
                            onClick={() => toggleFilter(b.level)}
                            className={`flex-1 md:flex-none py-2 px-3 rounded-xl text-sm font-bold transition-all duration-300 border ${activeFilter === b.level
                                ? 'bg-[#7FA88F] text-white border-[#7FA88F] shadow-md scale-[1.02]'
                                : 'bg-white text-[#39434D]/60 border-[#7FA88F]/20 hover:bg-[#7FA88F]/10 hover:border-[#7FA88F]/40'
                                }`}
                        >
                            {b.level}
                        </button>
                    ))}

                    {/* Tombol Reset Filter */}
                    {activeFilter && (
                        <button
                            onClick={() => setActiveFilter(null)}
                            className="flex-1 md:flex-none py-2 px-3 mt-auto rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all border border-red-100"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* KOLOM KANAN: GRAFIK */}
                <div className="flex-grow w-full h-full relative">
                    {/* Jika ada filter aktif, kurangi opacity seluruh line menggunakan CSS untuk menonjolkan titik */}
                    <div className={`w-full h-full transition-opacity duration-500 ${activeFilter ? 'opacity-80' : 'opacity-100'}`}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 40, left: 10, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                                <XAxis
                                    dataKey="nomor"
                                    tick={{ fill: '#94a3b8' }}
                                    tickLine={false}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                />
                                <YAxis
                                    domain={[700, 'auto']}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    axisLine={{ stroke: '#e2e8f0' }}
                                    tickLine={false}
                                    width={40}
                                />

                                {BLOOM_RANGES.map((range) => {
                                    // Cek apakah garis ini harus dipudarkan
                                    const isFaded = activeFilter !== null && activeFilter !== range.level;
                                    const lineOpacity = isFaded ? 0.05 : 0.3;
                                    const textOpacity = isFaded ? 0.1 : 0.7;

                                    return (
                                        <React.Fragment key={range.level}>
                                            <ReferenceLine
                                                y={range.start}
                                                stroke="#7FA88F"
                                                strokeOpacity={lineOpacity}
                                                strokeDasharray="3 3"
                                                label={{
                                                    position: 'insideTopLeft',
                                                    value: `Start ${range.level}`,
                                                    fill: '#7FA88F',
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    opacity: textOpacity
                                                }}
                                            />
                                            <ReferenceLine
                                                y={range.end}
                                                stroke="#e11d48"
                                                strokeOpacity={isFaded ? 0.05 : 0.2}
                                                strokeDasharray="3 3"
                                                label={{
                                                    position: 'insideBottomRight',
                                                    value: `End ${range.level}`,
                                                    fill: '#e11d48',
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    opacity: isFaded ? 0.1 : 0.6
                                                }}
                                            />
                                        </React.Fragment>
                                    );
                                })}

                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />

                                <Line
                                    type="monotone"
                                    dataKey="elo"
                                    stroke="#7FA88F"
                                    strokeWidth={3}
                                    dot={<CustomDot />}
                                    label={<CustomLabel />}
                                    activeDot={{ r: 7, strokeWidth: 0, fill: "#7FA88F" }}
                                    animationDuration={800}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-[#39434D]/80">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-[#059669] bg-white"></div>
                    <span>Jawaban Benar</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-[#e11d48] bg-white"></div>
                    <span>Jawaban Salah</span>
                </div>
            </div>
        </div>
    );
};