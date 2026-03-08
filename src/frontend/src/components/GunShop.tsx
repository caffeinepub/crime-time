import { WEAPON_CONFIGS, useGameStore } from "../store";

export function GunShop() {
  const {
    inGunShop,
    money,
    weapons,
    buyWeapon,
    setInGunShop,
    addNotification,
  } = useGameStore();

  if (!inGunShop) return null;

  const handleBuy = (weaponId: number, cost: number, name: string) => {
    const success = buyWeapon(weaponId, cost);
    if (success) {
      addNotification(`BOUGHT ${name.toUpperCase()}!`, "#ffcc00");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
        background: "rgba(0,0,0,0.75)",
        fontFamily: '"Mona Sans", system-ui, sans-serif',
      }}
    >
      <div
        data-ocid="gunshop.panel"
        style={{
          background: "#111111",
          border: "2px solid #ffcc00",
          borderRadius: 6,
          padding: 24,
          width: 480,
          maxWidth: "90vw",
          boxShadow: "0 0 40px rgba(255,204,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                color: "#ffcc00",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 2,
              }}
            >
              🔫 GUN SHOP
            </div>
            <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>
              Cash on hand:{" "}
              <span style={{ color: "#ffcc00", fontWeight: 700 }}>
                ${money.toLocaleString()}
              </span>
            </div>
          </div>
          <button
            type="button"
            data-ocid="gunshop.close_button"
            onClick={() => setInGunShop(false)}
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 4,
              color: "#888",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Weapon list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {WEAPON_CONFIGS.map((weapon) => {
            const owned = weapons.includes(weapon.id);
            const canAfford = money >= weapon.cost;

            return (
              <div
                key={weapon.id}
                data-ocid={`gunshop.item.${weapon.id + 1}`}
                style={{
                  background: "#181818",
                  border: `1px solid ${owned ? "#00ff88" : "#2a2a2a"}`,
                  borderRadius: 4,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {/* Weapon color dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: weapon.color,
                    boxShadow: `0 0 6px ${weapon.color}`,
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{ color: "#ffffff", fontSize: 14, fontWeight: 700 }}
                  >
                    {weapon.name}
                    {owned && (
                      <span
                        style={{
                          marginLeft: 8,
                          background: "#003322",
                          color: "#00ff88",
                          fontSize: 10,
                          padding: "2px 6px",
                          borderRadius: 2,
                          fontWeight: 600,
                        }}
                      >
                        OWNED
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 4,
                      color: "#666",
                      fontSize: 11,
                    }}
                  >
                    <span>
                      DMG:{" "}
                      <span style={{ color: "#ff8800" }}>{weapon.damage}</span>
                    </span>
                    <span>
                      RPM:{" "}
                      <span style={{ color: "#4488cc" }}>
                        {Math.round(60000 / weapon.fireRate)}
                      </span>
                    </span>
                    <span>
                      AMMO:{" "}
                      <span style={{ color: "#ffcc00" }}>{weapon.ammoMax}</span>
                    </span>
                  </div>
                </div>

                {/* Price / Buy */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {weapon.cost === 0 ? (
                    <div
                      style={{
                        color: "#00ff88",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      FREE
                    </div>
                  ) : (
                    <div
                      style={{
                        color: "#ffcc00",
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      ${weapon.cost.toLocaleString()}
                    </div>
                  )}
                  {!owned && weapon.cost > 0 && (
                    <button
                      type="button"
                      data-ocid={`gunshop.primary_button.${weapon.id + 1}`}
                      onClick={() =>
                        handleBuy(weapon.id, weapon.cost, weapon.name)
                      }
                      disabled={!canAfford}
                      style={{
                        background: canAfford ? "#ffcc00" : "#1a1a1a",
                        color: canAfford ? "#000000" : "#444",
                        border: "none",
                        borderRadius: 3,
                        padding: "5px 14px",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: canAfford ? "pointer" : "not-allowed",
                        letterSpacing: 1,
                      }}
                    >
                      BUY
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
