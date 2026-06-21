export default function Loading() {
  return (
    <div>
      <div className="hero">
        <div className="hero-inner">
          <div className="sk sk-line" style={{ width: 180, height: 12 }} />
          <div className="sk sk-line" style={{ width: '70%', height: 44, marginTop: 16, borderRadius: 10 }} />
          <div className="sk sk-line" style={{ width: '52%', marginTop: 14 }} />
          <div style={{ display: 'flex', gap: 22, marginTop: 26 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="sk" key={i} style={{ width: 90, height: 38, borderRadius: 8 }} />
            ))}
          </div>
        </div>
        <div className="sk sk-line" style={{ marginTop: 30, height: 44, borderRadius: 0 }} />
      </div>

      <div className="section-title-row">
        <div className="sk sk-line" style={{ width: 140, height: 22 }} />
      </div>
      <div className="sk" style={{ height: 64, borderRadius: 16 }} />

      <div className="cards" style={{ marginTop: 18 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div className="sk-card" key={i}>
            <div className="sk sk-media" />
            <div style={{ padding: '13px 15px 16px' }}>
              <div className="sk sk-line" style={{ width: '45%', height: 18 }} />
              <div className="sk sk-line" style={{ width: '80%', marginTop: 9 }} />
              <div className="sk sk-line" style={{ width: '55%', marginTop: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
