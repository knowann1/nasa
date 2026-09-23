const icons = ["🚀", "🌕", "🔴"];
export function normalizeMissionCards(input) {
    return input.map((m, i) => ({
        id: m.id,
        code: m.code,
        title: m.title,
        description: m.description,
        icon: icons[i] ?? "🛰️",
        status: m.status
    }));
}
