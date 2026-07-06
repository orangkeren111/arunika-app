export const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) => (
  <div className="bg-[var(--card)] p-6 rounded-xl border border-[var(--border)] flex items-center gap-4 shadow-sm">
    <div className="p-4 rounded-full" style={{ backgroundColor: `${color}20`, color: color }}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-[var(--muted-foreground)] text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-[var(--card-foreground)] mt-1">{value}</h3>
    </div>
  </div>
);