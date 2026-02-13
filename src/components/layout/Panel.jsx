export const Panel = ({ children, className = '' }) => {
  return (
    <section className={`bg-white/70 backdrop-blur-sm rounded-[28px] p-6 shadow-custom border border-forest/8 ${className}`}>
      {children}
    </section>
  );
};

export const PanelHeader = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`flex flex-wrap gap-3 md:gap-6 items-baseline justify-between mb-4 ${className}`}>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-ink mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-ink/70">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-3 flex-wrap items-center">{actions}</div>}
    </div>
  );
};
