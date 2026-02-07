import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button as ButtonOriginal } from "@/components/ui/button";
import { Trophy, RotateCcw, Home, Check, ArrowRightLeft } from "lucide-react";
import Counter from "@/components/react-bits/Counter";

// Bypass TS checks for JS components
const Button = ButtonOriginal as any;
import { matchService } from '@/services/matchService';
import { getColorTheme, getIconComponent } from "@/lib/gameConfig";
import { cn } from "@/lib/utils";

const GameScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rematchSwap, setRematchSwap] = useState(true);

    const fetchMatch = async () => {
        try {
            const data = await matchService.getMatch(id);
            setMatch(data);
        } catch (err) {
            console.error("Error fetching match", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMatch();
    }, [id]);

    const handlePoint = async (playerId: string) => {
        if (!match || match.status === 'finished') return;
        try {
            const updated = await matchService.addPoint(id, playerId);
            setMatch(updated);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUndo = async () => {
        try {
            const updated = await matchService.undoPoint(id);
            setMatch(updated);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSetFirstServer = async (playerId: string) => {
        try {
            const updated = await matchService.setFirstServer(id, playerId);
            setMatch(updated);
        } catch (err) {
            console.error(err);
        }
    }

    const handleRematch = async () => {
        if (!match) return;
        setIsLoading(true);
        try {
            // Logic to swap players if requested
            const p1 = rematchSwap ? match.player2._id : match.player1._id;
            const p2 = rematchSwap ? match.player1._id : match.player2._id;
            const p3 = (match.player3 && match.player4) ? (rematchSwap ? match.player4._id : match.player3._id) : null;
            const p4 = (match.player3 && match.player4) ? (rematchSwap ? match.player3._id : match.player4._id) : null;

            // Re-use existing settings
            const overrides = {
                serveType: match.matchRules?.serveType,
                servesInDeuce: match.matchRules?.servesInDeuce,
                player3Id: p3,
                player4Id: p4
            };

            const newMatch = await matchService.startMatch(p1, p2, match.gameMode.id || match.gameMode._id, overrides);
            setMatch(null); // Clear current match
            navigate(`/game/${newMatch._id}`);
            // Force reload via key or fetch is handled by useEffect on [id]
        } catch (e) {
            console.error("Rematch failed", e);
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="text-white text-center mt-20">Loading Arena...</div>;
    if (!match) return <div className="text-white text-center mt-20">Match not found</div>;

    const { player1, player2, player3, player4, score, gameMode, winner } = match;
    const isDoubles = !!player3 && !!player4;

    const totalPoints = score.p1 + score.p2;

    const p1Theme = getColorTheme(player1.color || 'blue');
    const p2Theme = getColorTheme(player2.color || 'red');
    const p3Theme = isDoubles ? getColorTheme(player3.color || 'blue') : p1Theme;
    const p4Theme = isDoubles ? getColorTheme(player4.color || 'red') : p2Theme;

    const P1Icon = getIconComponent(player1.icon);
    const P2Icon = getIconComponent(player2.icon);
    const P3Icon = isDoubles ? getIconComponent(player3.icon) : P1Icon;
    const P4Icon = isDoubles ? getIconComponent(player4.icon) : P2Icon;

    // Show Server Selection Modal if not set
    if (!match.firstServer && !winner && match.status === 'in_progress') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background similar to main screen but dimmed */}
                <div className={cn("absolute top-0 left-0 w-1/2 h-full opacity-10", p1Theme.bg)} />
                <div className={cn("absolute top-0 right-0 w-1/2 h-full opacity-10", p2Theme.bg)} />

                <div className="z-10 bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <h2 className="text-3xl font-bold mb-2">Who Starts?</h2>
                    <p className="text-neutral-400 mb-8">Select the player (or team) serving first.</p>

                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            // FIX: Aggiunto bg-neutral-950 per togliere il bianco, e text-white per il nome
                            // Rimosso hover:border-current per mantenere il colore del bordo specifico del player anche in hover
                            className={cn(
                                "h-32 flex flex-col gap-2 bg-neutral-950 hover:bg-neutral-800 border-2 transition-colors",
                                p1Theme.border
                            )}
                            onClick={() => handleSetFirstServer(player1._id)}
                        >
                            <P1Icon size={32} className={p1Theme.text} />
                            {/* Aggiunto colore testo esplicito o eredita dal container, ma meglio forzare per sicurezza */}
                            <span className="text-lg font-bold text-white">{player1.name}</span>
                            {isDoubles && <span className="text-xs text-neutral-500">+ {player3.name}</span>}
                        </Button>

                        <Button
                            variant="outline"
                            // FIX: Stesso fix per il secondo bottone
                            className={cn(
                                "h-32 flex flex-col gap-2 bg-neutral-950 hover:bg-neutral-800 border-2 transition-colors",
                                p2Theme.border
                            )}
                            onClick={() => handleSetFirstServer(player2._id)}
                        >
                            <P2Icon size={32} className={p2Theme.text} />
                            <span className="text-lg font-bold text-white">{player2.name}</span>
                            {isDoubles && <span className="text-xs text-neutral-500">+ {player4.name}</span>}
                        </Button>
                    </div>

                    <Button variant="ghost" className="mt-8 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800" onClick={() => navigate('/')}>
                        Cancel Match
                    </Button>
                </div>
            </div>
        )
    }

    // Determine Server
    let serverId;
    const { servesBeforeChange, pointsToWin } = gameMode;
    const matchRules = match.matchRules || {};
    const servesInDeuce = matchRules.servesInDeuce || 1;
    const isDeuce = score.p1 >= pointsToWin - 1 && score.p2 >= pointsToWin - 1;

    // Serving Sequence
    // Singles: [P1, P2] (or [P2, P1] if P2 started? No, normally P1, P2 if P1 starts)
    // Actually standard logic: Starter, Receiver.
    // Doubles: [P1, P2, P3, P4] assuming A, X, B, Y.
    // But who is A/X/B/Y depends on who starts.
    // Let's assume standard rotation array based on Starter.
    const starterId = match.firstServer || player1._id;

    // Construct rotation array. P3 is partner of P1. P4 partner of P2.
    // Order: Captain1 -> Captain2 -> Partner1 -> Partner2
    // If starter is P1: P1 -> P2 -> P3 -> P4.
    // If starter is P2: P2 -> P1 -> P4 -> P3.
    // If starter is P3: P3 -> P4 -> P1 -> P2.
    // If starter is P4: P4 -> P3 -> P2 -> P1.
    // We need to find the "Index 0" player.

    let rotationIds = [];
    if (isDoubles) {
        // Find which team starts
        const startTeam1 = starterId === player1._id || starterId === player3._id;
        if (startTeam1) {
            // Team 1 starts. A=Starter. 
            // Opponent X? P2 or P4. Let's assume P2 is "Primary Receiver".
            // A(Start) -> X(P2) -> B(Partner) -> Y(P4).
            const partner = starterId === player1._id ? player3._id : player1._id;
            rotationIds = [starterId, player2._id, partner, player4._id];
        } else {
            // Team 2 starts. A=Starter.
            const partner = starterId === player2._id ? player4._id : player2._id;
            rotationIds = [starterId, player1._id, partner, player3._id];
        }
    } else {
        const receiverId = starterId === player1._id ? player2._id : player1._id;
        rotationIds = [starterId, receiverId];
    }

    const pointsBeforeDeuce = (pointsToWin - 1) * 2;
    let turnIndex = 0;

    if (isDeuce) {
        const offset = totalPoints - pointsBeforeDeuce;
        if (offset >= 0) {
            turnIndex = Math.floor(offset / servesInDeuce);
        } else {
            // Edge case 
            turnIndex = Math.floor(totalPoints / servesBeforeChange);
        }
    } else {
        turnIndex = Math.floor(totalPoints / servesBeforeChange);
    }

    // In Deuce, we continue rotation but step 1 by 1 (or servesInDeuce).
    // The turnIndex represents "how many service turns have passed".
    // We map this to the rotation array.
    serverId = rotationIds[turnIndex % rotationIds.length];

    const handleExit = async () => {
        if (match && match.status === 'in_progress') {
            try {
                await matchService.cancelMatch(id);
            } catch (err) {
                console.error("Failed to cancel match", err);
            }
        }
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background effects */}
            <div className={cn(
                "absolute top-0 left-0 w-1/2 h-full transition-all duration-500 opacity-10",
                p1Theme.bg,
                (serverId === player1._id || (isDoubles && serverId === player3._id)) ? 'opacity-30' : ''
            )} />
            <div className={cn(
                "absolute top-0 right-0 w-1/2 h-full transition-all duration-500 opacity-10",
                p2Theme.bg,
                (serverId === player2._id || (isDoubles && serverId === player4._id)) ? 'opacity-30' : ''
            )} />

            {/* Header */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button variant="ghost" onClick={handleExit}>
                    <Home className="mr-2" /> Home
                </Button>
            </div>

            {/* Rule Indicators (Cross/Free) */}
            {matchRules.serveType && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", matchRules.serveType === 'cross' ? "bg-purple-500 shadow-[0_0_8px_#a855f7]" : "bg-white shadow-[0_0_8px_white]")} />
                        {matchRules.serveType} SERVE
                    </div>
                </div>
            )}

            <div className="mb-8 z-10 flex flex-col items-center gap-3">
                {/* TARGET SCORE BADGE */}
                <div className="relative group cursor-default">
                    {/* Glow Effect Background */}
                    <div className="absolute -inset-1 rounded-full blur opacity-25 transition duration-500"></div>

                    {/* Main Badge Content */}
                    <div className="relative flex items-center gap-2 px-6 py-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-xl">
                        <Trophy size={14} className="text-yellow-500" />
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest mr-2">Target</span>
                        <span className="text-xl font-black italic text-white tracking-tighter">
                            {gameMode.pointsToWin || 11} <span className="text-xs font-normal text-neutral-500 not-italic ml-0.5">PTS</span>
                        </span>
                    </div>
                </div>

                {/* DEUCE BADGE (Shows only if active) */}
                {match.isDeuce && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative px-4 py-1 bg-orange-500/10 border border-orange-500/50 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            <span className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">
                                DEUCE ACTIVE
                            </span>
                        </div>
                    </div>
                )}
            </div>


            {/* Scoreboard */}
            <div className="flex w-full max-w-6xl justify-between items-center z-10 gap-4 lg:gap-12">

                {/* TEAM 1 */}
                <div
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => handlePoint(player1._id)}
                >
                    {/* Serving Indicator Team 1 */}
                    <div className={`mb-4 text-xl font-bold flex items-center gap-2 ${(serverId === player1._id || (isDoubles && serverId === player3._id)) ? `animate-bounce ${p1Theme.text}` : 'text-neutral-500'}`}>
                        {(serverId === player1._id || (isDoubles && serverId === player3._id)) ? 'SERVING' : '\u00A0'}
                    </div>

                    {isDoubles ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            {/* Big Score */}
                            <div className={cn("text-9xl font-black tabular-nums tracking-tighter drop-shadow-2xl", p1Theme.text)}>
                                {score.p1}
                            </div>
                            {/* Players */}
                            <div className="flex gap-4">
                                <Card className={cn("relative w-32 h-40 bg-neutral-900/80 border-2 overflow-hidden flex flex-col items-center justify-end p-2 transition-all", serverId === player1._id ? "border-white scale-110 z-10 shadow-xl" : "border-white/10 opacity-80")}>
                                    <P1Icon className={cn("absolute opacity-20 w-32 h-32 -top-4 -left-4", p1Theme.text)} />
                                    <div className="z-10 text-center font-bold text-sm truncate w-full">{player1.name}</div>
                                </Card>
                                <Card className={cn("relative w-32 h-40 bg-neutral-900/80 border-2 overflow-hidden flex flex-col items-center justify-end p-2 transition-all", serverId === player3._id ? "border-white scale-110 z-10 shadow-xl" : "border-white/10 opacity-80")}>
                                    <P3Icon className={cn("absolute opacity-20 w-32 h-32 -top-4 -right-4", p3Theme.text)} />
                                    <div className="z-10 text-center font-bold text-sm truncate w-full">{player3.name}</div>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className={cn(
                            "w-full aspect-3/4 max-w-xs bg-neutral-900/80 backdrop-blur border-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 active:scale-95 group-hover:shadow-2xl",
                            p1Theme.border, p1Theme.shadow
                        )}>
                            <P1Icon className={cn("absolute opacity-10 w-64 h-64 -bottom-10 -left-10 rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110", p1Theme.text)} />
                            <div className="absolute font-bold text-white/90 user-select-none z-10">
                                <Counter
                                    value={score.p1}
                                    places={[10, 1]}
                                    fontSize={120}
                                    padding={0}
                                    gap={10}
                                    textColor="white"
                                    fontWeight={900}
                                    gradientHeight={0}
                                />
                            </div>
                            <div className="absolute bottom-6 font-bold text-2xl flex items-center gap-2"><P1Icon size={24} /> {player1.name}</div>
                        </Card>
                    )}
                    <div className="mt-4 text-sm text-neutral-400">Click card to add point</div>
                </div>

                {/* VS / Divider */}
                <div className="text-4xl font-black text-neutral-700 italic">VS</div>

                {/* TEAM 2 */}
                <div
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => handlePoint(player2._id)}
                >
                    {/* Serving Indicator Team 2 */}
                    <div className={`mb-4 text-xl font-bold flex items-center gap-2 ${(serverId === player2._id || (isDoubles && serverId === player4._id)) ? `animate-bounce ${p2Theme.text}` : 'text-neutral-500'}`}>
                        {(serverId === player2._id || (isDoubles && serverId === player4._id)) ? 'SERVING' : '\u00A0'}
                    </div>

                    {isDoubles ? (
                        <div className="w-full flex flex-col items-center gap-4">
                            {/* Big Score */}
                            <div className={cn("text-9xl font-black tabular-nums tracking-tighter drop-shadow-2xl", p2Theme.text)}>
                                {score.p2}
                            </div>
                            {/* Players */}
                            <div className="flex gap-4">
                                <Card className={cn("relative w-32 h-40 bg-neutral-900/80 border-2 overflow-hidden flex flex-col items-center justify-end p-2 transition-all", serverId === player2._id ? "border-white scale-110 z-10 shadow-xl" : "border-white/10 opacity-80")}>
                                    <P2Icon className={cn("absolute opacity-20 w-32 h-32 -top-4 -left-4", p2Theme.text)} />
                                    <div className="z-10 text-center font-bold text-sm truncate w-full">{player2.name}</div>
                                </Card>
                                <Card className={cn("relative w-32 h-40 bg-neutral-900/80 border-2 overflow-hidden flex flex-col items-center justify-end p-2 transition-all", serverId === player4._id ? "border-white scale-110 z-10 shadow-xl" : "border-white/10 opacity-80")}>
                                    <P4Icon className={cn("absolute opacity-20 w-32 h-32 -top-4 -right-4", p4Theme.text)} />
                                    <div className="z-10 text-center font-bold text-sm truncate w-full">{player4.name}</div>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className={cn(
                            "w-full aspect-3/4 max-w-xs bg-neutral-900/80 backdrop-blur border-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 active:scale-95 group-hover:shadow-2xl",
                            p2Theme.border, p2Theme.shadow
                        )}>
                            {/* Icon Background */}
                            <P2Icon className={cn("absolute opacity-10 w-64 h-64 -bottom-10 -right-10 -rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-110", p2Theme.text)} />

                            <div className="absolute font-bold text-white/90 user-select-none z-10">
                                <Counter
                                    value={score.p2}
                                    places={[10, 1]}
                                    fontSize={120}
                                    padding={0}
                                    gap={10}
                                    textColor="white"
                                    fontWeight={900}
                                    gradientHeight={0}
                                />
                            </div>
                            <div className="absolute bottom-6 font-bold text-2xl flex items-center gap-2"><P2Icon size={24} /> {player2.name}</div>
                        </Card>
                    )}
                    <div className="mt-4 text-sm text-neutral-400">Click card to add point</div>
                </div>
            </div>

            {/* Controls */}
            <div className="mt-12 z-20 flex gap-4">
                <Button
                    variant="secondary"
                    size="lg"
                    className="text-xl px-8"
                    onClick={handleUndo}
                    disabled={match.events.length === 0}
                >
                    <RotateCcw className="mr-2" /> Undo
                </Button>
            </div>

            {/* Winner Overlay */}
            {winner && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="text-center p-8 bg-neutral-900 border border-yellow-500 rounded-xl shadow-2xl shadow-yellow-500/20 max-w-lg w-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>

                        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-[bounce_2s_infinite]" />
                        <h1 className="text-6xl font-black italic text-white mb-2 tracking-tighter drop-shadow-lg">VICTORY!</h1>
                        <h2 className="text-3xl text-yellow-400 mb-8 font-bold">{match.winner.name} wins!</h2>

                        <div className="flex items-center justify-center gap-8 mb-8">
                            <div className="flex flex-col items-center">
                                <div className={cn("text-5xl font-black tabular-nums", score.p1 > score.p2 ? "text-yellow-500" : "text-neutral-500")}>{score.p1}</div>
                                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                    {player1.name} {isDoubles && `& ${player3.name}`}
                                </div>
                            </div>
                            <div className="text-2xl font-black text-neutral-700 italic">VS</div>
                            <div className="flex flex-col items-center">
                                <div className={cn("text-5xl font-black tabular-nums", score.p2 > score.p1 ? "text-yellow-500" : "text-neutral-500")}>{score.p2}</div>
                                <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mt-1">
                                    {player2.name} {isDoubles && `& ${player4.name}`}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Rematch Section */}
                            <div className="bg-neutral-800/50 rounded-lg p-3 border border-white/5 mb-4">
                                <button
                                    onClick={handleRematch}
                                    className="w-full text-lg h-14 bg-white text-black hover:bg-neutral-200 font-black italic tracking-tighter rounded-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg mb-3"
                                >
                                    <RotateCcw className="w-5 h-5" /> REMATCH
                                </button>

                                <div
                                    onClick={() => setRematchSwap(!rematchSwap)}
                                    className="flex items-center justify-center gap-2 text-sm text-neutral-400 cursor-pointer hover:text-white transition-colors"
                                >
                                    <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", rematchSwap ? "bg-green-500 border-green-500 text-black" : "border-neutral-600 bg-transparent")}>
                                        {rematchSwap && <Check size={12} strokeWidth={4} />}
                                    </div>
                                    <span>Switch Sides (Teams)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white" onClick={() => navigate('/setup')}>
                                    New Match
                                </Button>
                                <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white" onClick={() => navigate('/')}>
                                    Menu
                                </Button>
                            </div>

                            <button onClick={handleUndo} className="w-full text-xs text-neutral-600 hover:text-neutral-400 mt-2 py-2">
                                Made a mistake? Undo last point
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameScreen;
