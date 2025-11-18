type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const envLevel = (process.env.LOG_LEVEL as Level) || "info";

function shouldLog(level: Level) {
    return levelOrder[level] >= levelOrder[envLevel];
}

function format(level: Level, msg: string) {
    const ts = new Date().toISOString();
    return `[${ts}] ${level.toUpperCase()}: ${msg}`;
}

export const logger = {
    debug: (msg: string) => { if (shouldLog("debug")) console.log(format("debug", msg)); },
    info: (msg: string) => { if (shouldLog("info")) console.log(format("info", msg)); },
    warn: (msg: string) => { if (shouldLog("warn")) console.warn(format("warn", msg)); },
    error: (msg: string) => { if (shouldLog("error")) console.error(format("error", msg)); }
};
