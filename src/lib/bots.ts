export interface Bot {
  elo: number;
  name: string;
  emoji: string;
  tagline: string;
  tier: "Principiante" | "Intermedio" | "Avanzado" | "Maestro";
}

export const BOTS: Bot[] = [
  { elo: 100, name: "Pichón", emoji: "🐣", tagline: "Recién aprende cómo se mueven las piezas.", tier: "Principiante" },
  { elo: 200, name: "Tortuga", emoji: "🐢", tagline: "Lento y distraído, regala piezas.", tier: "Principiante" },
  { elo: 300, name: "Conejo", emoji: "🐰", tagline: "Muy rápido, poco cuidado.", tier: "Principiante" },
  { elo: 400, name: "Gatito", emoji: "🐱", tagline: "Juega por instinto y a veces acierta.", tier: "Principiante" },
  { elo: 500, name: "Perro Fiel", emoji: "🐶", tagline: "Persigue tus piezas sin pensar mucho.", tier: "Principiante" },
  { elo: 600, name: "Zorro", emoji: "🦊", tagline: "Ya conoce algunas trampas simples.", tier: "Principiante" },
  { elo: 800, name: "Búho", emoji: "🦉", tagline: "Mira un poco más adelante.", tier: "Intermedio" },
  { elo: 1000, name: "Lobo", emoji: "🐺", tagline: "Castiga las piezas sin defensa.", tier: "Intermedio" },
  { elo: 1200, name: "Halcón", emoji: "🦅", tagline: "Táctico y bastante estable.", tier: "Intermedio" },
  { elo: 1400, name: "Tigre", emoji: "🐯", tagline: "Ataca con ideas claras.", tier: "Intermedio" },
  { elo: 1600, name: "Club Local", emoji: "♟️", tagline: "Jugador de club con buena base.", tier: "Intermedio" },
  { elo: 1800, name: "Capitán", emoji: "🎖️", tagline: "Pocas veces regala material.", tier: "Avanzado" },
  { elo: 2000, name: "Experto", emoji: "🎓", tagline: "Nivel de torneo, muy sólido.", tier: "Avanzado" },
  { elo: 2200, name: "Candidato", emoji: "🔥", tagline: "Estratega y táctico implacable.", tier: "Avanzado" },
  { elo: 2400, name: "Maestro Internacional", emoji: "🏅", tagline: "Casi no falla en táctica.", tier: "Maestro" },
  { elo: 2600, name: "Gran Maestro", emoji: "👑", tagline: "Nivel de élite mundial.", tier: "Maestro" },
  { elo: 2800, name: "Súper GM", emoji: "🧠", tagline: "Entre los mejores de la historia.", tier: "Maestro" },
  { elo: 3000, name: "Titán", emoji: "⚡", tagline: "Prácticamente imbatible para un humano.", tier: "Maestro" },
  { elo: 3200, name: "Motor", emoji: "🤖", tagline: "Stockfish con fuerza casi total.", tier: "Maestro" },
  { elo: 3500, name: "Stockfish", emoji: "🐟", tagline: "Fuerza máxima. Buena suerte.", tier: "Maestro" },
];

export function botByElo(elo: number): Bot {
  return BOTS.find((b) => b.elo === elo) ?? BOTS[0];
}

export const TIERS: Bot["tier"][] = ["Principiante", "Intermedio", "Avanzado", "Maestro"];
