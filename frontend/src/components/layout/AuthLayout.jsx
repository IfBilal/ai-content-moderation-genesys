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
      <div className="flex flex-col items-center mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
          <ShieldCheck size={20} className="text-blue-400" />
        </div>
        <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 uppercase">
          Content Moderation
        </span>
      </div>
      <div className="bg-[#050505] border border-white/10 rounded-2xl p-8">
        {children}
      </div>
    </motion.div>
  </div>
);

export default AuthLayout;
