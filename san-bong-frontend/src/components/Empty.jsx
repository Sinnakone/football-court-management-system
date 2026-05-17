export function Empty({ icon = '⚠️', text }) {
  return (
    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-text">{text}</p>
    </div>
  );
}
