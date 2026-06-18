import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = ({ children, className, hover = false, ...props }) => (
  <motion.div
    whileHover={hover ? { y: -2, borderColor: 'rgba(255,255,255,0.2)' } : {}}
    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    className={cn(
      'bg-[#050505] border border-white/10 rounded-2xl',
      className
    )}
    {...props}
  >
    {children}
  </motion.div>
);

export const CardHeader = ({ children, className }) => (
  <div className={cn('px-6 py-5 border-b border-white/10', className)}>
    {children}
  </div>
);

export const CardBody = ({ children, className }) => (
  <div className={cn('px-6 py-5', className)}>
    {children}
  </div>
);

export default Card;
