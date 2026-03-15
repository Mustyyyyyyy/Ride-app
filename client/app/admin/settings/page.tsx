import PageTransition from "@/components/ui/PageTransition";
import AnimatedCard from "@/components/ui/AnimatedCard";

export default function AdminSettingsPage() {
  return (
    <PageTransition>
      <AnimatedCard className="rounded-[2rem] border border-green-100 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-gray-900">Admin Settings</h1>
        <p className="mt-3 text-gray-500">
          This page is ready for app settings, fare configuration, role controls,
          and system preferences.
        </p>
      </AnimatedCard>
    </PageTransition>
  );
}