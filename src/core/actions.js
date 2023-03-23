const { Predicates } = require("./predicates");
const { State } = require("./state");
const { Variables } = require("./variables");

const createTable = (actions) => {
  return Object.entries(actions)
    .map(([key, action]) => {
      const { params } = action;
      const paramsValues = Variables.fill(params);

      return {
        name: key,
        preconditions: action.getPreconditions(paramsValues),
        removes: action.getRemoves(paramsValues),
        adds: action.getAdds(paramsValues),
        ...action,
      };
    })
    .sort((a, b) => b.adds.length - a.adds.length);
};

function findAction(initialState, goalState, actions) {
  const actionsTable = createTable(actions);

  for (const actionTable of actionsTable) {
    const { adds, getRemoves, getPreconditions, filter, validate, params } =
      actionTable;
    let addsValues = matchEquations(goalState, adds, filter);

    if (addsValues) {
      const filledPreconditions = getPreconditions(
        Variables.fill(params, addsValues)
      ).filter((pred) => Variables.hasVariables(pred.values));

      const filledValues = matchEquations(
        initialState,
        filledPreconditions,
        filter,
        addsValues
      );

      if (
        filledValues &&
        !Variables.hasVariables(filledValues) &&
        validate(filledValues) &&
        Object.values(filter(filledValues)).every(Boolean)
      ) {
        return {
          action: actionTable,
          values: filledValues,
        };
      }
    }
  }

  return null;
}

function matchEquations(state, equations, filter, values = {}) {
  const originalState = [...state];
  const originalValues = { ...values };

  for (let i = 0; i < equations.length; i++) {
    const equation = equations[i];
    const subState = [...originalState];

    let predicateIndex = subState.findIndex((predicate) =>
      Variables.fits(predicate, equation)
    );

    while (subState.length && predicateIndex !== -1) {
      const predicate = subState[predicateIndex];
      const nextParams = Variables.plug(predicate, equation);

      subState.splice(predicateIndex, 1);

      predicateIndex = subState.findIndex((predicate) =>
        Variables.fits(predicate, equation)
      );

      const mergedParams = { ...originalValues, ...nextParams };

      const variablesValidation = filter(mergedParams);
      const isVariablesValid = Object.keys(mergedParams).every(
        (key) => variablesValidation[key]
      );

      if (!isVariablesValid) {
        continue;
      }

      Object.assign(originalValues, nextParams);
      const originalPredicateIndex = originalState.findIndex((_predicate) =>
        Predicates.equals(_predicate, predicate)
      );
      originalState.splice(originalPredicateIndex, 1);

      break;
    }
  }

  return originalValues;
}

function print(action, values) {
  const args = action.params.map((param) => values[param].print()).join(", ");
  return `${action.name}(${args})`;
}

const getActionsList = (initialState, _goalState, actions) => {
  const steps = [];

  let goalState = initialState;
  let currentState = _goalState;

  while (!State.equals(currentState, goalState)) {
    const previousStep = Actions.findAction(goalState, currentState, actions);

    if (!previousStep) {
      throw new Error("No action found");
    }

    const { action, values } = previousStep;
    const { getRemoves, getAdds } = action;

    const subGoals = getRemoves(values);
    const removes = getAdds(values);

    const mergedState = State.merge(currentState, subGoals);
    const nextCurrentState = State.substract(mergedState, removes);

    steps.push({ action, values, currentState: nextCurrentState, nextState: currentState });

    currentState = nextCurrentState;
  }

  return steps.reverse();
};

const Actions = { createTable, findAction, print, getSteps: getActionsList };

module.exports = {
  Actions,
};
