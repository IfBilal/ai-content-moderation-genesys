import { cn, outcomeColor, appealStatusColor } from '../../lib/utils';

const Badge = ({ children, variant, className }) => {
  const colorClass = variant
    ? variant === 'outcome' ? outcomeColor(children) : appealStatusColor(children)
    : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide',
      colorClass,
      className
    )}>
      {children}
    </span>
  );
};

export const OutcomeBadge = ({ outcome, className }) => (
  <Badge variant="outcome" className={className}>{outcome}</Badge>
);

export const AppealBadge = ({ status, className }) => (
  <Badge variant="appeal" className={className}>{status}</Badge>
);

export default Badge;
