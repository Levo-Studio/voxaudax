"use client";

import type { ReactNode } from "react";

/**
 * The template's `seg` control: a two- or three-way choice inside a recessed
 * track. Rendered as radio inputs rather than buttons so that the choice is a
 * form field the server reads, and so that the arrow keys move between the
 * options the way a radio group is expected to.
 */
export function Segmented<Value extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: Value;
  options: readonly { readonly value: Value; readonly label: ReactNode }[];
  onChange?: (value: Value) => void;
}) {
  return (
    <div className="flex gap-[2px] rounded-[9px] bg-s2 p-[3px]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <label
            key={option.value}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-[7px] px-2.5 py-2 text-center font-control text-[12.5px] font-bold transition-[background,color] duration-200 ease-out has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ac ${
              active ? "bg-tx text-s1" : "text-tm hover:text-tx"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={active}
              onChange={() => onChange?.(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
