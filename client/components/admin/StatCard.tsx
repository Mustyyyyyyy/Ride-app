"use client";

import AnimatedCard from "@/components/ui/AnimatedCard";

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
};

export default function StatCard({ title, value, subtitle }: Props) {
  return (
    <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-3 text-3xl font-black text-green-700">{value}</h3>
      {subtitle ? <p className="mt-2 text-sm text-gray-500">{subtitle}</p> : null}
    </AnimatedCard>
  );
}