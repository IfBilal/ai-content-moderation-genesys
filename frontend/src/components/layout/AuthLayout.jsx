import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const AuthLayout = ({ children }) => (
  <div className="auth-bg min-h-screen flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="relative z-10 w-full max-w-md"
    >
      <div className="auth-logo-wrap">
        <div className="auth-logo-box">
          <ShieldCheck size={22} />
        </div>
        <span className="auth-logo-label">
          Content Moderation
        </span>
      </div>
      <div className="auth-card">
        {children}
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
