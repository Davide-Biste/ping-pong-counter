import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home } from "lucide-react";
import Counter from "@/components/react-bits/Counter";
import { matchService } from '@/services/matchService';
import { getColorTheme, getIconComponent } from "@/lib/gameConfig";
import { cn } from "@/lib/utils";

const GameScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

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

    if (isLoading) return <div className="text-white text-center mt-20">Loading Arena...</div>;
    if (!match) return <div className="text-white text-center mt-20">Match not found</div>;

    const { player1, player2, score, gameMode, winner } = match;

    const totalPoints = score.p1 + score.p2;

    const p1Theme = getColorTheme(player1.color || 'blue');
    const p2Theme = getColorTheme(player2.color || 'red');
    const P1Icon = getIconComponent(player1.icon);
    const P2Icon = getIconComponent(player2.icon);

    // Show Server Selection Modal if not set
    // Show Server Selection Modal if not set
    if (!match.firstServer && !winner && match.status === 'in_progress') {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
                {/* Background similar to main screen but dimmed */}
                <div className={cn("absolute top-0 left-0 w-1/2 h-full opacity-10", p1Theme.bg)} />
                <div className={cn("absolute top-0 right-0 w-1/2 h-full opacity-10", p2Theme.bg)} />

                <div className="z-10 bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                    <h2 className="text-3xl font-bold mb-2">Who Starts?</h2>
                    <p className="text-neutral-400 mb-8">Play your volley, whoever wins the point takes the serve.</p>

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

    // Check for deuce phase (simplified logic)
    const isDeuce = score.p1 >= pointsToWin - 1 && score.p2 >= pointsToWin - 1;

    // Who is "starter" and who is "receiver"?
    const starterId = match.firstServer || player1._id;
    const receiverId = starterId === player1._id ? player2._id : player1._id;

    if (isDeuce) {
        // Deuce logic: Alternating serves starting from the starter of the deuce phase.
        // The standard rule is that the serve alternates every point.
        // We calculate who served the LAST regular point.
        // If we are strictly IN deuce (meaning totalPoints >= pointsBeforeDeuce)
        // But the condition isDeuce triggers at e.g. 10-10 or 10-9 in some rules.
        // Let's assume standard logic:

        // If regular phase ended, we calculate parity from the start of deuce.
        // Who serves at 10-10 (20 pts)?
        // Regular sequence: 20/2 = 10 (Even). Starter serves.
        // So Point 20 (start of deuce) is Starter.
        // Point 21 (odd offset) is Receiver.

        const pointsBeforeDeuce = (pointsToWin - 1) * 2;

        const offset = totalPoints - pointsBeforeDeuce;
        // If offset < 0, we aren't quite at the "math" boundary of deuce but logically in it due to points.
        // But usually isDeuce matches points.

        if(offset >= 0) {
            // New logic using servesInDeuce
            const deuceServeTurn = Math.floor(offset / servesInDeuce);
            serverId = (deuceServeTurn % 2 === 0) ? starterId : receiverId;
        } else {
            // Fallback to regular calculation if something is odd with points
             const turnIndex = Math.floor(totalPoints / servesBeforeChange);
             serverId = (turnIndex % 2 === 0) ? starterId : receiverId;
        }
    } else {
        const turnIndex = Math.floor(totalPoints / servesBeforeChange);
        serverId = (turnIndex % 2 === 0) ? starterId : receiverId;
    }


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
                serverId === player1._id ? 'opacity-30' : ''
            )} />
            <div className={cn(
                "absolute top-0 right-0 w-1/2 h-full transition-all duration-500 opacity-10",
                p2Theme.bg,
                serverId === player2._id ? 'opacity-30' : ''
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
                {match.gameMode?.pointsToWin || 11} <span className="text-xs font-normal text-neutral-500 not-italic ml-0.5">PTS</span>
            </span>
                    </div>
                </div>

                {/* DEUCE BADGE (Shows only if active) */}
                {match.isDeuce && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="relative px-4 py-1 bg-orange-500/10 border border-orange-500/50 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                            <span className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">
                    DEUCE PROTOCOL ACTIVE
                </span>
                        </div>
                    </div>
                )}
            </div>


            {/* Scoreboard */}
            <div className="flex w-full max-w-5xl justify-between items-center z-10 gap-4">

                {/* Player 1 Section */}
                <div
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => handlePoint(player1._id)}
                >
                     <div className={`mb-4 text-2xl font-bold flex items-center gap-2 ${serverId === player1._id ? `animate-bounce ${p1Theme.text}` : 'text-neutral-500'}`}>
                        {serverId === player1._id ? 'SERVING' : '\u00A0'}
                    </div>

                    <Card className={cn(
                        "w-full aspect-3/4 max-w-xs bg-neutral-900/80 backdrop-blur border-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 active:scale-95 group-hover:shadow-2xl",
                        p1Theme.border,
                        p1Theme.shadow
                    )}>
                        {/* Icon Background */}
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
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                            <h2 className="text-3xl font-bold truncate px-2 drop-shadow-md flex items-center justify-center gap-2">
                                <P1Icon size={28} className={p1Theme.text} />
                                {player1.name}
                            </h2>
                        </div>
                    </Card>
                    <div className="mt-4 text-sm text-neutral-400">Click card to add point</div>
                </div>

                {/* VS / Divider */}
                <div className="text-4xl font-black text-neutral-700 italic">VS</div>

                {/* Player 2 Section */}
                <div
                    className="flex-1 flex flex-col items-center cursor-pointer group"
                    onClick={() => handlePoint(player2._id)}
                >
                     <div className={`mb-4 text-2xl font-bold flex items-center gap-2 ${serverId === player2._id ? `animate-bounce ${p2Theme.text}` : 'text-neutral-500'}`}>
                        {serverId === player2._id ? 'SERVING' : '\u00A0'}
                    </div>

                    <Card className={cn(
                        "w-full aspect-3/4 max-w-xs bg-neutral-900/80 backdrop-blur border-4 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 active:scale-95 group-hover:shadow-2xl",
                        p2Theme.border,
                        p2Theme.shadow
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
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20">
                            <h2 className="text-3xl font-bold truncate px-2 drop-shadow-md flex items-center justify-center gap-2">
                                <P2Icon size={28} className={p2Theme.text} />
                                {player2.name}
                            </h2>
                        </div>
                    </Card>
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
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                    <div className="text-center p-8 bg-neutral-900 border border-yellow-500 rounded-xl shadow-2xl shadow-yellow-500/20 max-w-lg w-full">
                        <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4 animate-pulse" />
                        <h1 className="text-5xl font-bold text-white mb-2">VICTORY!</h1>
                        <h2 className="text-3xl text-yellow-400 mb-8">{match.winner.name} wins!</h2>

                        <div className="grid grid-cols-2 gap-4 text-center mb-8">
                             <div>
                                <div className="text-4xl font-bold">{score.p1}</div>
                                <div className="text-sm text-neutral-500">{player1.name}</div>
                             </div>
                             <div>
                                <div className="text-4xl font-bold">{score.p2}</div>
                                <div className="text-sm text-neutral-500">{player2.name}</div>
                             </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button className="w-full text-lg h-12 bg-yellow-600 hover:bg-yellow-700" onClick={() => navigate('/setup')}>
                                New Match
                            </Button>
                            <Button variant="outline" className="w-full text-lg h-12" onClick={() => navigate('/')}>
                                Back to Menu
                            </Button>
                             <Button variant="ghost" className="w-full text-sm" onClick={handleUndo}>
                                Oops! Undo Last Point
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameScreen;
