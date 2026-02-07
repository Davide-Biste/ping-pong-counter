import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Trophy, Swords, Users } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    // Hide navbar during gameplay to prevent distractions
    if (location.pathname.startsWith('/game/')) {
        return null;
    }

    return (
        <nav className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900/90 backdrop-blur-md border border-neutral-700 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">

            <NavLink
                to="/"
                className={({ isActive }) =>
                    `p-3 rounded-full transition-all duration-300 hover:bg-neutral-800 ${
                        isActive ? 'bg-blue-600/20 text-blue-400 scale-110' : 'text-neutral-400'
                    }`
                }
                title="Home"
            >
                <Home size={24} />
            </NavLink>

            <div className="w-px h-6 bg-neutral-700 mx-2"></div>

            <NavLink
                to="/hall-of-fame"
                className={({ isActive }) =>
                    `p-3 rounded-full transition-all duration-300 hover:bg-neutral-800 ${
                        isActive ? 'bg-yellow-600/20 text-yellow-400 scale-110' : 'text-neutral-400'
                    }`
                }
                title="Hall of Fame"
            >
                <Trophy size={24} />
            </NavLink>

            <div className="w-px h-6 bg-neutral-700 mx-2"></div>

            <NavLink
                to="/players"
                className={({ isActive }) =>
                    `p-3 rounded-full transition-all duration-300 hover:bg-neutral-800 ${
                        isActive ? 'bg-purple-600/20 text-purple-400 scale-110' : 'text-neutral-400'
                    }`
                }
                title="Players"
            >
                <Users size={24} />
            </NavLink>

            <NavLink
                to="/setup"
                className={({ isActive }) =>
                    `p-3 rounded-full transition-all duration-300 hover:bg-neutral-800 ${
                        isActive ? 'bg-red-600/20 text-red-400 scale-110' : 'text-neutral-400'
                    }`
                }
                title="New Match"
            >
                <Swords size={24} />
            </NavLink>

        </nav>
    );
};

export default Navbar;
