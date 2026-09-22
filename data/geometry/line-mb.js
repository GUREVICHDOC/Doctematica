(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
      id: "geo-line-mb-1",
      topic: "analytic",
      subtopic: "line",
      mode: "geo-length",
      title: "זיהוי שיפוע וגובה",
      instruction:
        "במשוואה y = mx + b: m הוא המקדם של x (השיפוע), b הוא המספר החופשי (הגובה). בתרגילים שבהם המשוואה לא מסודרת — אפשר קודם לסדר את המשוואה לצורה y = mx + b (לא חובה), ואז m ו-b. אפשר גם למצוא ישר m ו-b.",
      exercises: [
        {
          id: "geo-line-mb-1-ex-a001",
          n: 1,
          line: { m: 2, b: -8, eqText: "y = 2x − 8" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 2x − 8. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a002",
          n: 2,
          line: { m: -4, b: 7, eqText: "y = −4x + 7" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = −4x + 7. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a003",
          n: 3,
          line: { m: -6, b: 3, eqText: "y = 3 − 6x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 3 − 6x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a004",
          n: 4,
          line: { mn: 2, md: 5, b: -4, eqText: "y = (2/5)x − 4" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = (2/5)x − 4. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a005",
          n: 5,
          line: { m: -1, b: 9, eqText: "y = −x + 9" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = −x + 9. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a006",
          n: 6,
          line: { m: 2, b: 0, eqText: "y = 2x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 2x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a007",
          n: 7,
          line: { m: 1, b: 0, eqText: "y = x" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = x. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a008",
          n: 8,
          line: { m: 0, b: 5, eqText: "y = 5" },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y = 5. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a009",
          n: 10,
          line: {
            unsorted: true,
            eqText: "y + 3x = 10",
            implicit: { ax: 3, ay: 1, c: 10 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y + 3x = 10. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a010",
          n: 11,
          line: {
            unsorted: true,
            eqText: "y − 2x + 5 = 0",
            implicit: { ax: -2, ay: 1, c: -5 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר y − 2x + 5 = 0. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a011",
          n: 12,
          line: {
            unsorted: true,
            eqText: "2x − y = 15",
            implicit: { ax: 2, ay: -1, c: 15 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 2x − y = 15. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a012",
          n: 13,
          line: {
            unsorted: true,
            eqText: "5x − y + 7 = 0",
            implicit: { ax: 5, ay: -1, c: -7 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5x − y + 7 = 0. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a013",
          n: 14,
          line: {
            unsorted: true,
            eqText: "5y = 10x + 30",
            implicit: { ax: 10, ay: -5, c: -30 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5y = 10x + 30. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a014",
          n: 15,
          line: {
            unsorted: true,
            eqText: "3y + 12x = 6",
            implicit: { ax: 12, ay: 3, c: 6 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 3y + 12x = 6. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a015",
          n: 16,
          line: {
            unsorted: true,
            eqText: "3y − 8x = 6",
            implicit: { ax: -8, ay: 3, c: 6 },
            mn: 8,
            md: 3,
            b: 2,
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 3y − 8x = 6. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a016",
          n: 17,
          line: {
            unsorted: true,
            eqText: "6x − 6y = 15",
            implicit: { ax: 6, ay: -6, c: 15 },
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 6x − 6y = 15. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
        {
          id: "geo-line-mb-1-ex-a017",
          n: 18,
          line: {
            unsorted: true,
            eqText: "5x − 4y = 23",
            implicit: { ax: 5, ay: -4, c: 23 },
            mn: 5,
            md: 4,
            b: -5.75,
          },
          showSegments: false,
          showAxisGuides: false,
          points: [],
          parts: [
            {
              label: "",
              text: "בציור מתואר הישר 5x − 4y = 23. אפשר קודם לסדר את המשוואה לצורה y = mx + b. מצאו את השיפוע m ואת הגובה b.",
              taskIds: ["m", "b"],
            },
          ],
          tasks: [
            { id: "m", kind: "lineMb", param: "m", label: "m" },
            { id: "b", kind: "lineMb", param: "b", label: "b" },
          ],
        },
      ],
    }
  ]);
})(window);
