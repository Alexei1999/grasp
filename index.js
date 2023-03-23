const { Actions } = require("./src/core/actions");
const { processEnviroment, Env } = require("./src/core/enviroment");
const { processPredicates } = require("./src/core/predicates");
const { State } = require("./src/core/state");

const environment = processEnviroment({
  robot: { name: "robot" },
  rooms: { name: "room", keys: ["A", "B", "C"] },
  boxes: { name: "box", keys: ["1", "2"] },
});
const { robot, rooms, boxes } = environment;

const predicates = processPredicates({
  at: {
    filter: ({ X, Y }) => ({
      X: robot.is(X) || boxes.contains(X),
      Y: rooms.contains(Y),
    }),
    validate: ({ X, Y }) => !Env.equals(X, Y),
    params: ["X", "Y"],
  },
});
const { at } = predicates;

const initialState = [
  at(robot, rooms.get("A")),
  at(boxes.get("1"), rooms.get("B")),
  at(boxes.get("2"), rooms.get("C")),
];

const goalState = [
  at(robot, rooms.get("A")),
  at(boxes.get("1"), rooms.get("A")),
];

const actions = {
  move: {
    params: ["X", "Y"],
    filter: ({ X, Y }) => ({
      X: rooms.contains(X),
      Y: rooms.contains(Y),
    }),
    validate: ({ X, Y }) => !Env.equals(X, Y),
    getPreconditions: ({ X }) => [at(robot, X)],
    getRemoves: ({ X }) => [at(robot, X)],
    getAdds: ({ Y }) => [at(robot, Y)],
  },
  push: {
    params: ["X", "Y", "Z"],
    filter: ({ X, Y, Z }) => ({
      X: boxes.contains(X),
      Y: rooms.contains(Y),
      Z: rooms.contains(Z),
    }),
    validate: ({ Y, Z }) => !Env.equals(Y, Z),
    getPreconditions: ({ X, Y }) => [at(robot, Y), at(X, Y)],
    getRemoves: ({ X, Y }) => [at(robot, Y), at(X, Y)],
    getAdds: ({ X, Z }) => [at(robot, Z), at(X, Z)],
  },
};

const steps = Actions.getSteps(initialState, goalState, actions);

console.log("Initial state:");
console.log(State.print(initialState));
console.log("Goal state:");
console.log(State.print(goalState));

steps.forEach(({ action, nextState, values }, i) => {
  console.log(`Step ${i + 1}:`);
  console.log(Actions.print(action, values));
  console.log(State.print(nextState));
});

module.exports = {};
