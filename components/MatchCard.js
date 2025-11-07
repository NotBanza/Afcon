// components/MatchCard.js
'use client';

const statusCopy = {
  waiting: 'Awaiting opponent',
  pending: 'Awaiting kickoff',
  completed: 'Full time',
  seeding: 'Seeded pairing',
};

const cardStyle = {
  border: '1px solid #cfd8dc',
  borderRadius: '6px',
  padding: '12px',
  margin: '12px 0',
  width: '220px',
  backgroundColor: '#f8f9fa',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const teamRowStyle = (highlight) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontWeight: highlight ? 600 : 400,
  color: highlight ? '#1a237e' : '#263238',
});

const captionStyle = {
  fontSize: '0.75rem',
  color: '#546e7a',
  marginTop: '8px',
};

const commentaryStyle = {
  fontSize: '0.75rem',
  color: '#37474f',
  marginTop: '10px',
  background: '#eceff1',
  padding: '6px',
  borderRadius: '4px',
  whiteSpace: 'pre-line',
};

const formatScore = (score, key) =>
  typeof score?.[key] === 'number' ? score[key] : '–';

export default function MatchCard({ match }) {
  const team1 = match?.team1;
  const team2 = match?.team2;
  const score = match?.score;
  const winnerId = match?.winnerId;
  const statusText = statusCopy[match?.status] || 'Status unknown';

  const team1Label = team1?.country || 'To Be Determined';
  const team2Label = team2?.country || 'To Be Determined';

  const showCommentary = match?.commentary && match.commentaryType === 'ai-play';

  return (
    <div style={cardStyle}>
      <div style={teamRowStyle(team1 && winnerId && team1.id === winnerId)}>
        <span>{team1Label}</span>
        <span>{formatScore(score, 'team1')}</span>
      </div>
      <hr style={{ margin: '8px 0' }} />
      <div style={teamRowStyle(team2 && winnerId && team2.id === winnerId)}>
        <span>{team2Label}</span>
        <span>{formatScore(score, 'team2')}</span>
      </div>
      <div style={captionStyle}>
        {statusText}
        {match?.resolution ? ` • ${match.resolution}` : ''}
        {match?.penalties ? ` • Penalties ${match.penalties.team1}-${match.penalties.team2}` : ''}
      </div>
      {showCommentary && (
        <div style={commentaryStyle}>{match.commentary}</div>
      )}
    </div>
  );
}