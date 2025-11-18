import fs from "fs";
import yaml from "js-yaml";

export function loadConfig(path: string) {
    return yaml.load(fs.readFileSync(`config/${path}`, "utf8"));
}

export const loadTSConfig = () => loadConfig("teamspeak.yaml");
export const loadModuleConfig = () => loadConfig("modules.yaml").modules;