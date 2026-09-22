(function (global) {
  // נקודת כניסה לגאומטריה. התרגילים עצמם נטענים מ-data/geometry/*.js לפני הקובץ הזה.
  // data/curriculum.json, data/geo-line-match-1.json ו-data/geo-line-summary-1.json
  // אינם נטענים ואינם מקור האמת.
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  var expected = ["geo-segments-1","geo-triangle-area-1","geo-rect-area-1","geo-line-points-1","geo-line-axis-1","geo-line-mb-1","geo-line-match-1","geo-line-intersect-1","geo-line-summary-1","geo-line-eq-1","geo-slope-1","geo-parallel-1","geo-perp-1","geo-axis-lines-1","geo-midpoint-1","geo-distance-1"];
  var seen = C.levels
    .map(function (level) {
      return level.id;
    })
    .filter(function (id) {
      return expected.indexOf(id) >= 0;
    });
  if (seen.join("\n") !== expected.join("\n")) {
    throw new Error("geometry curriculum order");
  }
})(window);
