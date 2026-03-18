interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4 transition-colors duration-150 hover:border-zinc-300">
      <p className="text-11 font-medium text-zinc-400 uppercase tracking-wide">{label}</p>
      <p className="text-[28px] font-semibold text-zinc-900 mt-1 leading-none">{value}</p>
      {sub && <p className="text-12 text-zinc-400 mt-1.5">{sub}</p>}
    </div>
  );
}
