import { User, Smile, Zap, Star, Crown, Skull, Ghost, Gamepad2, Rocket, Heart, Trophy, Swords } from "lucide-react";

export const AVAILABLE_ICONS = [
    { id: 'User', component: User },
    { id: 'Smile', component: Smile },
    { id: 'Zap', component: Zap },
    { id: 'Star', component: Star },
    { id: 'Crown', component: Crown },
    { id: 'Skull', component: Skull },
    { id: 'Ghost', component: Ghost },
    { id: 'Gamepad', component: Gamepad2 },
    { id: 'Rocket', component: Rocket },
    { id: 'Heart', component: Heart },
    { id: 'Trophy', component: Trophy },
    { id: 'Swords', component: Swords },
];

export const AVAILABLE_COLORS = [
    { id: 'blue', bg: 'bg-blue-600', text: 'text-blue-500', border: 'border-blue-600', ring: 'ring-blue-500', shadow: 'shadow-blue-500/50', gradient: 'from-blue-600 to-blue-400' },
    { id: 'red', bg: 'bg-red-600', text: 'text-red-500', border: 'border-red-600', ring: 'ring-red-500', shadow: 'shadow-red-500/50', gradient: 'from-red-600 to-red-400' },
    { id: 'green', bg: 'bg-green-600', text: 'text-green-500', border: 'border-green-600', ring: 'ring-green-500', shadow: 'shadow-green-500/50', gradient: 'from-green-600 to-green-400' },
    { id: 'yellow', bg: 'bg-yellow-600', text: 'text-yellow-500', border: 'border-yellow-600', ring: 'ring-yellow-500', shadow: 'shadow-yellow-500/50', gradient: 'from-yellow-600 to-yellow-400' },
    { id: 'purple', bg: 'bg-purple-600', text: 'text-purple-500', border: 'border-purple-600', ring: 'ring-purple-500', shadow: 'shadow-purple-500/50', gradient: 'from-purple-600 to-purple-400' },
    { id: 'orange', bg: 'bg-orange-600', text: 'text-orange-500', border: 'border-orange-600', ring: 'ring-orange-500', shadow: 'shadow-orange-500/50', gradient: 'from-orange-600 to-orange-400' },
    { id: 'pink', bg: 'bg-pink-600', text: 'text-pink-500', border: 'border-pink-600', ring: 'ring-pink-500', shadow: 'shadow-pink-500/50', gradient: 'from-pink-600 to-pink-400' },
    { id: 'cyan', bg: 'bg-cyan-600', text: 'text-cyan-500', border: 'border-cyan-600', ring: 'ring-cyan-500', shadow: 'shadow-cyan-500/50', gradient: 'from-cyan-600 to-cyan-400' },
];

export const getIconComponent = (iconId) => {
    const icon = AVAILABLE_ICONS.find(i => i.id === iconId);
    return icon ? icon.component : User;
};

export const getColorTheme = (colorId) => {
    const color = AVAILABLE_COLORS.find(c => c.id === colorId);
    return color || AVAILABLE_COLORS[0]; // Default to blue
};
