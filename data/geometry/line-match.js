(function (global) {
  var C = global.DoctematicaCurriculum;
  if (!C || !C.levels) return;
  C.levels = C.levels.concat([
{
          id: "geo-line-match-1",
          topic: "analytic",
          subtopic: "line",
          mode: "geo-length",
          title: "זיהוי ישר לפי משוואה",
          instruction: "בציור מופיעים ישרים (I, II, III). שייכו כל משוואה לישר המתאים ונמקו: שיפוע חיובי, שיפוע שלילי, או גובה לפי b — לפי מה שבאמת מזהה את הישר.",
          exercises: [
            {
              id: "geo-line-match-1-ex-a001",
              n: 19,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -4,
                    b: 10
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "בציור שני ישרים. שייכו כל משוואה לישר המתאים ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −4x + 10",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a002",
              n: 20,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    mn: 1,
                    md: 2,
                    b: 8,
                    eqText: "y = (1/2)x + 8"
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    mn: -1,
                    md: 4,
                    b: 8,
                    eqText: "y = −(1/4)x + 8"
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שני ישרים החותכים את ציר y באותה נקודה. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = (1/2)x + 8",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −(1/4)x + 8",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a003",
              n: 21,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: -3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 1,
                    b: 4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 4",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x − 3",
                  answerKey: "I"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a004",
              n: 22,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 2
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -2,
                    b: 5
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 2",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 5",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a005",
              n: 23,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שני ישרים עם אותו גובה b. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a006",
              n: 24,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 2,
                    b: 4
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 2,
                    b: -4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו כל משוואה לישר I או II ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 2x − 4",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 2x + 4",
                  answerKey: "I"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a007",
              n: 25,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -3,
                    b: 5
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -3,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −3x + 5",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −3x + 2",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a008",
              n: 26,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 3,
                    b: 2
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 5,
                    b: -4
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 3x + 2",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 5x − 4",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a009",
              n: 27,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 0
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -3,
                    b: -2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −2x",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −3x − 2",
                  answerKey: "II"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a010",
              n: 28,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -2,
                    b: 6
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: 2,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שלושה ישרים — שייכו כל משוואה לישר I, II או III ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 2x + 2",
                  answerKey: "III"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 6",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −2x + 3",
                  answerKey: "I"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a011",
              n: 29,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -1,
                    b: 4
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 3,
                    b: 4
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: 3,
                    b: -2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 4",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = 3x + 4",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = 3x − 2",
                  answerKey: "III"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a012",
              n: 30,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -1,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 1,
                    b: 3
                  }
                },
                {
                  key: "III",
                  label: "III",
                  line: {
                    m: -1,
                    b: -3
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 3",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = x + 3",
                  answerKey: "II"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −x − 3",
                  answerKey: "III"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a013",
              n: 31,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: -2,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: 3,
                    b: 2
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שני ישרים ושלוש משוואות — אחת מהן לא שייכת. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = 3x + 2",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −2x + 3",
                  answerKey: "I"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = 3x + 3",
                  answerKey: "none"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a014",
              n: 32,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 1,
                    b: 3
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שני ישרים ושלוש משוואות — אחת מיותרת. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −x + 2",
                  answerKey: "none"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = x + 3",
                  answerKey: "I"
                }
              ]
            },
            {
              id: "geo-line-match-1-ex-a015",
              n: 33,
              lines: [
                {
                  key: "I",
                  label: "I",
                  line: {
                    m: 0.5,
                    b: 6
                  }
                },
                {
                  key: "II",
                  label: "II",
                  line: {
                    m: -1,
                    b: 6
                  }
                }
              ],
              showSegments: false,
              showAxisGuides: false,
              points: [],
              parts: [
                {
                  label: "",
                  text: "שני ישרים עם אותו b, ושלוש משוואות. שייכו ונמקו.",
                  taskIds: [
                    "eq1",
                    "eq2",
                    "eq3"
                  ]
                }
              ],
              tasks: [
                {
                  id: "eq1",
                  kind: "lineMatch",
                  eqNum: 1,
                  eqText: "y = (1/2)x + 6",
                  answerKey: "I"
                },
                {
                  id: "eq2",
                  kind: "lineMatch",
                  eqNum: 2,
                  eqText: "y = −(1/2)x + 4",
                  answerKey: "none"
                },
                {
                  id: "eq3",
                  kind: "lineMatch",
                  eqNum: 3,
                  eqText: "y = −x + 6",
                  answerKey: "II"
                }
              ]
            }
          ]
        }
  ]);
})(window);
