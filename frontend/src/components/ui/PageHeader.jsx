import { motion } from 'framer-motion';

const PageHeader = ({ title, subtitle, action }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className="flex items-start justify-between mb-8"
  >
    <div>
      <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </motion.div>
);

export default PageHeader;
