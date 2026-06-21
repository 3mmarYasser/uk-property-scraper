export default function Loading() {
  return (
    <div>
      <div className="sk sk-line" style={{ width: 110 }} />
      <div className="detail-grid">
        <div>
          <div className="sk" style={{ aspectRatio: '16 / 10', borderRadius: 16 }} />
          <div className="facts-strip" style={{ marginTop: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="sk" key={i} style={{ height: 64, borderRadius: 11 }} />
            ))}
          </div>
          <div className="sk" style={{ height: 230, borderRadius: 16, marginBottom: 20 }} />
          <div className="sk" style={{ height: 140, borderRadius: 16 }} />
        </div>
        <div className="sk" style={{ height: 300, borderRadius: 16 }} />
      </div>
    </div>
  );
}
