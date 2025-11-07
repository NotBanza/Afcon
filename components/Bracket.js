// components/Bracket.js
'use client';

import MatchCard from './MatchCard';

const containerStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  gap: '24px',
  padding: '24px',
  flexWrap: 'wrap',
};

const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const headingStyle = {
  marginBottom: '12px',
  color: '#0d47a1',
};

const seededNoticeStyle = {
  padding: '10px 14px',
  background: '#e3f2fd',
  borderRadius: '6px',
  color: '#0d47a1',
  marginBottom: '16px',
  fontSize: '0.9rem',
};

function renderColumn(title, matches, keyPrefix) {
  return (
    <div style={columnStyle}>
      <h2 style={headingStyle}>{title}</h2>
      {matches.length === 0 ? (
        <p style={{ color: '#607d8b', fontSize: '0.85rem' }}>Awaiting qualification</p>
      ) : (
        matches.map((match) => <MatchCard key={`${keyPrefix}-${match.id}`} match={match} />)
      )}
    </div>
  );
}

export default function Bracket({ bracket }) {
  const { quarter = [], semi = [], final = [], seeded = false } = bracket || {};

  return (
    <div>
      {seeded && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={seededNoticeStyle}>
            Tournament bracket seeded. Matches will appear here once the competition kicks off.
          </div>
        </div>
      )}
      <div style={containerStyle}>
        {renderColumn('Quarter-Finals', quarter, 'qf')}
        {renderColumn('Semi-Finals', semi, 'sf')}
        {renderColumn('Final', final, 'final')}
      </div>
    </div>
  );
}