


export function canSplit(cards):boolean {
  const cardValue = (value: string) => {
    return ["J", "Q", "K"].includes(value) ? 10 : value;
  };
  return cards.length === 2 && cardValue(cards[0].value) === cardValue(cards[1].value);
}

export function  getScore(cards): number {
  let score = 0;
  let aceCount = 0;
  for (const card of cards) {
    if (card.value === 'A') {
      aceCount++;
      score += 11;
    } else if (['J', 'Q', 'K'].includes(card.value)) {
      score += 10;
    } else {
      score += parseInt(card.value);
    }
  }
  while (score > 21 && aceCount > 0) {
    score -= 10;
    aceCount--;
  }
  return score;
}
