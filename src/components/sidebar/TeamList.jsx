import TeamTile from './TeamTile.jsx'

export default function TeamList({ teams, hiddenTeamIds = [], onToggleTeam }) {
  if (teams.length === 0) {
    return <p style={{ padding: '0 14px', fontSize: 12, color: 'var(--color-text-muted)' }}>Žádné týmy</p>
  }
  return (
    <>
      {teams.map((team) => (
        <TeamTile
          key={team.id}
          team={team}
          isVisible={!hiddenTeamIds.includes(team.id)}
          onToggle={onToggleTeam}
        />
      ))}
    </>
  )
}
