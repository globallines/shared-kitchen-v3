export default function Home() {
  return (
    <main style={{
      minHeight: "100vh", background: "#faf7f2", color: "#1c2b25",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 32
    }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: "40px 32px", maxWidth: 480,
        textAlign: "center", border: "1px solid #e8e4dc", boxShadow: "0 8px 30px rgba(0,0,0,0.05)"
      }}>
        <div style={{ fontSize: 44 }}>&#x1F373;</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic", color: "#0f4c3a", fontSize: 30, margin: "12px 0 6px" }}>
          Shared Kitchen v3
        </h1>
        <p style={{ color: "#5b6b63", fontSize: 16 }}>It&apos;s alive. Next.js is running on Railway.</p>
        <div style={{ marginTop: 22, display: "inline-block", background: "#dcfce7", color: "#15803d", padding: "8px 16px", borderRadius: 999, fontWeight: 600, fontSize: 14 }}>
          &#x2713; Deploy pipeline working
        </div>
        <p style={{ marginTop: 24, color: "#9aa39d", fontSize: 13 }}>Next: connect MySQL &amp; migrate your data.</p>
      </div>
    </main>
  );
}
