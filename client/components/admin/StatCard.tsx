type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function StatCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-3 text-3xl font-black text-white">{value}</h3>
      {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
    </div>
  );
}