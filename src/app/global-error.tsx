"use client";

export default function GlobalError({ retry }: { retry: () => void }) {
  return <html lang="en"><body style={{ margin: 0, background: "#f6f7f9", color: "#283143", fontFamily: "system-ui, sans-serif" }}><main style={{ maxWidth: 480, margin: "15vh auto", padding: 28 }}><h1 style={{ fontSize: 26 }}>Unable to load the app</h1><p style={{ lineHeight: 1.6 }}>Reserv couldn’t load. Check your connection, then retry.</p><button onClick={retry} style={{ background: "#23395d", color: "white", border: 0, borderRadius: 10, padding: "12px 20px", font: "inherit", cursor: "pointer" }}>Try again</button><button onClick={() => window.location.reload()} style={{ marginLeft: 20, color: "#23395d", background: "transparent", border: 0, font: "inherit", cursor: "pointer" }}>Reload page</button></main></body></html>;
}
