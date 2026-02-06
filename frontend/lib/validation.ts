import { z } from "zod";
import { parseEther } from "viem";

const ethAmountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine((value) => /^\d+(\.\d{1,18})?$/.test(value), {
    message: "Use a number with up to 18 decimals",
  });

export function parseEthAmount(input: string) {
  const parsed = ethAmountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid amount" };
  }

  try {
    const value = parseEther(parsed.data);
    if (value <= 0n) {
      return { ok: false as const, error: "Amount must be greater than 0" };
    }
    return { ok: true as const, value };
  } catch {
    return { ok: false as const, error: "Invalid amount" };
  }
}
