export function calculateReqExpToNext(skillLevel) {
  return Math.ceil(0.55 * skillLevel * skillLevel);
}

export function isValidPagesReadUpdate(newPagesRead, currentPagesRead, totalPages) {
  return (
    Number(newPagesRead) > Number(currentPagesRead) &&
    Number(newPagesRead) <= Number(totalPages)
  );
}

export function calculateLevelUp(
  expGained,
  expToNext,
  skillLevel,
  maxLevel,
  pagesDelta
) {
  let totalExp = Number(expGained) + Number(pagesDelta);
  let level = Number(skillLevel);
  let nextExp = Number(expToNext);
  const originalLevel = Number(skillLevel);
  let leveledUp = false;

  while (totalExp >= nextExp && level < maxLevel) {
    totalExp -= nextExp;
    level += 1;
    nextExp = calculateReqExpToNext(level);
    leveledUp = true;
  }

  if (level >= maxLevel) {
    level = maxLevel;
    totalExp = 0;
    nextExp = 0;
  }

  return { totalExp, nextExp, level, leveledUp };
}
