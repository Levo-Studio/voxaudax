import { ThemeSwitcher } from "@/components/theme-switcher";

export default function HomePage() {
  return (
    <main className="p-10">
      <h1 className="text-5xl font-extrabold tracking-[-0.045em]">Vox Audax</h1>
      <p className="mt-4 text-tm">Schülerzeitung des Uhland-Gymnasiums</p>
      <div className="mt-8">
        <ThemeSwitcher />
      </div>
    </main>
  );
}
