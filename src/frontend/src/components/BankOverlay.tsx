import { useGameStore } from "../store";

export function BankOverlay() {
  const { inBank, bankRobbed, phase } = useGameStore();

  if (phase !== "playing" || !inBank) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        textAlign: "center",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "1px solid #ff2244",
          borderRadius: 4,
          padding: "8px 20px",
          color: "#ff2244",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        {bankRobbed ? "ESCAPE! COPS SWARMING!" : "INSIDE BANK — PRESS E TO ROB"}
      </div>
    </div>
  );
}
