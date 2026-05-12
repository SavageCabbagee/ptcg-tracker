type CountSummaryProps = {
  tracked: number;
  owned: number;
  wishlisted: number;
  compact?: boolean;
};

export function CountSummary({ tracked, owned, wishlisted, compact = false }: CountSummaryProps) {
  const stats = [
    { label: 'tracked', value: tracked },
    { label: 'owned', value: owned },
    { label: 'wishlisted', value: wishlisted },
  ];

  if (compact) {
    return (
      <dl className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-400">
        {stats.map((stat) => (
          <div className="flex min-w-0 gap-1" key={stat.label}>
            <dd className="font-medium tabular-nums text-zinc-300">{stat.value}</dd>
            <dt className="text-zinc-500">{stat.label}</dt>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid w-max grid-cols-[4ch_auto] gap-x-2 gap-y-1 text-sm text-zinc-400">
      {stats.map((stat) => (
        <div className="contents" key={stat.label}>
          <dd className="text-left font-medium tabular-nums text-zinc-300">
            {stat.value}
          </dd>
          <dt className="text-right text-zinc-500">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
