import { NavLink } from 'react-router-dom';
import { Home, BarChart2, PlusCircle } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="bg-white border-t border-gray-100 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`
          }
        >
          <Home size={22} strokeWidth={1.8} />
          Home
        </NavLink>

        <NavLink
          to="/add"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 -mt-4 transition-transform active:scale-95 ${
              isActive ? 'scale-95' : ''
            }`
          }
        >
          {({ isActive }) => (
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              isActive ? 'bg-blue-600' : 'bg-primary'
            }`}>
              <PlusCircle size={28} color="#fff" strokeWidth={1.8} />
            </div>
          )}
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-1 text-xs font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400'
            }`
          }
        >
          <BarChart2 size={22} strokeWidth={1.8} />
          Analytics
        </NavLink>
      </div>
    </nav>
  );
}
