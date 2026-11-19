import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function invalidInput(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') invalidInput('Invalid activity');

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || type.trim().length === 0
    || typeof minutes !== 'number'
    || !Number.isFinite(minutes)
    || minutes <= 0
  ) {
    invalidInput('Invalid activity');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId)) {
    invalidInput('Invalid activity reference');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) invalidInput('Activity references missing records');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') invalidInput('Invalid team');

  const { name, mascot, members = [] } = _input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (
    typeof name !== 'string'
    || name.trim().length === 0
    || typeof mascot !== 'string'
    || mascot.trim().length === 0
  ) {
    invalidInput('Invalid team');
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))) {
    invalidInput('Invalid team members');
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const users = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
    if (users.length !== memberIds.length) invalidInput('Team members missing records');
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  if (memberIds.length > 0) {
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $set: { team: team._id } },
    );
  }

  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
  ]);

  if (totals.length === 0) return [];

  const teams = await Team.find({
    _id: { $in: totals.map(({ _id }) => _id) },
  }).lean();
  const teamNames = new Map(
    teams.map((team) => [team._id.toString(), team.name]),
  );

  const ranked = totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName));

  return ranked.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const activities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .lean();
  const activityTypes = activities.map((activity) => activity.type);
  const requestedFocus = user.fitnessGoal?.toLowerCase()
    || activityTypes[0]?.toLowerCase()
    || '';

  const workout = await Workout.findOne({
    $or: [
      { focus: requestedFocus },
      { focus: { $regex: activityTypes.join('|'), $options: 'i' } },
    ],
  }).lean();

  if (!workout) return [];

  const reason = activityTypes.length > 0
    ? `Suggested for your ${activityTypes.join(', ')} activity pattern and ${requestedFocus} focus`
    : `Suggested for your ${requestedFocus} fitness goal`;

  return [{ ...workout, reason }];
}

export { User };
