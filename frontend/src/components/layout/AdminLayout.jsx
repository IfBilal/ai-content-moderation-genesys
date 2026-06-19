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
    <div className="app-layout">
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sidebar"
      >
        <div className="sidebar-logo">
          <div className="sidebar-logo-inner">
            <div className="sidebar-logo-icon">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="sidebar-logo-text">ModerateAI</p>
              <p className="sidebar-logo-sub">Admin</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Admin</p>
          {adminNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}

          <div style={{ paddingTop: 16 }}>
            <p className="sidebar-section-label">Personal</p>
            {userNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <p className="sidebar-user-email">{user?.email}</p>
          </div>
          <button onClick={logout} className="sidebar-logout">
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </motion.aside>

      <main className="main-content">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
