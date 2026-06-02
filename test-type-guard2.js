const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isObjectInstanceByProperties = (subject, properties = []) => {
  if (!isObject(subject)) return false;
  return properties.every((prop) => prop in subject);
};
const response = { bills: [], settlements: [] };
console.log(isObjectInstanceByProperties(response, ['bills', 'settlements']));
