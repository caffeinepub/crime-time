import { CITY_CONFIGS } from "../cityConfigs";
import { WEAPON_CONFIGS, useGameStore } from "../store";

export function HUD() {
  const {
    health,
    money,
    wantedLevel,
    activeWeapon,
    ammo,
    currentCity,
    notifications,
    phase,
  } = useGameStore();

  if (phase !== "playing") return null;

  const cityConfig = CITY_CONFIGS[currentCity];
  const nextCity = CITY_CONFIGS[currentCity + 1];
  const weapon = WEAPON_CONFIGS[activeWeapon];
  const currentAmmo = ammo[activeWeapon] ?? 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
        userSelect: "none",
      }}
    >
      {/* TOP LEFT - Health + Money */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Health */}
        <div
          data-ocid="hud.panel"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              color: "#ff2244",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            ❤ HP
          </span>
          <div
            style={{
              width: 120,
              height: 10,
              background: "#1a0000",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${health}%`,
                height: "100%",
                background:
                  health > 50 ? "#00dd44" : health > 25 ? "#ffaa00" : "#ff2244",
                transition: "width 0.2s, background 0.2s",
              }}
            />
          </div>
          <span style={{ color: "#ffffff", fontSize: 12, minWidth: 28 }}>
            {health}
          </span>
        </div>

        {/* Money */}
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid #333",
            borderRadius: 4,
            padding: "6px 10px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: "#ffcc00", fontSize: 14, fontWeight: 900 }}>
            $
          </span>
          <span style={{ color: "#ffcc00", fontSize: 18, fontWeight: 900 }}>
            {money.toLocaleString()}
          </span>
        </div>
      </div>

      {/* TOP RIGHT - Wanted Level */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <div
          data-ocid="hud.panel"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${wantedLevel > 0 ? "#ff2244" : "#333"}`,
            borderRadius: 4,
            padding: "6px 10px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 3,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#888",
                letterSpacing: 1,
                marginRight: 6,
                fontWeight: 600,
              }}
            >
              WANTED
            </span>
            {(["s1", "s2", "s3", "s4", "s5"] as string[]).map((sk, i) => (
              <span
                key={sk}
                style={{
                  fontSize: 18,
                  color: i < wantedLevel ? "#ff2244" : "#333333",
                  filter:
                    i < wantedLevel ? "drop-shadow(0 0 4px #ff2244)" : "none",
                }}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM LEFT - Weapon */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: "rgba(0,0,0,0.7)",
          border: "1px solid #333",
          borderRadius: 4,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: weapon?.color ?? "#888",
            boxShadow: `0 0 6px ${weapon?.color ?? "#888"}`,
          }}
        />
        <div>
          <div style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}>
            {weapon?.name ?? "Fists"}
          </div>
          <div
            style={{
              color: currentAmmo === 0 ? "#ff2244" : "#ffcc00",
              fontSize: 12,
            }}
          >
            {currentAmmo} / {weapon?.ammoMax ?? 0}
          </div>
        </div>
      </div>

      {/* BOTTOM RIGHT - City progress + Minimap */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* City info */}
        <div
          style={{
            background: "rgba(0,0,0,0.7)",
            border: `1px solid ${cityConfig.color}44`,
            borderRadius: 4,
            padding: "6px 10px",
            textAlign: "right",
          }}
        >
          <div
            style={{
              color: cityConfig.color,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 1,
              textShadow: `0 0 8px ${cityConfig.color}`,
            }}
          >
            {cityConfig.name.toUpperCase()}
          </div>
          {nextCity && (
            <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
              Next: ${nextCity.unlockCost.toLocaleString()}{" "}
              {money >= nextCity.unlockCost && (
                <span style={{ color: "#00ff88" }}>✓ READY</span>
              )}
            </div>
          )}
        </div>

        {/* Minimap */}
        <Minimap />
      </div>

      {/* CENTER TOP - Notifications */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
        }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              background: "rgba(0,0,0,0.85)",
              border: `1px solid ${n.color}`,
              borderRadius: 4,
              padding: "8px 20px",
              color: n.color,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 2,
              textShadow: `0 0 10px ${n.color}`,
              animation: "fadeInOut 3s forwards",
            }}
          >
            {n.text}
          </div>
        ))}
      </div>

      {/* CONTROLS HINT */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid #222",
          borderRadius: 4,
          padding: "4px 12px",
          color: "#555",
          fontSize: 10,
          letterSpacing: 0.5,
        }}
      >
        WASD Move · Click/Space Shoot · E Interact · 1-4 Weapons
      </div>

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-10px); }
          15% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Minimap() {
  const { currentCity } = useGameStore();
  const cityConfig = CITY_CONFIGS[currentCity];

  return (
    <div
      style={{
        width: 120,
        height: 120,
        background: "rgba(0,0,0,0.85)",
        border: `1px solid ${cityConfig.color}44`,
        borderRadius: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Map background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${cityConfig.fogColor} 0%, #080808 100%)`,
        }}
      />

      {/* Bank dot */}
      <div
        style={{
          position: "absolute",
          left: "75%",
          top: "50%",
          width: 8,
          height: 8,
          background: "#ff2244",
          borderRadius: 1,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 4px #ff2244",
        }}
        title="BANK"
      />

      {/* Gun shop dot */}
      <div
        style={{
          position: "absolute",
          left: "25%",
          top: "62%",
          width: 8,
          height: 8,
          background: "#ffcc00",
          borderRadius: 1,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 4px #ffcc00",
        }}
        title="GUN SHOP"
      />

      {/* Player dot */}
      <PlayerMinimapDot />

      {/* Labels */}
      <div
        style={{
          position: "absolute",
          bottom: 2,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-around",
          fontSize: 7,
          color: "#555",
        }}
      >
        <span style={{ color: "#ff2244" }}>■ BANK</span>
        <span style={{ color: "#ffcc00" }}>■ SHOP</span>
      </div>
    </div>
  );
}

function PlayerMinimapDot() {
  // This would ideally get player position from a shared ref
  // For now show in center
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 6,
        height: 6,
        background: "#ffffff",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 4px #ffffff",
        zIndex: 10,
      }}
    />
  );
}
