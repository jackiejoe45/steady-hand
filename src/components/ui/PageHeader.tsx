interface PageHeaderProps {
  index?: string;
  title: string;
  subtitle?: string;
  compact?: boolean;
}

export function PageHeader({
  index,
  title,
  subtitle,
  compact = false,
}: PageHeaderProps) {
  return (
    <header className={`text-center ${compact ? "space-y-1" : "space-y-2"}`}>
      {index && <p className="section-label">{index}</p>}
      <h1
        className={`font-serif tracking-tight text-[var(--fg)] ${
          compact ? "text-3xl" : "text-4xl"
        }`}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="text-[var(--fg-muted)] text-sm italic">{subtitle}</p>
      )}
    </header>
  );
}
