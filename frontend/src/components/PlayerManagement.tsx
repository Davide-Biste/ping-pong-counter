import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Edit, ArrowLeft, Loader2 } from "lucide-react"; // Aggiunto Loader2 per loading state
import { userService } from "@/services/userService";
import { cn } from "@/lib/utils";
// Assicurati che il percorso sia corretto. Se non hai questo file, crea il file gameConfig.ts con il codice degli helper che ti ho dato prima.
import { AVAILABLE_COLORS, AVAILABLE_ICONS, getIconComponent, getColorTheme } from "@/lib/gameConfig";

const PlayerManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]); // Tipizzato come array generico per evitare errori TS semplici
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({ name: "", nickname: "", color: "blue", icon: "User" });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data);
        } catch (err) {
            console.error("Failed to load users", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDialog = (user: any = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name,
                nickname: user.funNickname || "",
                color: user.color || "blue",
                icon: user.icon || "User"
            });
        } else {
            setEditingUser(null);
            setFormData({ name: "", nickname: "", color: "blue", icon: "User" });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setIsSaving(true);
        try {
            if (editingUser) {
                await userService.update(editingUser._id, formData.name, formData.color, formData.icon, formData.nickname);
            } else {
                await userService.createQuick(formData.name, formData.color, formData.icon, formData.nickname);
            }
            await loadUsers();
            setIsDialogOpen(false);
        } catch (err) {
            alert("Failed to save warrior");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-neutral-700/50">

            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-12 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-full w-12 h-12">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter text-white">BARRACKS</h1>
                        <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Manage your roster</p>
                    </div>
                </div>

                <Button
                    onClick={() => handleOpenDialog()}
                    className="bg-white text-black hover:bg-neutral-200 font-bold tracking-wide w-full md:w-auto shadow-[0_0_20px_rgba(255,255,255,0.15)] h-12 px-6"
                >
                    <Plus className="mr-2 h-5 w-5" /> RECLUTA NUOVO GUERRIERO
                </Button>
            </div>

            {/* Loading State */}
            {isLoading && users.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
                </div>
            ) : (
                /* Grid */
                /* Grid */
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                    {users.map((user, idx) => {
                        const theme = getColorTheme(user.color);
                        const IconComponent = getIconComponent(user.icon);

                        return (
                            <div
                                key={user._id}
                                className="group relative bg-[#0a0a0a] border border-neutral-800 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:shadow-2xl hover:shadow-black/50 animate-in fade-in zoom-in-95"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/*
                   Card Top: Background ONLY
                   Nota: overflow-hidden è qui SOLO per il bg, non per l'intera card o l'avatar
                */}
                                <div className="h-28 relative overflow-hidden bg-neutral-950/50 rounded-t-2xl">
                                    {/* Gradient Blob */}
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-20 blur-3xl rounded-full transform translate-x-8 -translate-y-8 group-hover:opacity-40 transition-opacity duration-500`} />

                                    {/* Noise Overlay */}
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                                </div>

                                {/*
                   Avatar Container - POSIZIONATO FUORI DAL BLOCCO OVERFLOW-HIDDEN
                   Usiamo margin negativo (-mt-10) per tirarlo su.
                */}
                                <div className="relative -mt-10 flex justify-center z-20">
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl bg-[#0a0a0a] border-[3px] shadow-xl flex items-center justify-center transform rotate-3 group-hover:rotate-0 transition-transform duration-300 ease-out",
                                        theme.border
                                    )}>
                                        {/* Icona perfettamente centrata */}
                                        <IconComponent className={cn("w-9 h-9", theme.text)} strokeWidth={2.5} />
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="pt-4 pb-6 px-6 text-center space-y-5">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-white tracking-tight leading-tight">{user.name}</h3>
                                        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold">
                                            {user.funNickname || 'Reclutaccia'}
                                        </p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-neutral-900/80 rounded-lg p-2.5 border border-neutral-800/50 flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold text-white leading-none mb-1">{user.wins}</span>
                                            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-wider">Wins</span>
                                        </div>
                                        <div className="bg-neutral-900/80 rounded-lg p-2.5 border border-neutral-800/50 flex flex-col items-center justify-center">
                                            <span className="text-lg font-bold text-neutral-400 leading-none mb-1">{user.matchesPlayed || 0}</span>
                                            <span className="text-[9px] text-neutral-600 uppercase font-bold tracking-wider">Matches</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full h-9 text-xs font-bold uppercase tracking-widest border-neutral-800 bg-transparent text-neutral-500 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-center gap-2"
                                        onClick={() => handleOpenDialog(user)}
                                    >
                                        <Edit className="w-3 h-3" /> Configure
                                    </Button>
                                </div>

                                {/* Bottom Color Line */}
                                <div className={cn("h-1 w-full bg-gradient-to-r opacity-60 rounded-b-2xl", theme.gradient)} />
                            </div>
                        );
                    })}
                </div>

            )}

            {/* Dialog - Dark Theme */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-[#0f0f0f] text-white border-neutral-800 sm:max-w-md p-0 overflow-hidden gap-0 shadow-2xl shadow-black">
                    <DialogHeader className="p-6 pb-2 bg-neutral-900/50 border-b border-neutral-800">
                        <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
                            {editingUser ? 'System Override' : 'New Challenger'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Codename</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/50 border-neutral-800 text-white focus:border-white/20 focus:ring-0 h-10 font-bold"
                                    placeholder="e.g. Viper"
                                />
                            </div>
                        </div>

                        {/* Color Picker */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Energy Signature</label>
                            <div className="flex gap-2 justify-center flex-wrap bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                                {AVAILABLE_COLORS.map(colorOption => (
                                    <button
                                        key={colorOption.id}
                                        onClick={() => setFormData({ ...formData, color: colorOption.id })}
                                        className={cn(
                                            "w-9 h-9 rounded-full border-2 transition-all duration-200 bg-gradient-to-br flex items-center justify-center",
                                            colorOption.gradient,
                                            formData.color === colorOption.id
                                                ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)] ring-2 ring-white/20 ring-offset-2 ring-offset-black'
                                                : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon Picker */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Emblem</label>
                            <div className="grid grid-cols-6 gap-2 bg-black/30 p-4 rounded-xl border border-neutral-800/50 max-h-[160px] overflow-y-auto custom-scrollbar">
                                {AVAILABLE_ICONS.map(({ id, component: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setFormData({ ...formData, icon: id })}
                                        className={cn(
                                            "aspect-square rounded-lg flex items-center justify-center transition-all duration-200",
                                            formData.icon === id
                                                ? 'bg-neutral-800 text-white ring-1 ring-white/50 shadow-lg scale-105'
                                                : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800/50'
                                        )}
                                    >
                                        <Icon size={20} strokeWidth={2} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 bg-neutral-900/30">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !formData.name}
                            className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-bold tracking-wide rounded-lg text-sm"
                        >
                            {isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCESSING...</>
                            ) : (
                                editingUser ? 'SALVA CONFIGURAZIONE' : 'INIZIALIZZA SFIDA'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlayerManagement;
