import { ArticleCover } from "@/components/article-cover";
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
      <main className="flex-1">
        <article className="grid md:min-h-[404px] md:grid-cols-[1.15fr_1fr]">
          <div className="px-[18px] py-10 md:px-11 md:py-12">
            <h1 className="text-[clamp(42px,5.2vw,68px)] leading-[0.95] font-extrabold tracking-[-0.045em]">
              Vox Audax
            </h1>
            <p className="mt-[18px] max-w-[50ch] text-[18px] leading-relaxed text-tm">
              Schülerzeitung des Uhland-Gymnasiums.
            </p>
          </div>
          <div className="px-[18px] pb-[26px] md:px-0 md:pb-0">
            <ArticleCover
              variant="hero"
              title="SMV setzt Handykompromiss durch"
              eyebrow="Titelthema"
              word="OFFLINE"
              line="Die Pausen bleiben offline"
            />
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
