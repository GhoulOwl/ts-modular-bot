import { EventEmitter } from "events";
import { TeamSpeak, QueryProtocol } from "ts3-nodejs-library";
import { loadTSConfig } from "./config.js";
import { logger } from "./logger.js";

export class TeamSpeakClient extends EventEmitter {
    client?: TeamSpeak;
    private keepaliveTimer?: NodeJS.Timeout;
    private reconnectTimer?: NodeJS.Timeout;
    private isConnecting = false;

    constructor() {
        super();
    }

    async connect() {
        if (this.isConnecting) return;
        const cfg = loadTSConfig();
        logger.info("连接 TeamSpeak…");
        this.isConnecting = true;
        try {
            this.client = await TeamSpeak.connect({
                host: cfg.host,
                protocol: QueryProtocol.RAW,
                queryport: cfg.query_port,
                serverport: cfg.server_port,
                username: cfg.username,
                password: cfg.password,
                keepAlive: true
            });
            logger.info("TeamSpeak 连接成功");
            await this.client.clientUpdate({ clientNickname: cfg.nickname });
            await this.registerTextEvents();
            this.registerListeners();
            this.startKeepAlive();
        } catch (err: any) {
            const reason = err?.message || err;
            logger.error(`TeamSpeak 连接失败: ${reason}`);
            this.scheduleReconnect(reason);
        } finally {
            this.isConnecting = false;
        }
    }

    private registerListeners() {
        if (!this.client) return;
        const client: any = this.client;
        client.on("textmessage", (e: any) => this.emit("textmessage", e));
        client.on("close", (e?: string) => {
            logger.warn(`TeamSpeak 连接关闭: ${e || "unknown"}`);
            this.scheduleReconnect(e);
        });
        client.on("error", (e: any) => {
            logger.error(`TeamSpeak 错误: ${e}`);
            this.scheduleReconnect(e);
        });
    }

    private async registerTextEvents() {
        if (!this.client) return;
        try {
            await this.client.registerEvent("textserver");
            await this.client.registerEvent("textchannel");
            await this.client.registerEvent("textprivate");
        } catch (err: any) {
            logger.warn(`注册文本事件失败: ${err.message || err}`);
        }
    }

    private startKeepAlive() {
        if (!this.client) return;
        if (this.keepaliveTimer) clearInterval(this.keepaliveTimer);
        this.keepaliveTimer = setInterval(async () => {
            try {
                await this.client?.whoami();
                logger.debug("发送 keepalive");
            } catch (err: any) {
                logger.warn(`keepalive 失败: ${err.message || err}`);
                this.scheduleReconnect();
            }
        }, 20000);
    }

    private scheduleReconnect(reason?: any) {
        if (this.reconnectTimer) return;
        if (this.keepaliveTimer) {
            clearInterval(this.keepaliveTimer);
            this.keepaliveTimer = undefined;
        }
        let delay = 3000;
        const msg = typeof reason === "string" ? reason : `${reason ?? ""}`;
        const banMatch = msg.match(/retry in (\d+) seconds/i);
        if (banMatch?.[1]) {
            delay = (Number(banMatch[1]) + 2) * 1000;
        }
        logger.info(`${Math.round(delay / 1000)}s 后尝试重连…`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            this.connect();
        }, delay);
    }

    onTextMessage(handler: (event: any) => void) {
        this.on("textmessage", handler);
    }

    async respond(event: any, message: string) {
        if (!this.client) throw new Error("TeamSpeak 未连接");
        const targetmode = event.targetmode ?? 1;
        let target: any;
        const invoker = event.invokerid ?? event.clid ?? event.clientId;
        switch (targetmode) {
        case 1: // client
            target = invoker ?? event.target;
            break;
        case 2: // channel
            target = event.target ?? event.ctid ?? event.channelid ?? event.channelId ?? invoker;
            break;
        case 3: // server
            target = "0";
            break;
        default:
            target = event.target ?? invoker ?? 0;
        }
        if (target === undefined || target === null) throw new Error("缺少响应目标");
        const client: any = this.client;
        await client.sendTextMessage(targetmode as any, target, message);
    }

    async sendToChannel(channelId: number, message: string) {
        if (!this.client) throw new Error("TeamSpeak 未连接");
        const client: any = this.client;
        await client.sendTextMessage(2 as any, channelId, message);
    }
}
