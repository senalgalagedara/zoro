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
  attachment?: string;
};
export type Gift = {
  id: string;
  requestId: string;
  title: string;
  amount: number;
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
export const money = (amount: number) =>
  "Rs. " + amount.toLocaleString("en-LK", { maximumFractionDigits: 2 });
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
    },
  ],
};
export function validateAmount(value: string, max = 10000000): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
}
export function addGift(data: Data, gift: Gift): Data {
  const req = data.requests.find((r) => r.id === gift.requestId);
  if (
    !req ||
    req.owner === "me" ||
    gift.amount <= 0 ||
    gift.amount > Math.round((req.goal - req.raised) * 100) / 100
  )
    throw new Error("Gift amount is not valid for this request.");
  return {
    requests: data.requests.map((r) =>
      r.id === req.id
        ? { ...r, raised: Math.round((r.raised + gift.amount) * 100) / 100 }
        : r,
    ),
    gifts: [gift, ...data.gifts],
  };
}
