import assert from "node:assert/strict";
import { test } from "node:test";

import { chatGroupAddress } from "../lib/chat-groups.ts";

test("accepts the invite links as the apps hand them out", () => {
  const signal = "https://signal.group/#CjQKIPGXqeS0Hznb439cklWUg_o6w5hif0SofN6qrcw8T1tFEhBIzJCJeECz4lXieTp8Ew_X";
  const whatsapp = "https://chat.whatsapp.com/DoDVEFjqEyP3YguqUeMxqk";

  assert.deepEqual(chatGroupAddress("signal", signal), { ok: true, url: signal });
  assert.deepEqual(chatGroupAddress("whatsapp", ` ${whatsapp} `), { ok: true, url: whatsapp });
});

test("supplies the scheme when it was left off", () => {
  assert.deepEqual(chatGroupAddress("whatsapp", "chat.whatsapp.com/abc"), {
    ok: true,
    url: "https://chat.whatsapp.com/abc",
  });
});

test("reads an empty field as no group", () => {
  assert.deepEqual(chatGroupAddress("signal", "   "), { ok: true, url: null });
});

test("refuses an address that is not that messenger's group", () => {
  for (const [kind, typed] of [
    ["signal", "https://chat.whatsapp.com/abc"],
    ["whatsapp", "https://signal.group/#abc"],
    ["signal", "http://signal.group/#abc"],
    ["signal", "https://signal.group/"],
    ["whatsapp", "https://chat.whatsapp.com/"],
    ["whatsapp", "https://chat.whatsapp.com.example.org/abc"],
    ["signal", "javascript:alert(1)"],
  ] as const) {
    assert.deepEqual(chatGroupAddress(kind, typed), { ok: false }, `${kind} ${typed}`);
  }
});
