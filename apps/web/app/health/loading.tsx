export default function Loading() {
  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Pipeline · Observability</div>
        <h1>Pipeline health</h1>
      </div>
      <div className="sk" style={{ height: 84, borderRadius: 16 }} />
      <div className="stats">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="sk" key={i} style={{ height: 86, borderRadius: 11 }} />
        ))}
      </div>
      <div className="sk" style={{ height: 260, borderRadius: 16, marginTop: 18 }} />
    </div>
  );
}
