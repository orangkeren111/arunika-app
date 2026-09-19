let started = false;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function startLLMWorker() {
    if (started) return;
    started = true;

    console.log("[LLM Worker] Started");

    void workerLoop();
}

async function workerLoop() {
    while (true) {
        try {
            await fetch(`${baseUrl}/api/llm/worker`, {
                method: "POST",
            });
        } catch (error) {
            console.error("[LLM Worker]", error);
        }

        await new Promise((resolve) => setTimeout(resolve, 60_000));
    }
}