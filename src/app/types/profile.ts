export type ProfileData = {
    id: number;
    name: string;
    email: string;
    role: string;
    schoolName: string | null;
};

export type ProfileStatistics = {
    totalExams: number;
    completedExams: number;
    gradedExams: number;
    averageScore: number;
};