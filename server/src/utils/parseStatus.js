function parseStatusFilter(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const list = String(value).split(',').map((s) => s.trim()).filter(Boolean);
  return list.length > 1 ? { in: list } : list[0];
}
module.exports = { parseStatusFilter };
