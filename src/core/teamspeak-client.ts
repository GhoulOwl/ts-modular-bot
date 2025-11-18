import { TeamSpeak, QueryProtocol } from "ts3-nodejs-library";
import { loadTSConfig } from "./config.js";
import { logger } from "./logger.js";

export class TeamSpeakClient {
    client!: TeamSpeak;

    async connect() {
        const cfg = loadTSConfig();
        logger.info("连接 TeamSpeak…");
        this.client = await TeamSpeak.connect({
            host: cfg.host,
            protocol: QueryProtocol.RAW,
            queryport: cfg.query_port,
            serverport: cfg.server_port,
            username: cfg.username,
            password: cfg.password
        });
        logger.info("TeamSpeak 连接成功");
        await this.client.clientUpdate({ clientNickname: cfg.nickname });
    }
}