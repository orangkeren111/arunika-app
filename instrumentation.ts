export async function register() {
    console.log("========================================");
    console.log("🚀 [Instrumentation] register() called");
    console.log("[Instrumentation] NEXT_RUNTIME:", process.env.NEXT_RUNTIME);
    console.log("========================================");

    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[Instrumentation] Node.js runtime detected.");
        console.log("[Instrumentation] Importing LLM worker...");

        const { startLLMWorker } = await import("./src/lib/llm-worker");

        console.log("[Instrumentation] LLM worker imported.");
        console.log("[Instrumentation] Starting LLM worker...");

        startLLMWorker();

        console.log("[Instrumentation] startLLMWorker() returned.");
    } else {
        console.log(
            "[Instrumentation] NOT starting worker because runtime is:",
            process.env.NEXT_RUNTIME
        );
    }
}