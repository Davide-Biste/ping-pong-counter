import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Zap, Skull, Swords, Repeat, Infinity, ArrowLeftRight, Move } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Helper per assegnare icone e colori in base al nome (visto che non sono nel DB)
const getModeTheme = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes('blitz') || n.includes('speed') || n.includes('turbo'))
        return { icon: Zap, color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', glow: 'shadow-yellow-500/20' };
    if (n.includes('tourn') || n.includes('rank') || n.includes('champ'))
        return { icon: Trophy, color: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' };
    if (n.includes('death') || n.includes('hard') || n.includes('killer'))
        return { icon: Skull, color: 'text-red-500', border: 'border-red-500/50', bg: 'bg-red-500/10', glow: 'shadow-red-500/20' };
    if (n.includes('endless') || n.includes('inf'))
        return { icon: Infinity, color: 'text-pink-400', border: 'border-pink-500/50', bg: 'bg-pink-500/10', glow: 'shadow-pink-500/20' };

    // Default / Standard
    return { icon: Swords, color: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' };
};

const GameModeCarousel = ({ modes, selectedId, onSelect }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Sincronizza l'indice interno se cambia la selezione esterna
    useEffect(() => {
        if (modes.length > 0 && selectedId) {
            const idx = modes.findIndex(m => m._id === selectedId);
            if (idx !== -1) setCurrentIndex(idx);
        }
    }, [selectedId, modes]);

    const handleNext = () => {
        const next = (currentIndex + 1) % modes.length;
        setCurrentIndex(next);
        onSelect(modes[next]._id);
    };

    const handlePrev = () => {
        const prev = (currentIndex - 1 + modes.length) % modes.length;
        setCurrentIndex(prev);
        onSelect(modes[prev]._id);
    };

    if (!modes || modes.length === 0) return null;

    const currentMode = modes[currentIndex];
    const theme = getModeTheme(currentMode.name);
    const Icon = theme.icon;

    return (
        <div className="w-full relative py-8 group/carousel">

            {/* Navigation Buttons (Floating) */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    className="h-12 w-12 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white backdrop-blur-sm"
                >
                    <ChevronLeft size={24} />
                </Button>
            </div>

            <div className="absolute top-1/2 -translate-y-1/2 right-0 z-20">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="h-12 w-12 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 hover:scale-110 transition-all text-white backdrop-blur-sm"
                >
                    <ChevronRight size={24} />
                </Button>
            </div>

            {/* Main Card Display */}
            <div className="flex justify-center items-center perspective-[1000px]">

                {/* Background Decor Layer (Previous/Next hints) */}
                <div className="absolute w-[90%] h-[80%] bg-neutral-900/50 rounded-3xl -z-10 scale-90 opacity-40 blur-sm translate-y-4" />

                {/* Active Card */}
                <div className={cn(
                    "relative w-full max-w-md bg-[#0a0a0a] border rounded-3xl p-6 md:p-8 flex flex-col items-center text-center transition-all duration-500 transform",
                    theme.border,
                    theme.glow,
                    "shadow-2xl"
                )}>
                    {/* Glowing Background Blob */}
                    <div className={cn("absolute top-0 inset-x-0 h-32 opacity-20 blur-3xl rounded-full -translate-y-1/2", theme.bg.replace('bg-', 'bg-'))} />

                    {/* Header: Icon & Name */}
                    <div className="relative z-10 space-y-4 mb-6">
                        <div className={cn(
                            "mx-auto w-20 h-20 rounded-2xl flex items-center justify-center border-2 bg-black/50 shadow-lg backdrop-blur-md transform transition-transform duration-500 group-hover/carousel:scale-110 group-hover/carousel:rotate-3",
                            theme.border,
                            theme.color
                        )}>
                            <Icon size={40} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                                {currentMode.name}
                            </h3>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border bg-black/50", theme.border, theme.color)}>
                                    {currentMode.pointsToWin} Points
                                </span>
                                {currentMode.isDeuceEnabled && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-neutral-700 text-neutral-400 bg-neutral-900">
                                        Deuce ON
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description & Rules */}
                    <div className={cn(
                        "relative z-10 w-full bg-neutral-900/50 rounded-xl p-4 border transition-all duration-300",
                        theme.border.replace('50', '20')
                    )}>
                        <p className="text-sm text-neutral-400 leading-relaxed font-medium mb-6">
                            {currentMode.rulesDescription || "Standard table tennis rules apply. Serve changes every 2 points. Fight for glory!"}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-white/5">
                                <div className={cn("p-2 rounded-md bg-white/5", theme.color)}>
                                    <Repeat size={16} />
                                </div>
                                <div className="text-left">
                                    <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Switch</div>
                                    <div className="text-neutral-200 font-mono text-xs">Every {currentMode.servesBeforeChange} pts</div>
                                </div>
                            </div>

                            {currentMode.isDeuceEnabled && (
                                <div className="flex items-center gap-3 bg-black/40 rounded-lg p-3 border border-white/5">
                                    <div className={cn("p-2 rounded-md bg-white/5", theme.color)}>
                                        <Infinity size={16} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Deuce</div>
                                        <div className="text-neutral-200 font-mono text-xs">Every {currentMode.servesInDeuce || 1} pts</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex gap-2 mt-6">
                        {modes.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all duration-300",
                                    idx === currentIndex ? cn("w-6", theme.color.replace('text-', 'bg-')) : "bg-neutral-800"
                                )}
                            />
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default GameModeCarousel;
