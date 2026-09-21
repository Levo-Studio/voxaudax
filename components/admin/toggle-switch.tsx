"use client";

/**
 * Screen 6a's active switch and 10b's visibility dot. It submits its own form
 * on change, so the row it belongs to needs no save button — the switch is the
 * save.
 */
export function ToggleSwitch({
  name,
  checked,
  label,
}: {
  name: string;
  checked: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-end">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        aria-label={label}
        className="peer sr-only"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      />
      <span
        className={`flex h-6 w-[42px] items-center rounded-full p-[2px] transition-[background,border-color] duration-200 ease-out ${
          checked ? "border border-transparent bg-ac justify-end" : "border border-bd bg-s2 justify-start"
        }`}
      >
        <span
          className={`block h-[18px] w-[18px] rounded-full ${checked ? "bg-white" : "bg-tm"}`}
        />
      </span>
    </label>
  );
}
