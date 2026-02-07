import React, { useEffect, useState } from 'react';
import { userService } from '@/services/userService';
import { getIconComponent, getColorTheme } from '@/lib/gameConfig';
import { cn } from '@/lib/utils';
import { Trophy, Flame, Skull, Target, History, Swords } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PlayerProfileProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ userId, isOpen, onClose }) => {
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            loadData();
        }
    }, [isOpen, userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel fetch: User detail (from list or single fetch) + Stats
            // We can fetch all users to find this one, or add getUserById. 
            // For now, let's assume we can find user from stats if we had user object passed.
            // But stats returns user_id, not name/avatar.
            // So we need to fetch user separately.
            // Let's use userService.getAll() and find, or just fetch stats and rely on a passed prop?
            // Better: fetch stats, and maybe pass user object as prop?
            // But let's fetch stats.

            const [statsData, allUsers] = await Promise.all([
                userService.getUserStatistics(userId),
                userService.getAll()
            ]);

            setStats(statsData);
            setUser(allUsers.find((u: any) => u._id === userId));
        } catch (err) {
            console.error("Failed to load profile", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* @ts-ignore */}
            <DialogContent className="max-w-4xl bg-[#0a0a0a] text-white border-neutral-800 p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">

                {loading || !user || !stats ? (
                    <div className="h-96 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row min-h-[600px]">
                        {/* Sidebar / Identity Card */}
                        <div className={cn("w-full md:w-80 p-8 flex flex-col items-center border-r border-neutral-800 relative overflow-hidden", getColorTheme(user.color).bg)}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

                            <div className="relative z-10 flex flex-col items-center w-full">
                                {/* Avatar */}
                                <div className={cn("w-32 h-32 rounded-2xl border-4 shadow-2xl flex items-center justify-center mb-6 bg-black transform hover:scale-105 transition-transform duration-500", getColorTheme(user.color).border)}>
                                    {(() => {
                                        const Icon = getIconComponent(user.icon);
                                        return <Icon size={64} className={getColorTheme(user.color).text} strokeWidth={1.5} />;
                                    })()}
                                </div>

                                <h2 className="text-3xl font-black italic tracking-tighter text-center leading-none mb-2">{user.name}</h2>
                                <p className="text-sm font-mono uppercase tracking-widest text-neutral-400 font-bold mb-8">{user.funNickname || 'The Rookie'}</p>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                                        <div className="text-2xl font-bold">{stats.winRate > 0 ? (stats.winRate * 100).toFixed(0) : 0}%</div>
                                        <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Win Rate</div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                                        <div className="text-2xl font-bold">{stats.matchesPlayed}</div>
                                        <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Matches</div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center col-span-2 flex items-center justify-between px-6">
                                        <div className="text-left">
                                            <div className="text-xl font-bold text-yellow-500 flex items-center gap-2">
                                                <Trophy size={14} /> {stats.wins}
                                            </div>
                                            <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Victories</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-red-500 flex items-center gap-2 justify-end">
                                                {stats.losses} <Skull size={14} />
                                            </div>
                                            <div className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">Defeats</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Streak */}
                                <div className="w-full bg-gradient-to-r from-neutral-900 to-black p-4 rounded-xl border border-neutral-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg bg-neutral-800 group-hover:bg-orange-900/50 transition-colors", stats.currentStreak > 1 ? "text-orange-500" : "text-neutral-500")}>
                                            <Flame size={20} className={stats.currentStreak > 2 ? "animate-pulse" : ""} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-neutral-300">Streak</div>
                                            <div className="text-xs text-neutral-500 uppercase">Current Form</div>
                                        </div>
                                    </div>
                                    <div className="text-3xl font-black italic tracking-tighter">
                                        {stats.currentStreak}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content / Detailed Stats */}
                        <div className="flex-1 p-8 bg-neutral-950">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Target className="text-blue-500" /> PERFORMANCE ANALYSIS
                            </h3>

                            {/* Mode Stats */}
                            <div className="grid grid-cols-1 gap-4 mb-8">
                                {stats.modeStats.map((mode: any) => (
                                    <div key={mode.modeName} className="relative group">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-bold text-neutral-300">{mode.modeName}</span>
                                            <span className="text-xs font-mono text-neutral-500">
                                                {mode.wins}W - {mode.losses}L ({mode.winRate > 0 ? (mode.winRate * 100).toFixed(0) : 0}%)
                                            </span>
                                        </div>
                                        <div className="h-3 w-full bg-neutral-900 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-1000 ease-out rounded-full", getColorTheme(user.color).bg)}
                                                style={{ width: `${mode.winRate * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Nemesis & Victim */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Swords size={12} className="text-red-500" /> Nemesis
                                    </div>
                                    {stats.nemesis ? (
                                        <div>
                                            <div className="text-xl font-bold text-white truncate">{stats.nemesis.opponentName}</div>
                                            <div className="text-xs text-red-400 mt-1">Has defeated you {stats.nemesis.count} times</div>
                                        </div>
                                    ) : (
                                        <div className="text-neutral-600 text-sm">No worthy opponent yet</div>
                                    )}
                                </div>

                                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
                                    <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Target size={12} className="text-green-500" /> Favorite Target
                                    </div>
                                    {stats.victim ? (
                                        <div>
                                            <div className="text-xl font-bold text-white truncate">{stats.victim.opponentName}</div>
                                            <div className="text-xs text-green-400 mt-1">Defeated {stats.victim.count} times</div>
                                        </div>
                                    ) : (
                                        <div className="text-neutral-600 text-sm">No easy wins yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Recent History */}
                            <div>
                                <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <History size={14} /> Recent Battle Log
                                </h3>
                                <div className="space-y-2">
                                    {stats.recentMatches.length === 0 ? (
                                        <div className="text-neutral-600 italic text-sm">No battles recorded.</div>
                                    ) : (
                                        stats.recentMatches.map((match: any) => (
                                            <div key={match.matchId} className="flex items-center justify-between p-3 bg-neutral-900/30 rounded-lg border border-neutral-800 hover:bg-neutral-900/80 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-2 h-8 rounded-full",
                                                        match.result === 'Win' ? "bg-green-500" : "bg-red-500"
                                                    )} />
                                                    <div>
                                                        <div className="font-bold text-sm text-neutral-200">vs {match.opponentName}</div>
                                                        <div className="text-[10px] text-neutral-500 uppercase">{match.modeName}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={cn("font-mono font-bold text-sm", match.result === 'Win' ? "text-green-400" : "text-red-400")}>
                                                        {match.scoreUser} - {match.scoreOpponent}
                                                    </div>
                                                    <div className="text-[10px] text-neutral-600">
                                                        {new Date(match.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PlayerProfile;
