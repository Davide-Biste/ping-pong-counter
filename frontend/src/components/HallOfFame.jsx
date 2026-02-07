import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Crown, ArrowLeft, Skull, Swords, Percent } from 'lucide-react';
import { userService } from '../services/userService';
import CountUp from './react-bits/CountUp.tsx';
import { getIconComponent } from "@/lib/gameConfig.ts";
import PlayerProfile from './PlayerProfile';


const HallOfFame = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState(null);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const data = await userService.getAll();
                const sorted = data.sort((a, b) => b.wins - a.wins);
                setUsers(sorted);
            } catch (err) {
                console.error("Failed to load users", err);
            } finally {
                setLoading(false);
            }
        };
        loadUsers();
    }, []);

    const getRankStyle = (index) => {
        switch (index) {
            case 0: return "border-yellow-500/50 bg-yellow-950/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]";
            case 1: return "border-slate-400/50 bg-slate-900/40 shadow-[0_0_20px_rgba(148,163,184,0.2)]";
            case 2: return "border-amber-700/50 bg-orange-950/20 shadow-[0_0_20px_rgba(180,83,9,0.2)]";
            default: return "border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800/60";
        }
    };

    const RankBadge = ({ index }) => {
        if (index === 0) return <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black px-4 py-1 rounded-full text-xs shadow-lg uppercase tracking-widest flex items-center gap-2"><Crown size={14} /> Champion</div>;
        if (index === 1) return <div className="absolute -top-4 -left-4 bg-slate-300 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900">2</div>;
        if (index === 2) return <div className="absolute -top-4 -left-4 bg-amber-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-neutral-900">3</div>;
        return <div className="font-mono text-neutral-600 font-bold text-xl w-8 text-center">#{index + 1}</div>;
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 flex flex-col items-center font-sans selection:bg-yellow-500/30">

            {/* Header */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-12 animate-in slide-in-from-top-4 duration-500">
                <button
                    onClick={() => navigate('/')}
                    className="p-3 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-600 drop-shadow-sm">
                        HALL OF FAME
                    </h1>
                    <p className="text-neutral-500 font-mono text-xs uppercase tracking-[0.3em] mt-2">
                        Legends never die
                    </p>
                </div>

                <div className="w-12" /> {/* Spacer for centering */}
            </div>

            {/* List */}
            <div className="w-full max-w-3xl space-y-4 pb-20">
                {users.map((user, index) => {
                    const winRate = user.matchesPlayed > 0 ? Math.round((user.wins / user?.matchesPlayed) * 100) : 0;

                    return (
                        <div
                            key={user._id}
                            onClick={() => setSelectedUserId(user._id)}
                            className={`relative group rounded-2xl border p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 transition-all duration-300 hover:scale-[1.01] cursor-pointer animate-in slide-in-from-bottom-4
                                ${getRankStyle(index)}
                            `}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <RankBadge index={index} />

                            {/* Avatar / Name Section */}
                            <div className="flex-1 flex flex-col md:flex-row items-center md:items-start gap-4 text-center md:text-left z-10">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-black border border-white/10 flex items-center justify-center shadow-inner
                                    ${index === 0 ? 'ring-2 ring-yellow-500/50' : ''}
                                `}>
                                    {(() => {
                                        const Icon = getIconComponent(user.icon);
                                        return <Icon className="text-neutral-400" size={32} />;
                                    })()}
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-black tracking-tight ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 font-medium italic">"{user.funNickname || 'The Unknown'}"</p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="flex items-center gap-2 md:gap-8 w-full md:w-auto justify-between md:justify-end bg-black/20 p-4 rounded-xl border border-white/5">
                                {/* Wins */}
                                <div className="text-center px-2 md:px-4 border-r border-white/5 last:border-0">
                                    <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                                        <Trophy size={14} />
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-white leading-none">
                                        <CountUp to={user.wins} />
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-black uppercase tracking-wider mt-1">Wins</div>
                                </div>

                                {/* Total Games */}
                                <div className="text-center px-2 md:px-4 border-r border-white/5 last:border-0">
                                    <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                                        <Swords size={14} />
                                    </div>
                                    <div className="text-2xl font-mono font-bold text-neutral-300 leading-none">
                                        {user.matchesPlayed || 0}
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-black uppercase tracking-wider mt-1">Matches</div>
                                </div>

                                {/* Win Rate */}
                                <div className="text-center px-2 md:px-4">
                                    <div className="flex items-center justify-center gap-2 text-purple-500 mb-1">
                                        <Percent size={14} />
                                    </div>
                                    <div className={`text-2xl font-mono font-bold leading-none ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                        {winRate}%
                                    </div>
                                    <div className="text-[10px] text-neutral-600 font-black uppercase tracking-wider mt-1">Win Rate</div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {users.length === 0 && !loading && (
                    <div className="text-center py-20 opacity-50">
                        <Skull size={48} className="mx-auto mb-4 text-neutral-600" />
                        <p className="text-xl font-bold text-neutral-500">No warriors found.</p>
                        <p className="text-sm text-neutral-600">Be the first to enter the arena.</p>
                    </div>
                )}
            </div>

            {selectedUserId && (
                <PlayerProfile
                    userId={selectedUserId}
                    isOpen={!!selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    );
};

export default HallOfFame;
