import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setTeams(data.teams);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load teams');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Teams</h2>
      {loading && <p role="status">Loading teams...</p>}
      {!loading && error && <p role="alert">Unable to load teams: {error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
      {!loading && !error && teams.map((team, index) => (
        <article key={team.name ?? index} className="card mb-2">
          <div className="card-body">
            <h3 className="h5">{team.name}</h3>
            {team.members && <p>{team.members.join(', ')}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
