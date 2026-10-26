export const calculateQElo = (bloomLevel: string, difficulty: number): number => {
    const bloomFloors: Record<string, number> = {
        "C1": 760, "C2": 920, "C3": 1080, "C4": 1240, "C5": 1400, "C6": 1560
    };
    const baseFloor = bloomFloors[bloomLevel?.toUpperCase()] || 760;
    return baseFloor + (difficulty * 40);
};