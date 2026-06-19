import { motion } from 'framer-motion';

const Card = ({ children, className = '', hover = false, ...props }) => (
  <motion.div
    whileHover={hover ? { y: -2, transition: { type: 'spring', stiffness: 300, damping: 25 } } : {}}
    className={`mod-card ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mod-card-header ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`mod-card-body ${className}`}>
    {children}
  </div>
);

export default Card;
