const { Predicates } = require("./predicates");

const print = (state) => {
  return state.map((pred) => pred.print());
};

const merge = (compState, targetState) => {
  return [...compState, ...targetState];
};

const substract = (compState, targetState) => {
  return compState.filter(
    (compPred) =>
      !targetState.some((targetPred) => {
        return Predicates.equals(compPred, targetPred);
      })
  );
};

const equals = (compState, targetState) => {
  return compState.every((compPred) =>
    targetState.some((targetPred) => Predicates.equals(compPred, targetPred))
  );
};

const objects = (state) => {
  const params = state.flatMap((pred) => pred.params);

  const objects = Array.from(
    new Map(params.map((obj) => [obj.id, obj])).values()
  );

  if (state.length && !objects.length) {
    throw new Error("No objects found");
  }

  return objects;
};

const intersect = (compState, targetState) => {
  return compState.filter((compPred) =>
    targetState.some((targetPred) => Predicates.equals(compPred, targetPred))
  );
};

const State = { equals, substract, merge, print, objects, intersect };

module.exports = {
  State,
};
