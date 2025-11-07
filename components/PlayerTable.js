// components/PlayerTable.js
'use client';

import { POSITIONS } from '@/lib/playerUtils';

const cellStyle = {
  border: '1px solid #ddd',
  padding: '6px',
};

export default function PlayerTable({ players, captainIndex, onFieldChange, onCaptainChange, disabled = false }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyle}>#</th>
            <th style={cellStyle}>Player Name</th>
            <th style={cellStyle}>Natural Position</th>
            <th style={cellStyle}>Captain</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={player.id ?? index}>
              <td style={{ ...cellStyle, textAlign: 'center' }}>{index + 1}</td>
              <td style={cellStyle}>
                <input
                  type="text"
                  value={player.name}
                  onChange={(event) => onFieldChange(index, 'name', event.target.value)}
                  required
                  disabled={disabled}
                  style={{ width: '100%' }}
                />
              </td>
              <td style={cellStyle}>
                <select
                  value={player.naturalPosition}
                  onChange={(event) => onFieldChange(index, 'naturalPosition', event.target.value)}
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  {POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ ...cellStyle, textAlign: 'center' }}>
                <input
                  type="radio"
                  name="captain"
                  checked={captainIndex === index}
                  onChange={() => onCaptainChange(index)}
                  disabled={disabled}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
