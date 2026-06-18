import { cn } from '../../lib/utils';

const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-6 h-6' };

const Spinner = ({ size = 'md', className }) => (
  <div
    className={cn(
      'animate-spin rounded-full border-2 border-white/10 border-t-blue-500',
      sizes[size],
      className
    )}
  />
);

export default Spinner;
