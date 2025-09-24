import { Database } from "bun:sqlite";
import { DatabaseUser, GameMode } from "../types/osu";

const db = new Database("database.db");

// Initialize database tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        discord_id TEXT PRIMARY KEY,
        osu_id INTEGER NOT NULL,
        osu_username TEXT NOT NULL,
        mode TEXT NOT NULL DEFAULT 'osu',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

export class DatabaseManager {
    static getUser(discordId: string): DatabaseUser | null {
        const query = db.prepare("SELECT * FROM users WHERE discord_id = ?");
        return query.get(discordId) as DatabaseUser | null;
    }

    static setUser(discordId: string, osuId: number, osuUsername: string, mode: GameMode = "osu"): void {
        const query = db.prepare(`
            INSERT OR REPLACE INTO users (discord_id, osu_id, osu_username, mode, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        query.run(discordId, osuId, osuUsername, mode);
    }

    static updateUserMode(discordId: string, mode: GameMode): boolean {
        const query = db.prepare("UPDATE users SET mode = ? WHERE discord_id = ?");
        const result = query.run(mode, discordId);
        return result.changes > 0;
    }

    static deleteUser(discordId: string): boolean {
        const query = db.prepare("DELETE FROM users WHERE discord_id = ?");
        const result = query.run(discordId);
        return result.changes > 0;
    }

    static getAllUsers(): DatabaseUser[] {
        const query = db.prepare("SELECT * FROM users");
        return query.all() as DatabaseUser[];
    }

    static getUserCount(): number {
        const query = db.prepare("SELECT COUNT(*) as count FROM users");
        const result = query.get() as { count: number };
        return result.count;
    }
}

export default db;
