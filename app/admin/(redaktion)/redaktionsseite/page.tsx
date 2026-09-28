import { EditorialPageForm } from "@/app/admin/(redaktion)/redaktionsseite/editorial-page-form";
import { requireCapability } from "@/lib/authorize";
import { readEditorialPage } from "@/lib/editorial/editorial-page";

export const metadata = { title: "Redaktionsseite · Vox Audax Redaktion" };

/**
 * The text of /redaktion and the join links under its invitation. Admin only:
 * it is the newspaper speaking about itself, on the page that says who is
 * responsible for it.
 */
export default async function EditorialPageEditor() {
  await requireCapability("editEditorialPage");
  const { fields, groups } = await readEditorialPage();

  return (
    <>
      <h1 className="mb-3.5 px-4 text-xl font-extrabold tracking-[-0.03em] md:mb-4 md:px-0">
        Redaktionsseite
      </h1>

      <EditorialPageForm
        initial={{
          ...fields,
          signal: groups.signal ?? "",
          whatsapp: groups.whatsapp ?? "",
        }}
      />
    </>
  );
}
