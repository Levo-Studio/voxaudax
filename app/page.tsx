import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        current="home"
        showCategoryBar
        showSearch
        activeCategory="schulpolitik"
      />
      <main className="flex-1 px-[18px] py-10 md:px-10">
        <h1 className="text-5xl font-extrabold tracking-[-0.045em]">
          Vox Audax
        </h1>
        <p className="mt-4 text-tm">Schülerzeitung des Uhland-Gymnasiums</p>
      </main>
      <SiteFooter />
    </div>
  );
}
