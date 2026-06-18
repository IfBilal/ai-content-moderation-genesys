import { cn } from '../../lib/utils';

const Input = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
        {label}
      </label>
    )}
    <input
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200',
        'focus:border-white/25 focus:ring-1 focus:ring-blue-500/30',
        error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className, ...props }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
        {label}
      </label>
    )}
    <textarea
      className={cn(
        'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-all duration-200 resize-none',
        'focus:border-white/25 focus:ring-1 focus:ring-blue-500/30',
        error && 'border-red-500/50',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
);

export default Input;
