const items = [{ id: 1, type: "expense", category: "Reserve Cat", amount: 1000, isReserve: true }];
const type = "expense";
const grouped = {};
for (const item of items) {
  const isIncome = item.type === "income";
  if (type === "income" && !isIncome) continue;
  if (type === "expense" && isIncome) continue;

  const catName = item.category || "Egyéb";
  if (!grouped[catName]) {
    grouped[catName] = [];
  }
  grouped[catName].push(item);
}
console.log(grouped);
