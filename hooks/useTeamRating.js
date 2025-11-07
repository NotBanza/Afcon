import { useMemo } from 'react';

function computeAverage(values) {
  if (!values.length) {
    return 0;
  }
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export default function useTeamRating(players) {
  return useMemo(() => {
    if (!players || !players.length) {
      return {
        average: 0,
        breakdown: {
          GK: 0,
          DF: 0,
          MD: 0,
          AT: 0,
        },
      };
    }

    const breakdownBuckets = {
      GK: [],
      DF: [],
      MD: [],
      AT: [],
    };

    players.forEach((player) => {
      if (!player || !player.ratings) {
        return;
      }
      const { ratings, naturalPosition } = player;
      ['GK', 'DF', 'MD', 'AT'].forEach((pos) => {
        const ratingValue = typeof ratings[pos] === 'number' ? ratings[pos] : 0;
        if (pos === naturalPosition) {
          breakdownBuckets[pos].push(ratingValue);
        }
      });
    });

    const breakdown = {
      GK: computeAverage(breakdownBuckets.GK),
      DF: computeAverage(breakdownBuckets.DF),
      MD: computeAverage(breakdownBuckets.MD),
      AT: computeAverage(breakdownBuckets.AT),
    };

    const averages = Object.values(breakdown).filter((value) => value > 0);
    const overall = averages.length ? computeAverage(averages) : 0;

    return {
      average: overall,
      breakdown,
    };
  }, [players]);
}
