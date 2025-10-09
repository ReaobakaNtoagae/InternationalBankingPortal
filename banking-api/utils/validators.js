const patterns = {
  fullName: /^[A-Za-z\s]{2,50}$/,
  idNumber: /^\d{13}$/,
  accountNumber: /^\d{10,16}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
};

const validateField = (field, value) => {
  return patterns[field]?.test(value);
};

module.exports = { validateField };
