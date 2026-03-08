import { useEffect, useState } from "react";
import { CITY_CONFIGS } from "../cityConfigs";
import { useGameBackend } from "../hooks/useGameBackend";
import { useGameStore } from "../store";

interface PlayerProgressEntry {
  totalMoney: bigint;
  weaponIds: Array<bigint>;
  currentCity: bigint;
  health: bigint;
}

// --- MAIN MENU ---
export function MainMenu() {
  const { phase, setPhase, resetGame, loadProgress } = useGameStore();
  const { loadProgress: loadFromBackend, hasActor } = useGameBackend();
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (phase === "menu" && hasActor && !loaded) {
      setLoaded(true);
      loadFromBackend().then((progress) => {
        if (progress && Number(progress.totalMoney) > 0) {
          loadProgress(
            Number(progress.currentCity),
            Number(progress.totalMoney),
            progress.weaponIds.map(Number),
            Number(progress.health),
          );
        }
      });
    }
  }, [phase, hasActor, loaded, loadFromBackend, loadProgress]);

  if (phase !== "menu") return null;

  const handleStart = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    resetGame();
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 30% 40%, rgba(255,34,68,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(255,204,0,0.08) 0%, transparent 50%), #080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
        overflow: "hidden",
        zIndex: 20,
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div
        style={{ textAlign: "center", marginBottom: 48, position: "relative" }}
      >
        <div
          style={{
            fontSize: "clamp(56px, 12vw, 100px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            lineHeight: 0.9,
            color: "#ff2244",
            textShadow:
              "0 0 40px rgba(255,34,68,0.8), 0 0 80px rgba(255,34,68,0.4), 4px 4px 0 #880011",
            textTransform: "uppercase",
          }}
        >
          CRIME
        </div>
        <div
          style={{
            fontSize: "clamp(56px, 12vw, 100px)",
            fontWeight: 900,
            letterSpacing: "0.05em",
            lineHeight: 0.9,
            color: "#ffcc00",
            textShadow:
              "0 0 40px rgba(255,204,0,0.8), 0 0 80px rgba(255,204,0,0.4), 4px 4px 0 #884400",
            textTransform: "uppercase",
          }}
        >
          TIME
        </div>
        <div
          style={{
            marginTop: 12,
            color: "#555",
            fontSize: 14,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          7 Cities. Unlimited Crime.
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: 260,
        }}
      >
        <button
          type="button"
          data-ocid="menu.primary_button"
          onClick={handleStart}
          disabled={loading}
          style={{
            background: "#ff2244",
            color: "#ffffff",
            border: "none",
            borderRadius: 4,
            padding: "16px 32px",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: 3,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(255,34,68,0.4)",
            textTransform: "uppercase",
          }}
        >
          {loading ? "LOADING..." : "▶ START GAME"}
        </button>
        <button
          type="button"
          data-ocid="menu.secondary_button"
          onClick={() => setPhase("leaderboard")}
          style={{
            background: "transparent",
            color: "#ffcc00",
            border: "2px solid #ffcc00",
            borderRadius: 4,
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: 2,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          🏆 LEADERBOARD
        </button>
      </div>

      {/* Cities preview */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "90%",
        }}
      >
        {CITY_CONFIGS.map((city) => (
          <div
            key={city.name}
            style={{
              padding: "3px 8px",
              background: "rgba(0,0,0,0.6)",
              border: `1px solid ${city.color}44`,
              borderRadius: 3,
              color: city.color,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            {city.name.toUpperCase()}
          </div>
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 12,
          color: "#333",
          fontSize: 10,
          letterSpacing: 1,
        }}
      >
        © {new Date().getFullYear()}.{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#444", textDecoration: "none" }}
        >
          Built with love using caffeine.ai
        </a>
      </div>
    </div>
  );
}

// --- DEAD SCREEN ---
export function DeadScreen() {
  const { phase, money, currentCity, setPhase, resetGame, weapons } =
    useGameStore();
  const { saveProgress } = useGameBackend();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (phase === "dead" && !saved) {
      setSaved(true);
      saveProgress(currentCity, money, weapons, 0);
    }
  }, [phase, saved, currentCity, money, weapons, saveProgress]);

  if (phase !== "dead") return null;

  return (
    <div
      data-ocid="dead.panel"
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
        zIndex: 30,
      }}
    >
      <div
        style={{
          fontSize: "clamp(48px, 10vw, 80px)",
          fontWeight: 900,
          color: "#ff2244",
          textShadow: "0 0 40px rgba(255,34,68,0.8)",
          letterSpacing: "0.1em",
          marginBottom: 24,
        }}
      >
        YOU DIED
      </div>
      <div
        style={{
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: 6,
          padding: "24px 40px",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <div
          style={{
            color: "#888",
            fontSize: 12,
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          FINAL SCORE
        </div>
        <div style={{ color: "#ffcc00", fontSize: 32, fontWeight: 900 }}>
          ${money.toLocaleString()}
        </div>
        <div style={{ color: "#555", fontSize: 12, marginTop: 8 }}>
          Reached: {CITY_CONFIGS[currentCity].name}
        </div>
        <div style={{ color: "#333", fontSize: 11, marginTop: 4 }}>
          Progress saved
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          data-ocid="dead.primary_button"
          onClick={() => {
            setSaved(false);
            resetGame();
          }}
          style={{
            background: "#ff2244",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "14px 28px",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          ↺ RESTART
        </button>
        <button
          type="button"
          data-ocid="dead.secondary_button"
          onClick={() => setPhase("leaderboard")}
          style={{
            background: "transparent",
            color: "#ffcc00",
            border: "2px solid #ffcc00",
            borderRadius: 4,
            padding: "14px 28px",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          LEADERBOARD
        </button>
      </div>
    </div>
  );
}

// --- LEADERBOARD ---
export function LeaderboardScreen() {
  const { phase, setPhase } = useGameStore();
  const { getLeaderboard } = useGameBackend();
  const [entries, setEntries] = useState<PlayerProgressEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (phase === "leaderboard") {
      setLoading(true);
      getLeaderboard()
        .then((data) => setEntries(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [phase, getLeaderboard]);

  if (phase !== "leaderboard") return null;

  const sorted = [...entries].sort(
    (a, b) => Number(b.totalMoney) - Number(a.totalMoney),
  );

  return (
    <div
      data-ocid="leaderboard.panel"
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at 50% 30%, rgba(255,204,0,0.06) 0%, transparent 60%), #080808",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
        zIndex: 20,
      }}
    >
      <div style={{ width: 500, maxWidth: "90vw" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 900,
              color: "#ffcc00",
              letterSpacing: 3,
              textShadow: "0 0 20px rgba(255,204,0,0.4)",
            }}
          >
            🏆 LEADERBOARD
          </div>
        </div>

        <div
          style={{
            background: "#111",
            border: "1px solid #2a2a2a",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 130px 60px",
              padding: "10px 16px",
              background: "#1a1a1a",
              color: "#555",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            <span>#</span>
            <span>CITY</span>
            <span>MONEY</span>
            <span>HP</span>
          </div>

          {loading && (
            <div
              data-ocid="leaderboard.loading_state"
              style={{
                padding: 32,
                textAlign: "center",
                color: "#444",
                fontSize: 14,
              }}
            >
              Loading...
            </div>
          )}

          {!loading && sorted.length === 0 && (
            <div
              data-ocid="leaderboard.empty_state"
              style={{
                padding: 32,
                textAlign: "center",
                color: "#333",
                fontSize: 14,
              }}
            >
              No scores yet — be the first!
            </div>
          )}

          {sorted.map((entry, i) => (
            <div
              key={`rank-${i}-${Number(entry.totalMoney)}`}
              data-ocid={`leaderboard.item.${i + 1}`}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 130px 60px",
                padding: "12px 16px",
                borderTop: "1px solid #1a1a1a",
                color: "#ccc",
              }}
            >
              <span
                style={{
                  color:
                    i === 0
                      ? "#ffcc00"
                      : i === 1
                        ? "#aaaaaa"
                        : i === 2
                          ? "#cc8844"
                          : "#444",
                  fontWeight: 700,
                }}
              >
                {i + 1}
              </span>
              <span
                style={{
                  color:
                    CITY_CONFIGS[Math.min(Number(entry.currentCity), 6)].color,
                }}
              >
                {CITY_CONFIGS[Math.min(Number(entry.currentCity), 6)].name}
              </span>
              <span style={{ color: "#ffcc00", fontWeight: 700 }}>
                ${Number(entry.totalMoney).toLocaleString()}
              </span>
              <span style={{ color: "#ff2244" }}>{Number(entry.health)}</span>
            </div>
          ))}
        </div>

        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 24 }}
        >
          <button
            type="button"
            data-ocid="leaderboard.secondary_button"
            onClick={() => setPhase("menu")}
            style={{
              background: "transparent",
              color: "#666",
              border: "1px solid #333",
              borderRadius: 4,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 2,
            }}
          >
            ← BACK
          </button>
        </div>
      </div>
    </div>
  );
}

// --- CITY TRAVEL BUTTON ---
export function CityTravelButton() {
  const {
    money,
    currentCity,
    setCity,
    addMoney,
    addNotification,
    phase,
    weapons,
    health,
  } = useGameStore();
  const { saveProgress } = useGameBackend();
  const [showModal, setShowModal] = useState(false);

  if (phase !== "playing") return null;

  const nextCityIndex = currentCity + 1;
  const nextCity = CITY_CONFIGS[nextCityIndex];
  if (!nextCity || money < nextCity.unlockCost) return null;

  const handleTravel = () => {
    const cost = nextCity.unlockCost;
    addMoney(-cost);
    setCity(nextCityIndex);
    setShowModal(false);
    addNotification(`MOVED TO ${nextCity.name.toUpperCase()}!`, nextCity.color);
    saveProgress(nextCityIndex, money - cost, weapons, health);
  };

  return (
    <>
      {!showModal && (
        <div
          style={{
            position: "absolute",
            top: "45%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "all",
            zIndex: 10,
          }}
        >
          <button
            type="button"
            data-ocid="travel.open_modal_button"
            onClick={() => setShowModal(true)}
            style={{
              background: nextCity.color,
              color: "#000000",
              border: "none",
              borderRadius: 4,
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: 900,
              cursor: "pointer",
              letterSpacing: 2,
              animation: "pulseCityBtn 1.5s infinite",
            }}
          >
            ✈ TRAVEL TO {nextCity.name.toUpperCase()}
          </button>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "all",
            fontFamily: '"Mona Sans", system-ui, sans-serif',
            zIndex: 15,
          }}
        >
          <div
            data-ocid="travel.dialog"
            style={{
              background: "#111",
              border: `2px solid ${nextCity.color}`,
              borderRadius: 8,
              padding: 32,
              textAlign: "center",
              maxWidth: 380,
              boxShadow: `0 0 40px ${nextCity.color}33`,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>✈</div>
            <div
              style={{
                color: nextCity.color,
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              {nextCity.name.toUpperCase()}
            </div>
            <div style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
              Tougher cops. Bigger rewards. More mayhem.
            </div>
            <div
              style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 4,
                padding: "10px 20px",
                marginBottom: 20,
                color: "#ffcc00",
                fontSize: 20,
                fontWeight: 900,
              }}
            >
              Cost: ${nextCity.unlockCost.toLocaleString()}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                data-ocid="travel.confirm_button"
                onClick={handleTravel}
                style={{
                  background: nextCity.color,
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  padding: "12px 24px",
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  letterSpacing: 1,
                }}
              >
                TRAVEL NOW
              </button>
              <button
                type="button"
                data-ocid="travel.cancel_button"
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #333",
                  borderRadius: 4,
                  padding: "12px 20px",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                STAY
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseCityBtn {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
