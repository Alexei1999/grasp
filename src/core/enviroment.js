function processEnviroment(env) {
  const entries = Object.entries(env).map(([key, obj]) => {
    const { keys, set, canReplace, name, ...restValue } = obj;

    const isSet = keys || set;
    const id = isSet ? name : key;

    return [
      key,
      {
        ...restValue,
        name,
        id,
        is: createIsFunction(id),
        equals: createIsFunction(id),
        contains: isSet ? createContainsFunction(name) : undefined,
        get: isSet ? createGetFunction(name, keys, set) : undefined,
        print,
      },
    ];
  });

  return Object.fromEntries(entries);
}

function createIsFunction(id) {
  return function (obj) {
    if (!obj) {
      return false;
    }

    return obj.id === id;
  };
}

function createContainsFunction(name) {
  return function (obj) {
    if (!obj) {
      return false;
    }

    return obj.id.startsWith(name);
  };
}

function createGetFunction(name, keys, set) {
  return function (key) {
    if (!set && !keys?.includes(key)) {
      throw new Error(`Key ${key} is not defined in ${name} enviroment`);
    }

    const id = `${name}${key}`;

    return {
      ...this,
      key,
      id,
      is: createIsFunction(id),
      equals: createIsFunction(id),
    };
  };
}

function print() {
  return this.id;
}

const Env = {
  equals: (a, b) => {
    if (!a || !b) {
      return false;
    }

    return a.id === b.id;
  },
};

module.exports = {
  processEnviroment,
  Env,
};
