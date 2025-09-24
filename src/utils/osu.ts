import { Client } from "osu-web.js";
import { GameMode } from "../types/osu";

type ScoreType = "best" | "recent" | "firsts";

class OsuAPI {
    private client: Client;

    constructor() {
        this.client = new Client({
            id: Number(process.env.OSU_CLIENT_ID),
            secret: process.env.OSU_CLIENT_SECRET!
        });
    }

    async getUser(identifier: string | number, mode?: string): Promise<any> {
        try {
            const user = await this.client.users.getUser(identifier, {
                key: typeof identifier === 'string' ? 'username' : 'id',
                mode: mode
            });
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    async getUserScores(userId: number, type: ScoreType, mode?: string, limit: number = 5): Promise<any[]> {
        try {
            const scores = await this.client.users.getUserScores(userId, type, {
                mode: mode,
                limit: limit,
                include_fails: type === 'recent'
            });
            return scores || [];
        } catch (error) {
            console.error('Error fetching user scores:', error);
            return [];
        }
    }

    async getBeatmap(beatmapId: number): Promise<any> {
        try {
            const beatmap = await this.client.beatmaps.getBeatmap(beatmapId);
            return beatmap;
        } catch (error) {
            console.error('Error fetching beatmap:', error);
            return null;
        }
    }

    async searchBeatmaps(query: string, mode?: GameMode, limit: number = 5): Promise<any[]> {
        try {
            const result = await this.client.beatmapsets.search({
                q: query,
                m: mode ? this.getModeInt(mode) : undefined,
                s: 'any'
            });
            return result.beatmapsets?.slice(0, limit) || [];
        } catch (error) {
            console.error('Error searching beatmaps:', error);
            return [];
        }
    }

    async getBeatmapScores(beatmapId: number, mode?: string, limit: number = 50): Promise<any[]> {
        try {
            const scores = await this.client.beatmaps.getBeatmapScores(beatmapId, {
                mode: mode,
                limit: limit
            });
            return scores || [];
        } catch (error) {
            console.error('Error fetching beatmap scores:', error);
            return [];
        }
    }

    private getModeInt(mode: GameMode): number {
        switch (mode) {
            case "osu": return 0;
            case "taiko": return 1;
            case "fruits": return 2;
            case "mania": return 3;
            default: return 0;
        }
    }

    getModeString(modeInt: number): GameMode {
        switch (modeInt) {
            case 0: return "osu";
            case 1: return "taiko";
            case 2: return "fruits";
            case 3: return "mania";
            default: return "osu";
        }
    }

    formatMods(mods: string[] | undefined): string {
        return mods && mods.length > 0 ? `+${mods.join('')}` : 'No Mod';
    }

    formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    formatNumber(num: number | undefined): string {
        return num?.toLocaleString() || '0';
    }

    formatAccuracy(accuracy: number): string {
        return `${(accuracy * 100).toFixed(2)}%`;
    }

    getRankEmoji(rank: string): string {
        return rank;
    }

    getModeEmoji(mode: GameMode): string {
        switch (mode) {
            case "osu": return "osu!";
            case "taiko": return "osu!taiko";
            case "fruits": return "osu!catch";
            case "mania": return "osu!mania";
            default: return "osu!";
        }
    }
}

export default new OsuAPI();
