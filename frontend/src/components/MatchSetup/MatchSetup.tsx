import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button as ButtonOriginal } from "@/components/ui/button";
import { Dialog as DialogOriginal, DialogContent as DialogContentOriginal, DialogHeader as DialogHeaderOriginal, DialogTitle as DialogTitleOriginal, DialogDescription as DialogDescriptionOriginal, DialogFooter as DialogFooterOriginal } from "@/components/ui/dialog";
import { Input as InputOriginal } from "@/components/ui/input";
import { Play, Plus, Swords, ArrowRightLeft, ChevronRight, ChevronLeft, Settings, Trophy, User, Users } from "lucide-react";
import { userService } from "@/services/userService";
import { gameModeService } from "@/services/gameModeService";
import { matchService } from "@/services/matchService";
import DecryptedText from "../react-bits/DecryptedText";
import { cn } from "@/lib/utils";
import { AVAILABLE_COLORS, AVAILABLE_ICONS } from "@/lib/gameConfig";
import GameSelect from "@/components/GameSelect.tsx";
import { motion, AnimatePresence } from 'framer-motion';

// Bypass TS checks for JS components
const Button = ButtonOriginal as any;
const Dialog = DialogOriginal as any;
const DialogContent = DialogContentOriginal as any;
const DialogHeader = DialogHeaderOriginal as any;
const DialogTitle = DialogTitleOriginal as any;
const DialogDescription = DialogDescriptionOriginal as any;
const DialogFooter = DialogFooterOriginal as any;
const Input = InputOriginal as any;

const MatchSetup = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [gameModes, setGameModes] = useState<any[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Wizard Step: 0 = Mode, 1 = Players, 2 = Config/Start
    const [step, setStep] = useState(0);

    // Selection State
    const [p1, setP1] = useState("");
    const [p2, setP2] = useState("");
    const [p3, setP3] = useState(""); // Partner for P1
    const [p4, setP4] = useState(""); // Partner for P2
    const [isDoubles, setIsDoubles] = useState(false);
    const [modeId, setModeId] = useState("");

    // New Match Config Overrides
    const [serveType, setServeType] = useState('free');
    const [servesInDeuce, setServesInDeuce] = useState(1);

    // Update defaults when mode changes
    useEffect(() => {
        if (modeId && gameModes.length) {
            const mode = gameModes.find(m => m._id === modeId);
            if (mode) {
                setServeType(mode.serveType || 'free');
                setServesInDeuce(mode.servesInDeuce || 1);
            }
        }
    }, [modeId, gameModes]);

    // Start Button Ref for focus
    const startButtonRef = useRef<HTMLButtonElement>(null);

    // User Dialog State
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
                // Don't auto-set modeId, let user choose in step 0
            } catch (e) {
                console.error("Error loading data", e);
            }
        };
        loadData();
    }, []);

    // Focus start button on step 2
    useEffect(() => {
        if (step === 2 && startButtonRef.current) {
            setTimeout(() => {
                startButtonRef.current?.focus();
            }, 300);
        }
    }, [step]);

    const handleStart = async () => {
        if (!p1 || !p2 || !modeId) return;
        if (p1 === p2) {
            alert("Shadow boxing is not supported yet.");
            return;
        }

        setIsTransitioning(true);

        try {
            const minAnimationTime = new Promise(resolve => setTimeout(resolve, 3000));
            const overrides = {
                serveType,
                servesInDeuce,
                player3Id: isDoubles ? p3 : null,
                player4Id: isDoubles ? p4 : null
            };
            const startMatchPromise = matchService.startMatch(p1, p2, modeId, overrides);
            const [_, match] = await Promise.all([minAnimationTime, startMatchPromise]);
            navigate(`/game/${match._id}`);
        } catch (err) {
            console.error("Failed to start match", err);
            alert(`Failed to start match: ${err}`);
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
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 overflow-hidden relative selection:bg-green-500/30">
            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
            </div>

            {/* Loading Overlay */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
                    >
                        <div className="w-full max-w-md space-y-8 p-8 relative">
                            <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full"></div>
                            <div className="text-center space-y-4 relative z-10">
                                <DecryptedText
                                    text="INITIALIZING BATTLE ARENA..."
                                    speed={70}
                                    animateOn="view"
                                    className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 tracking-tighter"
                                />
                                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden mt-8">
                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_15px_#10b981] animate-[loading_2.5s_ease-in-out_forwards]" style={{ width: '0%' }}></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Wizard Container */}
            <div className="w-full max-w-5xl z-10 relative">

                {/* Header / Progress */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                                aria-label="Go back to previous step"
                            >
                                <ChevronLeft />
                            </button>
                        )}
                        <div>
                            <h1 className="text-3xl font-black italic tracking-tighter text-white">
                                {step === 0 && "SELECT PROTOCOL"}
                                {step === 1 && "CHOOSE COMBATANTS"}
                                {step === 2 && "FINALIZE PARAMETERS"}
                            </h1>
                            <div className="text-xs font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2 mt-1">
                                <span className={cn(step >= 0 ? "text-green-500" : "text-neutral-700")}>01 Mode</span>
                                <span className="text-neutral-800">/</span>
                                <span className={cn(step >= 1 ? "text-green-500" : "text-neutral-700")}>02 Players</span>
                                <span className="text-neutral-800">/</span>
                                <span className={cn(step >= 2 ? "text-green-500" : "text-neutral-700")}>03 Start</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">

                        {/* STEP 0: GAME MODE */}
                        {step === 0 && (
                            <motion.div
                                key="step0"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {gameModes.map(mode => (
                                    <button
                                        key={mode._id}
                                        onClick={() => { setModeId(mode._id); setStep(1); }}
                                        className={cn(
                                            "group relative bg-neutral-900/40 border-2 rounded-3xl p-8 cursor-pointer transition-all duration-300 text-left outline-none",
                                            "focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:border-green-500",
                                            modeId === mode._id ? "border-green-500/50 bg-green-950/20 shadow-[0_0_30px_rgba(34,197,94,0.1)]" : "border-white/5 hover:border-white/20 hover:bg-neutral-900/80 hover:shadow-xl"
                                        )}
                                    >
                                        <div className="flex flex-col h-full justify-between">
                                            <div>
                                                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-6 group-hover:bg-white group-hover:text-black transition-colors">
                                                    <Trophy size={24} />
                                                </div>
                                                <h3 className="text-2xl font-black italic uppercase mb-2 text-white group-hover:text-green-400 transition-colors">{mode.name}</h3>
                                                <p className="text-neutral-500 text-sm leading-relaxed">{mode.rulesDescription || "Standard competitive table tennis rules."}</p>
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 text-xs font-mono uppercase text-neutral-400">
                                                <span className="flex items-center gap-1"><span className="text-white font-bold">{mode.pointsToWin}</span> Pts</span>
                                                <span className="flex items-center gap-1"><span className="text-white font-bold">{mode.servesBeforeChange}</span> Serves</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {/* STEP 1: PLAYERS */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-neutral-900/30 border border-white/5 rounded-3xl p-8 backdrop-blur-sm"
                            >
                                {/* MATCH TYPE TOGGLE */}
                                <div className="flex justify-center mb-8">
                                    <div className="bg-neutral-800 p-1 rounded-lg inline-flex relative">
                                        <div
                                            className={cn(
                                                "absolute top-1 bottom-1 w-[120px] bg-neutral-700/80 rounded-md transition-all duration-300",
                                                isDoubles ? "left-[124px]" : "left-1"
                                            )}
                                        />
                                        <button
                                            onClick={() => setIsDoubles(false)}
                                            className={cn(
                                                "relative w-[120px] py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors z-10",
                                                !isDoubles ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                            )}
                                        >
                                            <User size={14} /> Singles
                                        </button>
                                        <button
                                            onClick={() => setIsDoubles(true)}
                                            className={cn(
                                                "relative w-[120px] py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors z-10",
                                                isDoubles ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                                            )}
                                        >
                                            <Users size={14} /> Doubles
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
                                    {/* TEAM 1 */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} className="text-blue-500" /> {isDoubles ? "Team Blue" : "Challenger 01"}
                                        </h3>
                                        <GameSelect
                                            label=""
                                            placeholder="Select Player 1"
                                            options={users}
                                            value={p1}
                                            onChange={setP1}
                                            type="user"
                                            disabledValues={[p2, p3, p4].filter(Boolean)}
                                        />
                                        {isDoubles && (
                                            <GameSelect
                                                label=""
                                                placeholder="Select Partner (P3)"
                                                options={users}
                                                value={p3}
                                                onChange={setP3}
                                                type="user"
                                                disabledValues={[p1, p2, p4].filter(Boolean)}
                                            />
                                        )}
                                    </div>

                                    {/* VS / Swap */}
                                    <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
                                        <div className="w-px h-12 bg-white/10 lg:hidden"></div>
                                        <button
                                            onClick={() => {
                                                const t1 = p1; setP1(p2); setP2(t1);
                                                if (isDoubles) { const t3 = p3; setP3(p4); setP4(t3); }
                                            }}
                                            className="p-3 rounded-full bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-neutral-500 transition-all active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                            aria-label="Swap sides"
                                        >
                                            <ArrowRightLeft className="text-neutral-400 group-hover:text-white transition-colors group-hover:rotate-180 duration-500" size={20} />
                                        </button>
                                        <div className="w-px h-12 bg-white/10 lg:hidden"></div>
                                    </div>

                                    {/* TEAM 2 */}
                                    <div className="lg:col-span-5 space-y-4">
                                        <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} className="text-red-500" /> {isDoubles ? "Team Red" : "Challenger 02"}
                                        </h3>
                                        <GameSelect
                                            label=""
                                            placeholder="Select Player 2"
                                            options={users}
                                            value={p2}
                                            onChange={setP2}
                                            type="user"
                                            disabledValues={[p1, p3, p4].filter(Boolean)}
                                        />
                                        {isDoubles && (
                                            <GameSelect
                                                label=""
                                                placeholder="Select Partner (P4)"
                                                options={users}
                                                value={p4}
                                                onChange={setP4}
                                                type="user"
                                                disabledValues={[p1, p2, p3].filter(Boolean)}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-8">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsUserDialogOpen(true)}
                                        className="text-neutral-500 hover:text-white hover:bg-white/5"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Register New Player
                                    </Button>
                                    <Button
                                        onClick={() => setStep(2)}
                                        disabled={!p1 || !p2 || (isDoubles && (!p3 || !p4))}
                                        className={cn(
                                            "bg-white text-black hover:bg-neutral-200 font-bold px-8 h-12 text-lg transition-all",
                                            (!p1 || !p2 || (isDoubles && (!p3 || !p4))) ? "opacity-50 cursor-not-allowed" : "shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                        )}
                                    >
                                        Done <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: CONFIG & START */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="max-w-2xl mx-auto space-y-8"
                            >
                                {/* Summary Card */}
                                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-neutral-800">
                                            <Trophy size={20} className="text-neutral-400" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-neutral-500 uppercase font-bold">Protocol</div>
                                            <div className="text-xl font-bold text-white">{gameModes.find(m => m._id === modeId)?.name}</div>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-neutral-500 hover:text-white" onClick={() => setStep(0)}>Change</Button>
                                </div>

                                {/* Rules Config */}
                                <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Settings size={18} className="text-neutral-500" />
                                        <h3 className="font-bold text-neutral-300 uppercase tracking-widest text-sm">Fine-Tune Rules</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-xs text-neutral-500 font-bold uppercase">Service Style</label>
                                            <div className="flex bg-neutral-900/80 p-1 rounded-lg border border-white/5">
                                                <button
                                                    onClick={() => setServeType('free')}
                                                    className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50", serveType === 'free' ? "bg-neutral-800 text-white shadow-md" : "text-neutral-500 hover:text-white")}
                                                >
                                                    FREE
                                                </button>
                                                <button
                                                    onClick={() => setServeType('cross')}
                                                    className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50", serveType === 'cross' ? "bg-neutral-800 text-purple-400 shadow-md" : "text-neutral-500 hover:text-white")}
                                                >
                                                    CROSS
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs text-neutral-500 font-bold uppercase">Deuce Serves</label>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setServesInDeuce(Math.max(1, servesInDeuce - 1))} className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white flex items-center justify-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">-</button>
                                                <div className="flex-1 text-center font-mono font-bold text-xl">{servesInDeuce}</div>
                                                <button onClick={() => setServesInDeuce(servesInDeuce + 1)} className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white flex items-center justify-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* START BUTTON */}
                                <div className="pt-4 relative group">
                                    <Button
                                        ref={startButtonRef}
                                        className="absolute inset-0 w-full h-20 opacity-0 z-50 cursor-pointer"
                                        onClick={handleStart}
                                    />
                                    <div className="w-full h-20 bg-green-600 rounded-xl flex items-center justify-center gap-4 group-hover:bg-green-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300">
                                        <Swords size={28} className="text-black" />
                                        <span className="text-3xl font-black italic text-black tracking-tighter">FIGHT</span>
                                    </div>
                                </div>

                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* Create User Dialog */}
            <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] text-white border-neutral-800 sm:max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic uppercase">New Challenger</DialogTitle>
                        <DialogDescription className="text-neutral-500">Initialize a new combat profile.</DialogDescription>
                    </DialogHeader>

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
