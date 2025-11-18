import axios, { AxiosInstance } from "axios";
import { logger } from "../../core/logger.js";

export type NcmSong = { id: string; name: string; artists: string[]; duration?: number; url?: string };

export class NCMAdapter {
    api: string;
    private client: AxiosInstance;
    private urlCache = new Map<string, string>();

    constructor(api: string, timeout = 8000) {
        this.api = api;
        this.client = axios.create({ baseURL: api, timeout });
    }

    async search(keyword: string): Promise<NcmSong[]> {
        try {
            const { data } = await this.client.get("/search", { params: { keywords: keyword } });
            const songs = data?.result?.songs || [];
            return songs.map((s: any) => ({
                id: String(s.id),
                name: s.name,
                artists: (s.ar || []).map((a: any) => a.name),
                duration: s.dt
            }));
        } catch (err: any) {
            logger.error(`NCM 搜索失败: ${err.message || err}`);
            throw new Error("搜索失败或 API 不可用");
        }
    }

    async getSongUrl(id: string) {
        if (this.urlCache.has(id)) return this.urlCache.get(id);
        try {
            const { data } = await this.client.get("/song/url", { params: { id } });
            const song = data?.data?.[0];
            if (!song || !song.url) {
                throw new Error("无法获取播放链接，可能无版权或链接失效");
            }
            this.urlCache.set(id, song.url);
            return song.url as string;
        } catch (err: any) {
            logger.error(`获取歌曲链接失败: ${err.message || err}`);
            throw new Error("歌曲链接不可用");
        }
    }

    async getSongDetail(id: string): Promise<NcmSong | null> {
        try {
            const { data } = await this.client.get("/song/detail", { params: { ids: id } });
            const song = data?.songs?.[0];
            if (!song) return null;
            return {
                id: String(song.id),
                name: song.name,
                artists: (song.ar || []).map((a: any) => a.name),
                duration: song.dt
            };
        } catch (err: any) {
            logger.error(`获取歌曲详情失败: ${err.message || err}`);
            return null;
        }
    }
}
