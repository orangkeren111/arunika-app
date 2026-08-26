import { NextRequest, NextResponse } from "next/server";
import { enqueueStudentReport } from "@/src/lib/services/report/generator";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const sesiId = formData.get("sesiId") as string;

        if (!sesiId) {
            return NextResponse.json({ error: "No sesiId provided" }, { status: 400 });
        }

        const parsedSesiId = parseInt(sesiId);
        if (isNaN(parsedSesiId)) {
            return NextResponse.json(
                { error: "Invalid sesiId (must be a number)" },
                { status: 400 },
            );
        }

        await enqueueStudentReport(parsedSesiId);

        return NextResponse.json({
            status: "success",
            message: `Report generation queued for sesiId: ${parsedSesiId}`,
        });
    } catch (error) {
        console.error("Error in /api/backtest:", error);
        return NextResponse.json(
            { error: "Failed to queue report generation" },
            { status: 500 },
        );
    }
}