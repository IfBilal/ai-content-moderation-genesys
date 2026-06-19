import { outcomeColor, appealStatusColor } from '../../lib/utils';

const Badge = ({ children, variant, className = '' }) => {
  const getStyle = () => {
    if (variant === 'outcome') return outcomeColor(children);
    if (variant === 'appeal') return appealStatusColor(children);
    return { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.08)' };
  };

  const style = getStyle();

  return (
    <span
      className={`badge ${className}`}
      style={style}
    >
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
