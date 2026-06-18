import { NavLink, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart2, AlertTriangle, Scale, Settings, FileText, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const adminNavItems = [
  { to: '/admin', icon: BarChart2, label: 'Analytics', end: true },
  { to: '/admin/submissions', icon: AlertTriangle, label: 'Submissions Queue' },
  { to: '/admin/appeals', icon: Scale, label: 'Appeals' },
  { to: '/admin/policies', icon: Settings, label: 'Policies' },
];

const userNavItems = [
  { to: '/submissions', icon: FileText, label: 'My Submissions' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-60 flex-shrink-0 bg-[#050505] border-r border-white/10 flex flex-col"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck size={14} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight">ModerateAI</p>
              <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Admin</p>
            </div>
          </div>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest px-3 mb-2">Admin</p>
          {adminNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive ? 'bg-white/8 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-0.5 h-4 rounded-full mr-0.5 transition-all ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <Icon size={15} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest px-3 mb-2">Personal</p>
            {userNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                    isActive ? 'bg-white/8 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`w-0.5 h-4 rounded-full mr-0.5 transition-all ${isActive ? 'bg-blue-500' : 'bg-transparent'}`} />
                    <Icon size={15} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-zinc-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
