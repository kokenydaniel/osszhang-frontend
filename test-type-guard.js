const isObject = (value) => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
const isObjectInstanceByProperties = (subject, properties = []) => {
  if (!isObject(subject)) {
    return false;
  }
  return properties.every((prop) => prop in subject);
};
const response = { transactions: [], goalRows: [] };
console.log(isObjectInstanceByProperties(response, ['transactions']));
