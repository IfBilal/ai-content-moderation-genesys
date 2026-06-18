import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white border border-blue-500/50',
  secondary: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20',
  ghost: 'bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent',
  success: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
};

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className, onClick, type = 'button', ...props
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </motion.button>
  );
};

export default Button;
