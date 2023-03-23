const { stringifySafe } = require("../utils");

function processPredicates(preds) {
  const entries = Object.entries(preds).map(([key, pred]) => {
    const params = pred.params;
    const argsLength = params.length;

    const predicateContext = {
      argsLength,
      pred,
      key,
      params,
      filter: pred.filter,
      validate: pred.validate,
    };

    const predicate = getPredicate.bind(predicateContext);

    Object.assign(predicate, {
      print,
      params,
      is: (other) => other.key === key,
      equals: predicate.is,
      filter: pred.filter,
      validate: pred.validate,
    });

    return [key, predicate];
  });

  return Object.fromEntries(entries);
}

function validatePredicate(values) {
  const filters = this.filter(values);
  const isVariablesValid = Object.values(filters).every(
    (value) => value === true
  );
  const isEquationValid = this.validate(values);

  const error =
    isVariablesValid && isEquationValid
      ? undefined
      : createError(filters, isEquationValid);
  return { isValid: isVariablesValid, error };
}

function createError(filters, isEquationValid) {
  const errorMessage = formatErrorMessage(filters);
  return new Error(errorMessage);
}

function formatErrorMessage(filters, isEquationValid) {
  const filterKey = this.key;
  const invalidArguments = getInvalidArguments(filters);
  const invalidArgumentsString = invalidArguments.join(", ");
  return `Invalid arguments for ${filterKey}, ${invalidArgumentsString}, ${isEquationValid}`;
}

function getInvalidArguments(filters) {
  return Object.entries(filters)
    .filter(([_, value]) => value !== true)
    .map(([key, value]) => `${key}: ${value}`);
}

function getPredicate(...args) {
  validateArguments.call(this, args);

  const values = getValues.call(this, args);

  this.values = values;
  this.args = args;

  const { isValid, error } = validatePredicate.call(this, values);

  return {
    ...this,
    args,
    values: values,
    changeArguments,
    replace,
    has,
    is,
    equals: is,
    isValid,
    error,
    print,
  };
}

function validateArguments(args) {
  if (args.length !== this.argsLength) {
    throw Error(
      `Invalid number of arguments for ${this.key}, expected ${
        this.argsLength
      } arguments, got ${args.length}. Arguments: ${stringifySafe(args)}`
    );
  }
}

function getValues(args) {
  return this.pred.params.reduce((acc, param, index) => {
    acc[param] = args[index];
    return acc;
  }, {});
}

function has(params, strict = true) {
  if (typeof params.id === "string") {
    return this.args.some((arg) => arg.id === params.id);
  }

  if (Object.keys(params).length === 0) {
    throw Error(
      `Invalid number of arguments for ${this.key}.has. Expected at least one argument.`
    );
  }

  return strict
    ? hasStrict.call(this, params)
    : hasNonStrict.call(this, params);
}

function is(pred) {
  if (!pred) {
    return false;
  }

  if (pred.key !== this.key) {
    return false;
  }

  return has.call(this, pred.values, false);
}

function changeArguments(newValues) {
  const nextValues = this.values;

  if (this.params.every((param) => !(param in newValues))) {
    return this;
  }

  Object.keys(newValues).forEach((key) => {
    if (newValues[key] && this.params.includes(key)) {
      nextValues[key] = newValues[key];
    }
  });

  return getPredicate.call(this, ...Object.values(nextValues));
}

function replace(predicate) {
  Object.keys(this).forEach((key) => {
    delete this[key];
  });

  Object.assign(this, predicate);
}

function hasStrict(params) {
  const processedParams = getProcessedParams.call(this, params);

  validateParamsLength.call(this, processedParams);

  return Object.entries(processedParams).every(
    ([param, value]) => value && this.values[param].id === value.id
  );
}

function getProcessedParams(params) {
  return Array.isArray(params)
    ? params.reduce((acc, param, i) => {
        acc[this.value.params[i]] = param;
        return acc;
      }, {})
    : params;
}

function validateParamsLength(params) {
  if (Object.keys(params).length !== this.argsLength) {
    throw Error(
      `Invalid number of arguments for ${this.key}.has. Expected ${
        this.argsLength
      } arguments, got ${Object.keys(params).length}.`
    );
  }
}

function hasNonStrict(params) {
  const processedParams = getProcessedParams.call(this, params);

  validateParamsLength.call(this, processedParams);

  return Object.values(processedParams).every(
    (value) => value && this.args.some((arg) => arg.id === value.id)
  );
}

function getProcessedParams(params) {
  return Array.isArray(params)
    ? params.reduce((acc, param, i) => {
        acc[this.value.params[i]] = param;
        return acc;
      }, {})
    : params;
}

function validateParamsLength(params) {
  if (Object.keys(params).length > this.argsLength) {
    throw Error(
      `Invalid number of arguments for ${this.key}.has. Expected at most ${
        this.argsLength
      } arguments, got ${Object.keys(params).length}.`
    );
  }
}

function print() {
  const args = this.args.map((arg) => arg.print()).join(", ");
  return `${this.key}(${args})`;
}

const Predicates = {
  equals: (a, b) => {
    if (!a || !b || a.key !== b.key || a.args.length !== b.args.length) {
      return false;
    }

    return has.call(a, b.values, false);
  },
};

module.exports = {
  processPredicates,
  Predicates,
};
