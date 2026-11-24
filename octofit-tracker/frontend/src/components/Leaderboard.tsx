import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (active) setLeaderboard(data.leaderboard);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load leaderboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Leaderboard</h2>
      {loading && <p role="status">Loading leaderboard...</p>}
      {!loading && error && <p role="alert">Unable to load leaderboard: {error}</p>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard rankings or scores found.</p>}
      {!loading && !error && leaderboard.map((entry, index) => (
        <article key={entry.teamName ?? index} className="card mb-2">
          <div className="card-body">
            <h3 className="h5">{entry.teamName}</h3>
            {entry.rank !== undefined && <p>Rank {entry.rank}</p>}
            {entry.totalPoints !== undefined && <p>{entry.totalPoints} points</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
