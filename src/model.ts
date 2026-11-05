export type Role = "giver" | "requester";
export type Category = "Essentials" | "Education" | "Medical" | "Utilities";
export type Request = {
  id: string;
  owner: string;
  name: string;
  title: string;
  story: string;
  category: Category;
  goal: number;
  raised: number;
  location: string;
  country?: string;
  currency?: string;
  attachment?: string;
};
export type Gift = {
  id: string;
  requestId: string;
  title: string;
  amount: number;
  currency?: string;
  anonymous: boolean;
  message: string;
  date: string;
};
export type Data = { requests: Request[]; gifts: Gift[] };
export const categories: Category[] = [
  "Essentials",
  "Education",
  "Medical",
  "Utilities",
];
export const money = (amount: number, currency = "LKR") => {
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: currencyFractionDigits(code),
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
};
export const currencyFractionDigits = (currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return 2;
  }
};
export const initial: Data = {
  gifts: [],
  requests: [
    {
      id: "1",
      owner: "demo-1",
      name: "Nethmi",
      title: "A little help for a fresh semester",
      story:
        "My new semester starts soon, and I am saving for textbooks and travel to campus. Your gift would help me keep learning while I balance my part-time work. Thank you for being part of my next chapter.",
      category: "Education",
      goal: 25000,
      raised: 16500,
      location: "Kandy",
      country: "Sri Lanka",
      currency: "LKR",
    },
    {
      id: "2",
      owner: "demo-2",
      name: "Amal",
      title: "Keep the lights on this month",
      story:
        "After a quiet month at work, I need a little support with our electricity bill. Any contribution will help my family get through this month.",
      category: "Utilities",
      goal: 12000,
      raised: 4500,
      location: "Colombo",
      country: "Sri Lanka",
      currency: "LKR",
    },
    {
      id: "3",
      owner: "demo-3",
      name: "Shanika",
      title: "Everyday essentials for my family",
      story:
        "I am asking for support with groceries and household essentials while I get back on my feet. Even a small gift makes a difference.",
      category: "Essentials",
      goal: 18000,
      raised: 7200,
      location: "Galle",
      country: "Sri Lanka",
      currency: "LKR",
    },
    {
      id: "4",
      owner: "me",
      name: "You",
      title: "Support for my course materials",
      story:
        "I am collecting funds for the books and materials I need for my studies. Thank you for helping me take the next step.",
      category: "Education",
      goal: 15000,
      raised: 3000,
      location: "Colombo",
      country: "Sri Lanka",
      currency: "LKR",
    },
  ],
};
export function validateAmount(
  value: string,
  max = 10000000,
  fractionDigits = 2,
): number | null {
  if (
    !Number.isFinite(max) ||
    !Number.isInteger(fractionDigits) ||
    fractionDigits < 0
  )
    return null;
  const decimals = fractionDigits
    ? `(?:\\.\\d{1,${fractionDigits}})?`
    : "";
  if (!new RegExp(`^\\d+${decimals}$`).test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
}
export function addGift(data: Data, gift: Gift): Data {
  const req = data.requests.find((r) => r.id === gift.requestId);
  const precision = currencyFractionDigits(
    req?.currency ?? gift.currency ?? "LKR",
  );
  const scale = 10 ** precision;
  const round = (value: number) => Math.round(value * scale) / scale;
  if (
    !req ||
    req.owner === "me" ||
    typeof gift.amount !== "number" ||
    !Number.isFinite(gift.amount) ||
    gift.amount <= 0 ||
    round(gift.amount) !== gift.amount ||
    (gift.currency &&
      gift.currency.toUpperCase() !== (req.currency ?? "LKR").toUpperCase()) ||
    gift.amount > round(req.goal - req.raised)
  )
    throw new Error("Gift amount is not valid for this request.");
  return {
    requests: data.requests.map((r) =>
      r.id === req.id
        ? { ...r, raised: round(r.raised + gift.amount) }
        : r,
    ),
    gifts: [gift, ...data.gifts],
  };
}
