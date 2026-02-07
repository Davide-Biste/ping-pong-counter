import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Play, Plus, Swords, ArrowRightLeft } from "lucide-react";
import { userService } from "@/services/userService";
import { gameModeService } from "@/services/gameModeService";
import { matchService } from "@/services/matchService";
import DecryptedText from "../react-bits/DecryptedText";
import { cn } from "@/lib/utils";
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from "@/lib/gameConfig";
import GameSelect from "@/components/GameSelect.tsx";
import GameModeCarousel from "@/components/GameModeCarousel";

const MatchSetup = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [gameModes, setGameModes] = useState<any[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Selection State
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    const [modeId, setModeId] = useState("");

    // New Match Config Overrides
    const [serveType, setServeType] = useState('free');
    const [servesInDeuce, setServesInDeuce] = useState(1);

    // When game mode changes, update defaults
    useEffect(() => {
        if(modeId && gameModes.length) {
            const mode = gameModes.find(m => m._id === modeId);
            if(mode) {
                setServeType(mode.serveType || 'free');
                setServesInDeuce(mode.servesInDeuce || 1);
            }
        }
    }, [modeId, gameModes]);

    // Reference per il bottone di Start
    const startButtonRef = useRef<HTMLButtonElement>(null);

    // New User Dialog State
    const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
    const [newUserName, setNewUserName] = useState("");
    const [newUserColor, setNewUserColor] = useState("blue");
    const [newUserIcon, setNewUserIcon] = useState("User");
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [u, m] = await Promise.all([userService.getAll(), gameModeService.getAll()]);
                setUsers(u || []);
                setGameModes(m || []);
                if (m && m.length > 0) setModeId(m[0]._id);
            } catch (e) {
                console.error("Error loading data", e);
            }
        };
        loadData();
    }, []);

    // EFFETTO FOCUS AUTOMATICO
    // Quando p1, p2 e modeId sono tutti presenti, sposta il focus sul bottone FIGHT
    useEffect(() => {
        if (p1 && p2 && startButtonRef.current) {
            // Un piccolo timeout aiuta a garantire che il rendering sia completo se ci sono animazioni
            const timer = setTimeout(() => {
                startButtonRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [p1, p2]);

    const handleStart = async () => {
        if (!p1 || !p2 || !modeId) return;
        if (p1 === p2) {
            alert("Un vero guerriero non combatte contro se stesso.");
            return;
        }

        setIsTransitioning(true);

        try {
            const minAnimationTime = new Promise(resolve => setTimeout(resolve, 3000));
            // Send overrides
            const overrides = { serveType, servesInDeuce };
            const startMatchPromise = matchService.startMatch(p1, p2, modeId, overrides);
            const [_, match] = await Promise.all([minAnimationTime, startMatchPromise]);
            navigate(`/game/${match._id}`);
        } catch (err) {
            console.error("Failed to start match", err);
            setIsTransitioning(false);
        }
    };

    const handleCreateUser = async () => {
        if (!newUserName.trim()) return;
        setCreatingUser(true);
        try {
            const newUser = await userService.createQuick(newUserName, newUserColor, newUserIcon);
            setUsers([...users, newUser]);
            setNewUserName("");
            setNewUserColor("blue");
            setNewUserIcon("User");
            setIsUserDialogOpen(false);
        } catch (err) {
            alert("Failed to create user");
        } finally {
            setCreatingUser(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
            </div>

            {/* Loading Overlay */}
            {isTransitioning && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="w-full max-w-md space-y-8 p-8 relative">
                        <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full"></div>
                        <div className="text-center space-y-4 relative z-10">
                            <DecryptedText
                                text="INITIALIZING BATTLE ARENA..."
                                speed={70}
                                animateOn="view"
                                className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-tighter"
                            />
                            <p className="text-emerald-500/60 text-sm font-mono animate-pulse tracking-[0.2em]">
                                SYSTEM SYNC: <span className="text-green-400 font-bold">COMPLETE</span>
                            </p>
                        </div>
                        <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_15px_#10b981] animate-[loading_2.5s_ease-in-out_forwards]" style={{width: '0%'}}></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="w-full max-w-5xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header */}
                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-2xl">
                        MATCH SETUP
                    </h1>
                    <p className="text-neutral-500 font-mono text-sm tracking-widest uppercase">
                        Configure battle parameters
                    </p>
                </div>

                {/* Players & Mode Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT COLUMN: Players (Takes 5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-neutral-900/50 border border-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-transparent to-red-500 opacity-50 rounded-t-3xl" />

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Swords className="text-neutral-500" size={20}/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">COMBATANTS</span>
                            </h2>

                            <div className="space-y-6">
                                <GameSelect
                                    label="CHALLENGER 01 (Left Side)"
                                    placeholder="Select P1"
                                    options={users}
                                    value={p1}
                                    onChange={setP1}
                                    type="user"
                                    disabledValues={p2 ? [p2] : []}
                                />

                                {/* SWAP CONTROLS */}
                                <div className="relative flex items-center justify-center py-2 group/swap">
                                    {/* Linee decorative */}
                                    <div className="absolute left-0 right-1/2 h-px bg-gradient-to-r from-transparent via-neutral-700 to-neutral-700 opacity-50 w-[40%]" />
                                    <div className="absolute right-0 left-1/2 h-px bg-gradient-to-l from-transparent via-neutral-700 to-neutral-700 opacity-50 w-[40%]" />

                                    {/* Pulsante Swap */}
                                    <button
                                        onClick={() => {
                                            // Scambia i valori
                                            const temp = p1;
                                            setP1(p2);
                                            setP2(temp);
                                        }}
                                        disabled={!p1 && !p2} // Disabilita se vuoti
                                        className={cn(
                                            "relative z-10 w-10 h-10 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-500 flex items-center justify-center transition-all duration-300",
                                            (!p1 && !p2)
                                                ? "opacity-50 cursor-not-allowed"
                                                : "hover:bg-neutral-800 hover:text-white hover:border-white/30 hover:scale-110 active:scale-90 shadow-lg cursor-pointer"
                                        )}
                                        title="Swap Sides"
                                    >
                                        {/* Icona che ruota al click (usando active o group-hover) */}
                                        <ArrowRightLeft
                                            size={16}
                                            className={cn(
                                                "transition-transform duration-500 ease-in-out",
                                                // Ruota di 180 gradi quando si passa sopra col mouse
                                                "group-hover/swap:rotate-180"
                                            )}
                                        />
                                    </button>
                                </div>

                                <GameSelect
                                    label="CHALLENGER 02 (Right Side)"
                                    placeholder="Select P2"
                                    options={users}
                                    value={p2}
                                    onChange={setP2}
                                    type="user"
                                    disabledValues={p1 ? [p1] : []}
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsUserDialogOpen(true)}
                                    className="w-full text-neutral-500 hover:text-white hover:bg-white/5"
                                >
                                    <Plus size={14} className="mr-2"/> Register New Profile
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Mode & Start (Takes 7 cols) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Game Mode Carousel Section */}
                        <div className="bg-neutral-900/50 border border-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                            <h2 className="text-center text-sm font-mono font-bold text-neutral-500 tracking-widest mb-4">SELECT PROTOCOL</h2>

                            <GameModeCarousel
                                modes={gameModes}
                                selectedId={modeId}
                                onSelect={setModeId}
                            />

                            {/* Match Config Overrides Section */}
                            <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-4">
                                <h3 className="text-xs font-mono text-neutral-500 uppercase tracking-widest text-center">Protocol Parameters</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                        <label className="text-xs text-neutral-400 mb-2 uppercase">Service Style</label>
                                        <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
                                            <button
                                                className={cn("px-3 py-1 rounded text-xs font-bold transition-all", serveType === 'free' ? "bg-white text-black shadow-md" : "text-neutral-500 hover:text-white")}
                                                onClick={() => setServeType('free')}
                                            >
                                                FREE
                                            </button>
                                            <button
                                                className={cn("px-3 py-1 rounded text-xs font-bold transition-all", serveType === 'cross' ? "bg-purple-500 text-white shadow-md" : "text-neutral-500 hover:text-white")}
                                                onClick={() => setServeType('cross')}
                                            >
                                                CROSS
                                            </button>
                                        </div>
                                    </div>

                                     <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col items-center">
                                        <label className="text-xs text-neutral-400 mb-2 uppercase">Deuce Serves</label>
                                        <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10 items-center">
                                            <button
                                                className={cn("w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all hover:bg-white/10 text-white")}
                                                onClick={() => setServesInDeuce(Math.max(1, servesInDeuce - 1))}
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-mono font-bold text-white">{servesInDeuce}</span>
                                            <button
                                                className={cn("w-8 h-8 rounded flex items-center justify-center text-xs font-bold transition-all hover:bg-white/10 text-white")}
                                                onClick={() => setServesInDeuce(servesInDeuce + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* START BUTTON - GLITCH EDITION */}
                        <div className="mt-12 relative z-10 w-full group">

                            {/* Bottone invisibile sopra per il click, ma l'effetto visivo è sotto */}
                            {/* HO AGGIUNTO IL REF QUI SOTTO */}
                            <Button
                                ref={startButtonRef}
                                className="absolute inset-0 w-full h-24 opacity-0 z-50 cursor-pointer disabled:cursor-not-allowed outline-none focus:ring-4 focus:ring-green-500/50 rounded-xl"
                                onClick={handleStart}
                                disabled={!p1 || !p2 || !modeId}
                            />

                            <div className={cn(
                                "relative w-full h-24 bg-neutral-900 overflow-hidden rounded-xl transition-all duration-200 pointer-events-none", // pointer-events-none perché il bottone sopra gestisce il click
                                (!p1 || !p2 || !modeId)
                                    ? "opacity-50 grayscale cursor-not-allowed border border-neutral-800"
                                    : "group-hover:scale-[1.02] group-hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] group-focus-within:shadow-[0_0_40px_rgba(34,197,94,0.6)] border border-green-500/50 group-focus-within:border-green-400"
                            )}>

                                {/* Background Layers for Glitch Effect */}
                                <div className="absolute inset-0 bg-green-600 translate-x-1 translate-y-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100 mix-blend-screen animate-pulse"
                                     style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-2px, 0)' }} />
                                <div className="absolute inset-0 bg-red-600 -translate-x-1 -translate-y-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100 mix-blend-screen animate-pulse"
                                     style={{ clipPath: 'polygon(0 60%, 100% 60%, 100% 100%, 0 100%)', transform: 'translate(2px, 0)' }} />

                                {/* Main Button Body */}
                                <div className={cn(
                                    "absolute inset-0 flex items-center justify-center gap-4 bg-black",
                                    (!p1 || !p2 || !modeId) ? "bg-neutral-800" : "group-hover:bg-neutral-950 group-focus-within:bg-neutral-950"
                                )}>
                                    {/* Animated Stripes Background */}
                                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-[shine_3s_infinite]" />

                                    {/* Scanlines */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-50" />

                                    {/* Content */}
                                    <div className="relative z-20 flex items-center gap-4 group-hover:animate-[shake_0.5s_infinite] group-focus-within:animate-[shake_0.5s_infinite]">
                                        <Play
                                            fill="currentColor"
                                            className={cn(
                                                "w-8 h-8 transition-colors",
                                                (!p1 || !p2 || !modeId) ? "text-neutral-600" : "text-green-500 group-hover:text-white group-focus-within:text-white"
                                            )}
                                        />
                                        <span className={cn(
                                            "text-4xl font-black italic tracking-tighter uppercase",
                                            (!p1 || !p2 || !modeId) ? "text-neutral-600" : "text-white group-hover:text-green-400 group-focus-within:text-green-400 group-hover:drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]"
                                        )}>
                                            FIGHT
                                        </span>
                                    </div>
                                </div>

                                {/* Decor: Corner Brackets */}
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-500 rounded-tl-sm opacity-50 group-hover:opacity-100 group-focus-within:opacity-100" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-500 rounded-br-sm opacity-50 group-hover:opacity-100 group-focus-within:opacity-100" />
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Create User Dialog (Invariato) */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] text-white border-neutral-800 sm:max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic uppercase">New Challenger</DialogTitle>
                        <DialogDescription className="text-neutral-500">Initialize a new combat profile.</DialogDescription>
                    </DialogHeader>

                    {/* ... Dialog Content ... */}
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Codename</label>
                            <Input
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Enter name..."
                                className="bg-neutral-900 border-neutral-800 focus:border-white/20 h-10 font-bold text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Energy Signature</label>
                            <div className="flex gap-2 flex-wrap">
                                {AVAILABLE_COLORS.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={() => setNewUserColor(color.id)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center border-2",
                                            color.bg,
                                            newUserColor === color.id ? "border-white scale-110 shadow-lg" : "border-transparent opacity-40 hover:opacity-100"
                                        )}
                                    >
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Emblem</label>
                            <div className="grid grid-cols-6 gap-2 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {AVAILABLE_ICONS.map(({ id, component: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setNewUserIcon(id)}
                                        className={cn(
                                            "aspect-square rounded-lg flex items-center justify-center transition-all",
                                            newUserIcon === id
                                                ? "bg-neutral-800 text-white ring-1 ring-white/50 shadow-lg"
                                                : "text-neutral-600 hover:bg-neutral-800 hover:text-white"
                                        )}
                                    >
                                        <Icon size={18} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={handleCreateUser}
                            disabled={!newUserName.trim() || creatingUser}
                            className="w-full bg-white text-black hover:bg-neutral-200 font-bold h-11"
                        >
                            {creatingUser ? "INITIALIZING..." : "INITIALIZE UNIT"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchSetup;
