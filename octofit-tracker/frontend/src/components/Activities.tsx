import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setActivities(data.activities);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load activities');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section>
      <h2>Activities</h2>
      {loading && <p role="status">Loading activities...</p>}
      {!loading && error && <p role="alert">Unable to load activities: {error}</p>}
      {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
      {!loading && !error && activities.map((activity, index) => (
        <article key={index} className="card mb-2">
          <div className="card-body">
            <h3 className="h5">{activity.type}</h3>
            {activity.minutes !== undefined && <p>{activity.minutes} minutes</p>}
            {activity.points !== undefined && <p>{activity.points} points</p>}
          </div>
        </article>
      ))}
    </section>
  );
}
