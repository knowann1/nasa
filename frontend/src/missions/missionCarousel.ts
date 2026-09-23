export type MissionCard = {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  status: "AVAILABLE" | "COMPLETED" | "LOCKED";
};

const icons = ["🚀", "🌕", "🔴"];

export function normalizeMissionCards(input: any[]): MissionCard[] {
  return input.map((m, i) => ({
    id: m.id,
    code: m.code,
    title: m.title,
    description: m.description,
    icon: icons[i] ?? "🛰️",
    status: m.status
  }));
}
