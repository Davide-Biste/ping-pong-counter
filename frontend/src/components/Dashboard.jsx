import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Users } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-purple-500/30">

            {/* Background Ambient Glows - Static but deep */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] opacity-40" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] opacity-40" />
                {/* Subtle Grain Texture overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            <div className="z-10 flex flex-col items-center w-full max-w-md px-6 animate-in fade-in zoom-in duration-700">

                {/* Main Title Area */}
                <div className="mb-12 text-center space-y-2">
                    <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-neutral-200 to-neutral-500 drop-shadow-2xl">
                        PING PONG<br />
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">ARENA</span>
                    </h1>
                </div>

                {/* Main Card */}
                <div className="w-full bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl relative group">
                    {/* Glowing border effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl -z-10" />

                    <div className="bg-[#111] rounded-[22px] p-8 flex flex-col items-center gap-8 relative overflow-hidden">

                        {/* Header text */}
                        <div className="text-center space-y-1">
                            <h2 className="text-2xl font-medium text-white tracking-tight">Ready to Fight?</h2>
                            <p className="text-neutral-500 text-sm">Select players, configure rules, and destroy your friends.</p>
                        </div>

                        {/* BIG START BUTTON */}
                        <button
                            onClick={() => navigate('/setup')}
                            className="relative w-full group overflow-hidden rounded-xl bg-blue-600 p-px shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all duration-300 hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.7)] hover:scale-[1.02]"
                        >
                            <span className="absolute inset-0 overflow-hidden rounded-xl">
                                <span className="absolute inset-0 rounded-xl bg-[image:radial-gradient(75%_100%_at_50%_0%,rgba(56,189,248,0.6)_0%,rgba(56,189,248,0)_75%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </span>
                            <div className="relative flex h-16 items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 px-8 transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-600">
                                <Play className="w-6 h-6 fill-white text-white" />
                                <span className="text-xl font-bold tracking-wide">START MATCH</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Footer Links / Fun stats */}
                <div className="mt-12 flex gap-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => navigate('/hall-of-fame')}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-full text-xs font-mono text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                        <Trophy size={12} className="text-yellow-500" />
                        HALL OF FAME
                    </button>
                    <button
                        onClick={() => navigate('/players')}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border border-neutral-800 rounded-full text-xs font-mono text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                        <Users size={12} className="text-blue-500" />
                        MANAGE PLAYERS
                    </button>
                </div>

                {/* Version Tag */}
                <div className="absolute bottom-4 text-[10px] text-neutral-800 font-mono select-none">
                    v2.0 // PRIVATE BUILD
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
