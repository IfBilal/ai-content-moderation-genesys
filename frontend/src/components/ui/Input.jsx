const Input = ({ label, error, className = '', ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label className="form-label">{label}</label>}
    <input
      className={`form-input ${error ? 'error' : ''} ${className}`}
      {...props}
    />
    {error && <p className="form-error">{error}</p>}
  </div>
);

export const Textarea = ({ label, error, className = '', ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label className="form-label">{label}</label>}
    <textarea
      className={`form-input form-textarea ${error ? 'error' : ''} ${className}`}
      {...props}
    />
    {error && <p className="form-error">{error}</p>}
  </div>
);

export default Input;
