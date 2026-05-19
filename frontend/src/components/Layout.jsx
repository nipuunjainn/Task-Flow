import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Sun, Moon, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const links = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Workspaces', to: '/projects', icon: FolderKanban },
  { label: 'Assignments', to: '/tasks', icon: CheckSquare },
];

export default function Layout() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-page md:flex">
      {/* ── Top Bar (Desktop) ── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-6 border-b border-theme card-raised">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
            <Zap size={18} />
          </div>
          <span className="text-lg font-bold text-primary">Task Flow</span>
        </div>

        <nav className="flex items-center gap-1">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent-surface)] text-[var(--accent)]'
                    : 'text-secondary hover:text-primary hover:bg-[var(--surface-overlay)]'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="rounded-lg p-2 text-secondary hover:text-primary hover:bg-[var(--surface-overlay)] transition"
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="h-6 w-px bg-[var(--border)]" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">
              {(user.name || 'U')[0].toUpperCase()}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-primary leading-tight">{user.name || 'User'}</p>
              <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{user.role || 'MEMBER'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="rounded-lg p-2 text-secondary hover:text-red-500 hover:bg-red-500/10 transition"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Mobile Header ── */}
      <header className="md:hidden sticky top-0 z-50 border-b border-theme card-raised">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-white">
              <Zap size={16} />
            </div>
            <span className="text-base font-bold text-primary">Task Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="rounded-lg p-2 text-secondary">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={logout} className="rounded-lg p-2 text-secondary hover:text-red-500">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 md:pt-16">
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-theme card-raised flex justify-around py-2">
        {links.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium transition ${
                isActive ? 'text-[var(--accent)]' : 'text-muted'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}