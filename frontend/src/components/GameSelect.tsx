import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, User, Gamepad2, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIconComponent, getColorTheme } from "@/lib/gameConfig";

const GameSelect = ({
                        options,
                        value = "",
                        onChange,
                        placeholder,
                        label,
                        defaultIcon: DefaultIcon = User,
                        type = "user",
                        disabledValues = [] // Nuova prop: Array di ID da disabilitare
                    }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Gestione chiusura click esterno e Tab navigation
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleTabKey = (event: KeyboardEvent) => {
            if (event.key === 'Tab' && isOpen) {
                if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleTabKey);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleTabKey);
        }
    }, [isOpen]);

    // Auto-focus migliorato
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const selectedEl = menuRef.current.querySelector('[data-selected="true"]') as HTMLElement;
            const firstEl = menuRef.current.querySelector('[role="option"][aria-disabled="false"]') as HTMLElement; // Cerca il primo NON disabilitato

            setTimeout(() => {
                if (selectedEl) selectedEl.focus();
                else if (firstEl) firstEl.focus();
            }, 50);
        }
    }, [isOpen]);

    const handleSelect = (id: string, isDisabled: boolean) => {
        if (isDisabled) return; // Blocca selezione se disabilitato
        onChange(id);
        setIsOpen(false);
        if (triggerRef.current) triggerRef.current.focus();
    };

    const handleKeyDownItem = (e: React.KeyboardEvent, id: string, isDisabled: boolean) => {
        if (isDisabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(id, isDisabled);
        }
    };

    const selectedOption = options.find(o => o._id === value);

    let activeTheme = { border: "border-neutral-700", text: "text-neutral-500", shadow: "", bg: "bg-neutral-800" };
    let ActiveIcon = DefaultIcon;

    if (selectedOption) {
        if (type === 'user') {
            const theme = getColorTheme(selectedOption.color);
            const iconComp = getIconComponent(selectedOption.icon);
            activeTheme = {
                border: theme.border,
                text: theme.text,
                shadow: theme.shadow,
                bg: "bg-neutral-900"
            };
            ActiveIcon = iconComp;
        } else {
            activeTheme = {
                border: "border-purple-500/50",
                text: "text-purple-400",
                shadow: "shadow-purple-500/20",
                bg: "bg-neutral-900"
            };
            ActiveIcon = Gamepad2;
        }
    }

    return (
        <div className="relative group w-full" ref={containerRef}>
            {label && (
                <label className={cn("block mb-2 text-xs font-mono tracking-widest uppercase", activeTheme.text)}>
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={cn(
                    "w-full h-16 bg-black/40 backdrop-blur-md border rounded-xl flex items-center px-4 transition-all duration-300 relative overflow-hidden group/btn focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",
                    activeTheme.border,
                    isOpen ? "ring-2 ring-white/20" : "hover:border-opacity-100",
                    !selectedOption && "border-neutral-800 hover:border-neutral-600"
                )}
            >
                {selectedOption && (
                    <div className={cn("absolute inset-0 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-500", activeTheme.bg.replace("bg-", "bg-"))} />
                )}

                <div className={cn(
                    "p-2.5 rounded-lg mr-4 flex items-center justify-center transition-all duration-300",
                    selectedOption ? "bg-white/5" : "bg-neutral-800",
                    activeTheme.text
                )}>
                    <ActiveIcon size={22} />
                </div>

                <div className="flex-grow text-left flex flex-col justify-center">
                    <span className={cn("font-bold text-sm tracking-wide", selectedOption ? "text-white" : "text-neutral-500")}>
                        {selectedOption ? (selectedOption.name || selectedOption.label) : placeholder}
                    </span>
                    {selectedOption && type === 'mode' && selectedOption.pointsToWin && (
                        <span className="text-[10px] text-neutral-500 font-mono">FIRST TO {selectedOption.pointsToWin} PTS</span>
                    )}
                    {selectedOption && type === 'user' && selectedOption.funNickname && (
                        <span className="text-[10px] text-neutral-500 font-mono uppercase">{selectedOption.funNickname}</span>
                    )}
                </div>

                <ChevronDown
                    className={cn("text-neutral-500 transition-transform duration-300", isOpen && "rotate-180")}
                    size={20}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    ref={menuRef}
                    role="listbox"
                    className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
                >
                    <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {options.map((opt) => {
                            let optTheme = { text: "text-neutral-400", hoverBorder: "group-hover/item:border-neutral-600" };
                            let OptIcon = DefaultIcon;

                            if (type === 'user') {
                                const t = getColorTheme(opt.color);
                                optTheme = {
                                    text: t.text,
                                    hoverBorder: t.border.replace("border-", "group-hover/item:border-")
                                };
                                OptIcon = getIconComponent(opt.icon);
                            } else {
                                OptIcon = Gamepad2;
                            }

                            const isSelected = value === opt._id;
                            const isDisabled = disabledValues.includes(opt._id); // Check disabilitazione

                            return (
                                <div
                                    key={opt._id}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={isDisabled}
                                    data-selected={isSelected}
                                    tabIndex={isDisabled ? -1 : 0} // Se disabilitato, non focusabile
                                    onClick={() => handleSelect(opt._id, isDisabled)}
                                    onKeyDown={(e) => handleKeyDownItem(e, opt._id, isDisabled)}
                                    className={cn(
                                        "flex items-center px-3 py-3 rounded-lg transition-all border border-transparent mb-1 last:mb-0 outline-none",
                                        isDisabled
                                            ? "opacity-30 cursor-not-allowed bg-neutral-900 grayscale" // Stile DISABILITATO
                                            : "cursor-pointer group/item hover:bg-white/5 hover:border-white/5 focus:bg-white/10 focus:ring-1 focus:ring-white/20", // Stile ATTIVO
                                        isSelected && !isDisabled && "bg-white/10 border-white/10"
                                    )}
                                >
                                    <div className={cn("mr-3 transition-opacity", isDisabled ? "opacity-50" : "opacity-70 group-hover/item:opacity-100", optTheme.text)}>
                                        {isDisabled ? <Ban size={18}/> : <OptIcon size={18} />}
                                    </div>

                                    <div className="flex-grow">
                                        <div className={cn(
                                            "font-medium text-sm",
                                            isDisabled ? "text-neutral-600 line-through" : (isSelected ? "text-white" : "text-neutral-400 group-hover/item:text-white")
                                        )}>
                                            {opt.name}
                                        </div>
                                    </div>

                                    {opt.pointsToWin && (
                                        <span className="text-xs font-mono bg-neutral-900 px-2 py-1 rounded text-neutral-500 border border-neutral-800">
                                            {opt.pointsToWin}
                                        </span>
                                    )}

                                    {isSelected && <Check size={16} className="text-white ml-2" />}
                                </div>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="p-4 text-center text-neutral-600 text-sm italic">No options available</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameSelect;
