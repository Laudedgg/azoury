/**
 * Maps internal quality grades to client-facing grades.
 *
 * Internal grades: EXTRA, A, B, C_PLUS_PLUS, C
 * Client-facing grades: EXTRA, QUALITY_A, QUALITY_C
 *
 * Mapping:
 *   EXTRA       -> EXTRA
 *   A           -> QUALITY_A
 *   B           -> QUALITY_A
 *   C_PLUS_PLUS -> QUALITY_C
 *   C           -> QUALITY_C
 */

const GRADE_MAP = {
  EXTRA: 'EXTRA',
  A: 'QUALITY_A',
  B: 'QUALITY_A',
  C_PLUS_PLUS: 'QUALITY_C',
  C: 'QUALITY_C',
};

const REVERSE_MAP = {
  EXTRA: ['EXTRA'],
  QUALITY_A: ['A', 'B'],
  QUALITY_C: ['C_PLUS_PLUS', 'C'],
};

function mapToClientGrade(internalGrade) {
  const mapped = GRADE_MAP[internalGrade];
  if (!mapped) {
    throw new Error(`Unknown internal grade: ${internalGrade}`);
  }
  return mapped;
}

function getInternalGrades(clientGrade) {
  const grades = REVERSE_MAP[clientGrade];
  if (!grades) {
    throw new Error(`Unknown client-facing grade: ${clientGrade}`);
  }
  return grades;
}

module.exports = {
  mapToClientGrade,
  getInternalGrades,
  GRADE_MAP,
  REVERSE_MAP,
};
