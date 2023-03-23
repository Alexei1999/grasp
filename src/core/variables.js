const { processEnviroment } = require("./enviroment");

const { variables } = processEnviroment({
  variables: { name: "variable", set: true, canReplace: true },
});

const fits = (comparablePred, examplarPred) => {
  if (comparablePred.key !== examplarPred.key) {
    return false;
  }

  for (let key of Object.keys(comparablePred.values)) {
    const comparableParam = comparablePred.values[key];
    const comparativeParam = examplarPred.values[key];

    if (!comparativeParam) {
      return false;
    }

    if (variables.contains(comparativeParam)) {
      continue;
    }

    if (comparableParam.equals(comparativeParam)) {
      continue;
    }

    return false;
  }

  return true;
};

const plug = (valuesPred, equationPred) => {
  const fittedParams = {};

  for (let key of Object.keys(equationPred.values)) {
    const equationParam = equationPred.values[key];
    const valueParam = valuesPred.values[key];

    if (variables.contains(equationParam)) {
      fittedParams[equationParam.key] = valueParam;
    }
  }

  return fittedParams;
};

const replace = (predicate, values) => {
  const fittedParams = {};

  for (let key of Object.keys(predicate.values)) {
    const equationParam = predicate.values[key];
    const valueParam = values[key];

    if (variables.contains(equationParam) && equationParam.key === key) {
      fittedParams[equationParam.key] = valueParam;
    }
  }

  return fittedParams;
};

const isEquation = (values = {}) => {
  return Object.values(values).some((value) => variables.contains(value));
};

const fill = (params, values) => {
  const nextValue = { ...values };

  for (let key of params) {
    const param = nextValue[key];

    if (!param) {
      nextValue[key] = variables.get(key);
    }
  }

  return nextValue;
};

const Variables = {
  fits,
  plug,
  replace,
  hasVariables: isEquation,
  fill,
};

module.exports = {
  variables,
  Variables,
};
