(function (global) {
  function toProblem(ex, level) {
    var sol = DoctematicaBank.solutionForEquation(ex.start);
    return {
      mode: "steps",
      source: "worksheet",
      levelId: level.id,
      n: ex.n,
      total: level.exercises.length,
      instruction: level.instruction,
      prompt: ex.start,
      startEquation: ex.start,
      solutionSteps: sol.steps,
      answer: sol.answer,
      value: sol.value,
      explain: "בודדו את x בצעדים שקולים עד שמתקבלת משוואה מהצורה x = מספר.",
    };
  }

  global.DoctematicaContent = {
    levels: function (topicId) {
      var all = (global.DoctematicaCurriculum && global.DoctematicaCurriculum.levels) || [];
      if (!topicId) return all;
      return all.filter(function (item) {
        return (item.topic || "equations") === topicId;
      });
    },
    problem: function (levelId, index) {
      var level = this.levels().filter(function (item) {
        return item.id === levelId;
      })[0];
      if (!level || !level.exercises[index]) return null;
      return toProblem(level.exercises[index], level);
    },
  };
})(window);
