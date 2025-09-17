import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * DecryptedText (React Bits Stil)
 * Lightweight, dependency-free text "Entschlüsselungs"-Animation.
 * API angelehnt an React Bits' Decrypted Text.
 */
function DecryptedText({
  text,
  duration = 1200, // Gesamtdauer der Animation in ms
  fps = 60,        // Ziel-FPS für die Animation
  charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{};:'\"|,<.>/?",
  className,
  as: Tag = "span",
}) {
  const [output, setOutput] = useState("");
  const rafRef = useRef(0);

  const letters = useMemo(() => Array.from(text), [text]);
  const totalFrames = Math.max(1, Math.round((duration / 1000) * fps));

  useEffect(() => {
    let frame = 0;

    const animate = () => {
      const progress = frame / totalFrames; // 0 → 1
      const revealedCount = Math.floor(progress * letters.length);

      const next = letters.map((ch, i) => {
        if (i < revealedCount) return ch; // schon "entschlüsselt"
        // während der Animation: zeige zufällige Zeichen an, außer bei Leerzeichen
        if (ch === " ") return " ";
        const randIndex = Math.floor(Math.random() * charset.length);
        return charset[randIndex];
      });

      setOutput(next.join(""));
      frame++;

      if (frame <= totalFrames) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setOutput(text); // abschließend echtes Ziel anzeigen
      }
    };

    // Startzustand: alles verschlüsselt
    setOutput(
      letters
        .map((ch) => (ch === " " ? " " : charset[Math.floor(Math.random() * charset.length)]))
        .join("")
    );

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, duration, fps, charset]);

  return <Tag className={className}>{output}</Tag>;
}

function App() {
  return (
    <div className="App" style={{ display: "grid", placeItems: "center", minHeight: "100svh", gap: "0.5rem", textAlign: "center" }}>
      <DecryptedText
        as="h1"
        className="headline"
        text="Hier wird bald etwas Großes entstehen."
        duration={500}
      />
      <DecryptedText
        as="p"
        className="subtitle"
        text="Seminarkurs Lernapp · Mathematik Oberstufe 🦦"
        duration={300}
      />
    </div>
  );
}

export default App;