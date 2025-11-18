import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import dotenv from "dotenv";

dotenv.config();

type PlainObject = Record<string, any>;

function coerceEnvValue(raw: string, current: unknown) {
    if (typeof current === "number") return Number(raw);
    if (typeof current === "boolean") return raw === "true" || raw === "1";
    return raw;
}

function applyEnvOverrides(obj: PlainObject, envPrefix: string, trail: string[] = []) {
    for (const key of Object.keys(obj)) {
        const nextTrail = [...trail, key];
        const envKey = `${envPrefix}_${nextTrail.map(k => k.toUpperCase()).join("_")}`;
        if (process.env[envKey] !== undefined) {
            obj[key] = coerceEnvValue(process.env[envKey] as string, obj[key]);
        } else if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            applyEnvOverrides(obj[key], envPrefix, nextTrail);
        }
    }
    return obj;
}

export function loadConfig<T = PlainObject>(file: string, envPrefix?: string): T {
    const raw = yaml.load(fs.readFileSync(path.join("config", file), "utf8")) as PlainObject;
    const prefix = envPrefix ?? path.basename(file, path.extname(file)).toUpperCase();
    return applyEnvOverrides(raw, prefix) as T;
}

export const loadTSConfig = () => loadConfig("teamspeak.yaml", "TS");
export const loadModuleConfig = () => (loadConfig("modules.yaml").modules);
export const loadAppConfig = () => loadConfig("app.yaml", "APP");
export const loadMusicConfig = () => loadConfig("music.yaml", "MUSIC");
