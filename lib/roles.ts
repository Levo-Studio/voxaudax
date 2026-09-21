import type { userForm, userRole } from "@/lib/db/schema";

type Role = (typeof userRole.enumValues)[number];
type Form = (typeof userForm.enumValues)[number];

/**
 * The masthead title, which is not the permission level. Screen 9a prints
 * "Redakteur" over three people the role table calls `autor`: inside the
 * application the distinction decides who may publish, on the page it would
 * only demote a member of the editorial team in public.
 */
const TITLES: Record<Role, Record<Form, string>> = {
  admin: {
    weiblich: "Chefredakteurin",
    maennlich: "Chefredakteur",
    neutral: "Chefredaktion",
  },
  redakteur: {
    weiblich: "Redakteurin",
    maennlich: "Redakteur",
    neutral: "Redaktion",
  },
  autor: {
    weiblich: "Redakteurin",
    maennlich: "Redakteur",
    neutral: "Redaktion",
  },
};

export const roleTitle = (role: Role, form: Form) => TITLES[role][form];
