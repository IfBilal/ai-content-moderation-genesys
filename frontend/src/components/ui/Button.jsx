import { motion } from 'framer-motion';

const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', onClick, type = 'button', ...props
}) => {
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <div className="spinner spinner-sm" />}
      {children}
    </motion.button>
  );
};

export default Button;
