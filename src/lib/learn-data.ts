export interface ThinkCard {
  icon: string;
  title: string;
  intro: string;
  points: string[];
}

export const THINK_CARDS: ThinkCard[] = [
  {
    icon: "🧭",
    title: "La rutina de 4 preguntas",
    intro: "Antes de CADA jugada, hazte estas preguntas. Es lo que separa a quien juega rápido de quien juega bien.",
    points: [
      "1. ¿Qué hizo mi rival? ¿Qué quiere hacer con esa jugada?",
      "2. ¿Qué amenazas tengo? ¿Hay piezas mías sin protección?",
      "3. ¿Qué puedo hacer yo? Revisa en este orden: Jaques → Capturas → Amenazas.",
      "4. ¿Es segura mi jugada? Mira dónde queda la pieza y qué deja de proteger.",
    ],
  },
  {
    icon: "⚖️",
    title: "Valor de las piezas",
    intro: "Para decidir si un cambio te conviene, cuenta puntos. No regales material.",
    points: [
      "Peón = 1 · Caballo = 3 · Alfil = 3 · Torre = 5 · Dama = 9.",
      "Cambiar una torre (5) por un caballo (3) es perder 2 puntos.",
      "Tener dos alfiles juntos suele valer un poco más que alfil + caballo.",
      "Si vas ganando material, cambia piezas. Si vas perdiendo, evita cambios.",
    ],
  },
  {
    icon: "🛡️",
    title: "Piezas colgadas: el error #1",
    intro: "Más del 80% de las partidas por debajo de 1200 se deciden por una pieza regalada.",
    points: [
      "Una pieza «colgada» es una pieza que nadie protege.",
      "Antes de soltar tu pieza, comprueba si queda atacada y si está protegida.",
      "Antes de capturar, mira si te pueden recapturar y cuánto ganas o pierdes.",
      "Mira tus piezas Y las del rival: si él deja una colgada, ¡cómetela!",
    ],
  },
  {
    icon: "🏁",
    title: "Las 3 fases de la partida",
    intro: "Cada fase tiene objetivos distintos. Saber en cuál estás te dice qué hacer.",
    points: [
      "Apertura: controla el centro, desarrolla caballos y alfiles, enroca (≈ 10 jugadas).",
      "Medio juego: busca un plan: mejora tu peor pieza, ataca puntos débiles, coordina torres.",
      "Final: activa el rey, crea peones pasados, las torres detrás de los peones.",
      "En el medio juego, si no tienes plan, mejora tu pieza menos activa.",
    ],
  },
  {
    icon: "🎯",
    title: "Tácticas que debes conocer",
    intro: "Casi todas las tácticas son una de estas ideas. Aprende a reconocerlas.",
    points: [
      "Horquilla: una pieza ataca dos a la vez (el caballo es el rey de las horquillas).",
      "Clavada: una pieza no puede moverse porque expondría otra más valiosa.",
      "Ataque descubierto: mueves una pieza y destapas el ataque de otra.",
      "Mate del pasillo: el rey está atrapado tras sus propios peones en la última fila.",
    ],
  },
  {
    icon: "🧠",
    title: "Gestiona tu tiempo y tu cabeza",
    intro: "El ajedrez también es control emocional.",
    points: [
      "Si ves una jugada «obvia», pausa 5 segundos: ¿hay algo mejor? ¿hay trampa?",
      "No juegues rápido por ansiedad. Una buena jugada vale más que diez rápidas.",
      "Después de perder, revisa la partida con el entrenador. Los errores son tu mejor maestro.",
      "Juega siempre con un plan simple, aunque sea pequeño.",
    ],
  },
];

export interface Opening {
  id: string;
  name: string;
  side: "Blancas" | "Negras";
  level: "Fácil" | "Media" | "Avanzada";
  moves: string[];
  idea: string;
  plans: string[];
  mistake: string;
}

export const OPENINGS: Opening[] = [
  {
    id: "italiana",
    name: "Apertura Italiana",
    side: "Blancas",
    level: "Fácil",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6"],
    idea: "Desarrollo rápido y presión sobre f7, el punto más débil de las negras. Ideal para aprender los principios básicos.",
    plans: ["Enroca pronto (O-O).", "Prepara d4 con c3 para ocupar el centro.", "Lleva el caballo b1 a d2 y luego a f1 → g3."],
    mistake: "Sacar la dama demasiado pronto (Qh5) y atacar sin desarrollar piezas.",
  },
  {
    id: "espanola",
    name: "Apertura Española (Ruy López)",
    side: "Blancas",
    level: "Media",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"],
    idea: "El alfil presiona al caballo que defiende e5. Es una de las aperturas más jugadas por grandes maestros.",
    plans: ["Enroca y prepara c3 y d4.", "Mantén la tensión sobre el centro.", "Piensa a largo plazo: la presión crece poco a poco."],
    mistake: "Cambiar el alfil por el caballo sin motivo y perder el par de alfiles.",
  },
  {
    id: "londres",
    name: "Sistema Londres",
    side: "Blancas",
    level: "Fácil",
    moves: ["d4", "d5", "Bf4", "Nf6", "e3", "e6", "Nf3", "Bd6", "Bg3", "O-O"],
    idea: "Un esquema sólido que casi no cambia: desarrollas el alfil de casillas blancas ANTES de cerrar la cadena de peones.",
    plans: ["Desarrolla Nf3, Bd3, Nbd2 y enroca.", "Ataca con c3 y Ne5.", "Cuidado con los cambios de tu alfil en f4."],
    mistake: "Jugar siempre igual sin mirar lo que hace el rival (por ejemplo, ignorar ...c5 o ...Qb6).",
  },
  {
    id: "gambito",
    name: "Gambito de Dama",
    side: "Blancas",
    level: "Media",
    moves: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O"],
    idea: "Ofreces un peón (c4) para desviar el peón negro de d5 y conseguir más centro. Si lo aceptan, lo recuperas.",
    plans: ["Desarrolla con Nc3, Nf3, Bg5 y e3.", "Aprovecha tu ventaja en el centro.", "Ataca en el ala de dama con mayoría de peones."],
    mistake: "Aferrarte a recuperar el peón y descuidar el desarrollo.",
  },
  {
    id: "siciliana",
    name: "Defensa Siciliana",
    side: "Negras",
    level: "Avanzada",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    idea: "La mejor defensa estadística contra 1.e4: luchas por el centro desde el flanco y buscas ganar. Partidas muy dinámicas.",
    plans: ["Cambia el peón c por el peón d de las blancas.", "Usa la columna c abierta con tus torres.", "Contraataca en el ala de dama."],
    mistake: "Perder tiempo con peones mientras las blancas atacan al rey.",
  },
  {
    id: "francesa",
    name: "Defensa Francesa",
    side: "Negras",
    level: "Media",
    moves: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7"],
    idea: "Una defensa sólida: creas una cadena de peones y atacas el centro blanco con ...c5 y ...f6.",
    plans: ["Juega ...c5 para minar el centro.", "Ataca la base de la cadena (d4).", "Cuida tu alfil de casillas blancas, es tu pieza «mala»."],
    mistake: "Dejar el alfil de c8 encerrado toda la partida.",
  },
  {
    id: "escandinava",
    name: "Defensa Escandinava",
    side: "Negras",
    level: "Fácil",
    moves: ["e4", "d5", "exd5", "Qxd5", "Nc3", "Qa5", "d4", "Nf6", "Nf3", "c6"],
    idea: "Atacas el centro de inmediato. Es sencilla de aprender: pocas variantes y planes claros.",
    plans: ["Desarrolla con ...Nf6, ...c6, ...Bf5 antes de cerrar con ...e6.", "Enroca rápido.", "Retira la dama a un lugar seguro (a5 o d6)."],
    mistake: "Mover mucho la dama y quedar atrasado en desarrollo.",
  },
  {
    id: "india",
    name: "Defensa India de Rey",
    side: "Negras",
    level: "Avanzada",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O"],
    idea: "Dejas que las blancas ocupen el centro para atacarlo después con ...e5 o ...c5. Muy favorita de jugadores agresivos.",
    plans: ["Enroca corto rápidamente.", "Prepara ...e5 o ...c5.", "Lanza un ataque con ...f5 y peones al rey blanco."],
    mistake: "Atacar demasiado pronto sin tener preparado el centro.",
  },
];

export interface Puzzle {
  id: number;
  title: string;
  fen: string;
  solution: string; // SAN
  theme: string;
  hint: string;
  explain: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: 1,
    title: "Mate del pasillo",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    solution: "Rd8#",
    theme: "Mate en 1",
    hint: "El rey negro está atrapado detrás de sus propios peones.",
    explain: "Rd8# es mate del pasillo: el rey no tiene casillas libres porque sus peones le tapan la salida.",
  },
  {
    id: 2,
    title: "El salto del caballo",
    fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
    solution: "Nc7+",
    theme: "Horquilla",
    hint: "Busca una casilla desde la que el caballo ataque al rey y a la torre a la vez.",
    explain: "Nc7+ ataca al rey y a la torre de a8 al mismo tiempo. El rey se mueve y el caballo se come la torre.",
  },
  {
    id: 3,
    title: "¡Dama regalada!",
    fen: "4k3/8/8/3q4/8/8/8/3RK3 w - - 0 1",
    solution: "Rxd5",
    theme: "Pieza colgada",
    hint: "Mira qué piezas del rival están sin protección.",
    explain: "La dama negra está en d5 sin que nada la proteja. Rxd5 gana la pieza más valiosa. ¡Siempre busca piezas colgadas!",
  },
  {
    id: 4,
    title: "Mate ahogado",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    solution: "Nf7#",
    theme: "Mate en 1",
    hint: "El rey negro está rodeado por sus propias piezas. ¿Qué pieza salta por encima de todo?",
    explain: "Nf7# es el famoso «mate de la coz»: el rey, rodeado por su torre y sus peones, no puede escapar del caballo.",
  },
  {
    id: 5,
    title: "El mate del pastor",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: "Qxf7#",
    theme: "Mate en 1",
    hint: "Dama y alfil apuntan al mismo punto débil: f7.",
    explain: "Qxf7# ¡mate en 4 jugadas! Si juegas con negras, defiende siempre f7 (por ejemplo con ...Nf6 o ...g6).",
  },
];
