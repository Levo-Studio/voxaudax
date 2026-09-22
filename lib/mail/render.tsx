import { render } from "@react-email/render";

import type { MailTemplate } from "@/lib/mail/template";
import { type ApprovalProps, approvalMail } from "@/lib/mail/templates/approval";
import {
  type InvitationProps,
  invitationMail,
} from "@/lib/mail/templates/invitation";
import {
  type PasswordChangedByAdminProps,
  passwordChangedByAdminMail,
} from "@/lib/mail/templates/password-changed-by-admin";
import {
  type PasswordResetProps,
  passwordResetMail,
} from "@/lib/mail/templates/password-reset";
import { MailShell } from "@/lib/mail/ui";

/**
 * Every mail this application can send. Callers name a template and hand it its
 * own props, so a missing field is a type error rather than a gap that only
 * shows up in someone's inbox.
 */
export type Mail =
  | { template: "approval"; props: ApprovalProps }
  | { template: "invitation"; props: InvitationProps }
  | { template: "passwordChangedByAdmin"; props: PasswordChangedByAdminProps }
  | { template: "passwordReset"; props: PasswordResetProps };

export type MailTemplateName = Mail["template"];

export type RenderedMail = {
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

const renderWith = async <Props extends { siteUrl: string }>(
  template: MailTemplate<Props>,
  props: Props,
): Promise<RenderedMail> => {
  const preheader = template.preheader(props);
  const subject = template.subject(props);

  return {
    subject,
    preheader,
    html: await render(
      <MailShell
        preheader={preheader}
        addressLine={template.addressLine(props)}
        subject={subject}
        banner={template.banner?.(props)}
      >
        {template.body(props)}
      </MailShell>,
    ),
    text: template.text(props),
  };
};

export const renderMail = (mail: Mail): Promise<RenderedMail> => {
  switch (mail.template) {
    case "approval":
      return renderWith(approvalMail, mail.props);
    case "invitation":
      return renderWith(invitationMail, mail.props);
    case "passwordChangedByAdmin":
      return renderWith(passwordChangedByAdminMail, mail.props);
    case "passwordReset":
      return renderWith(passwordResetMail, mail.props);
  }
};
