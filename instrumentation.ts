export async function register() {
    console.log("🚀 instrumentation registered");

    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startLLMWorker } = await import("./src/lib/llm-worker");
        startLLMWorker();
    }
}