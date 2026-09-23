let started = false;
const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function startLLMWorker() {
    console.log("========================================");
    console.log("[LLM Worker] startLLMWorker() called");
    console.log("[LLM Worker] started:", started);
    console.log("[LLM Worker] baseUrl:", baseUrl);
    console.log("========================================");

    if (started) {
        console.log("[LLM Worker] Already started, skipping.");
        return;
    }

    started = true;

    console.log("[LLM Worker] Worker started successfully.");

    void workerLoop();
}
async function workerLoop() {
    console.log("[LLM Worker] workerLoop() entered.");

    while (true) {
        const startedAt = new Date().toISOString();

        console.log(
            `[LLM Worker] ${startedAt} Sending request to ${baseUrl}/api/llm/worker`
        );

        try {
            const response = await fetch(`${baseUrl}/api/llm/worker`, {
                method: "POST",
            });

            const body = await response.text();

            console.log("[LLM Worker] Request completed");
            console.log("[LLM Worker] Status:", response.status);
            console.log("[LLM Worker] OK:", response.ok);
            console.log("[LLM Worker] Response:", body);
        } catch (error) {
            console.error("[LLM Worker] Request FAILED");
            console.error("[LLM Worker] Error:", error);
        }

        console.log("[LLM Worker] Sleeping for 60 seconds...");

        await new Promise((resolve) => setTimeout(resolve, 60_000));

        console.log("[LLM Worker] Waking up...");
    }
}