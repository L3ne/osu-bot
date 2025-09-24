export interface OsuUser {
    id: number;
    username: string;
    avatar_url: string;
    country_code: string;
    cover_url: string;
    discord?: string;
    is_online: boolean;
    pm_friends_only: boolean;
    profile_colour?: string;
    statistics?: UserStatistics;
}

export interface UserStatistics {
    level: {
        current: number;
        progress: number;
    };
    global_rank?: number;
    country_rank?: number;
    pp: number;
    hit_accuracy: number;
    play_count: number;
    play_time: number;
    total_score: number;
    total_hits: number;
    maximum_combo: number;
    replays_watched_by_others: number;
    is_ranked: boolean;
    grade_counts: {
        ss: number;
        ssh: number;
        s: number;
        sh: number;
        a: number;
    };
}

export interface OsuBeatmap {
    id: number;
    mode: string;
    difficulty_rating: number;
    version: string;
    total_length: number;
    hit_length: number;
    bpm: number;
    cs: number;
    drain: number;
    accuracy: number;
    ar: number;
    playcount: number;
    passcount: number;
    count_circles: number;
    count_sliders: number;
    count_spinners: number;
    beatmapset_id: number;
    beatmapset?: OsuBeatmapset;
}

export interface OsuBeatmapset {
    id: number;
    title: string;
    artist: string;
    creator: string;
    status: string;
    covers: {
        cover: string;
        "cover@2x": string;
        card: string;
        "card@2x": string;
        list: string;
        "list@2x": string;
        slimcover: string;
        "slimcover@2x": string;
    };
    preview_url: string;
    tags: string;
    source: string;
    genre: {
        id: number;
        name: string;
    };
    language: {
        id: number;
        name: string;
    };
    ranked_date?: string;
    submitted_date: string;
}

export interface OsuScore {
    id: number;
    best_id?: number;
    user_id: number;
    accuracy: number;
    mods: string[];
    score: number;
    max_combo: number;
    perfect: boolean;
    statistics: {
        count_50: number;
        count_100: number;
        count_300: number;
        count_geki: number;
        count_katu: number;
        count_miss: number;
    };
    passed: boolean;
    pp?: number;
    rank: string;
    created_at: string;
    mode: string;
    mode_int: number;
    replay: boolean;
    beatmap?: OsuBeatmap;
    beatmapset?: OsuBeatmapset;
    user?: OsuUser;
    weight?: {
        percentage: number;
        pp: number;
    };
}

export type GameMode = "osu" | "taiko" | "fruits" | "mania";
export type ScoreType = "best" | "recent" | "firsts";

export interface DatabaseUser {
    discord_id: string;
    osu_id: number;
    osu_username: string;
    mode: GameMode;
    created_at: string;
}
