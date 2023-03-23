const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const stringifySafe = (value) => {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return value;
  }
};

module.exports = { pipe, stringifySafe };
