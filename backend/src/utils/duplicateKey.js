export function duplicateKeyFields(err) {
  if (!err || err.code !== 11000) return [];
  return Object.keys(err.keyPattern || err.keyValue || {});
}