export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-medium text-ink">
          {label}
        </label>
      )}
      <input
        className={`px-3 py-2.5 rounded-xl border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-moss focus:border-transparent ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

export const Select = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-medium text-ink">
          {label}
        </label>
      )}
      <select
        className={`px-3 py-2.5 rounded-xl border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-moss focus:border-transparent ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

export const Textarea = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        className={`px-3 py-2.5 rounded-xl border border-forest/20 bg-white focus:outline-none focus:ring-2 focus:ring-moss focus:border-transparent resize-vertical ${className}`}
        {...props}
      />
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

export const Checkbox = ({ label, className = '', ...props }) => {
  return (
    <label className="flex items-center gap-2.5 font-medium cursor-pointer">
      <input
        type="checkbox"
        className={`w-4 h-4 rounded border-forest/20 text-forest focus:ring-moss ${className}`}
        {...props}
      />
      {label}
    </label>
  );
};
