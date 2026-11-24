import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona@example.com')
      .then((data) => {
        if (active) setSuggestions(data.suggestions);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load workout suggestions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Workout suggestions</h2>
      {loading && <p role="status">Loading workout suggestions...</p>}
      {!loading && error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
      {!loading && !error && suggestions.map((workout, index) => (
        <article key={workout.title ?? index} className="card mb-2">
          <div className="card-body">
            <h3 className="h5">{workout.title}</h3>
            {workout.reason && <p>{workout.reason}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
