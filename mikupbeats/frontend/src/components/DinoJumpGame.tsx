import { useCallback, useEffect, useRef, useState } from "react";

interface DinoJumpGameProps {
  /** Called when the round ends — passes the score for that round */
  onRoundEnd: (gameType: string, score: number) => void;
  disabled: boolean;
}

type GameState = "idle" | "playing" | "dead";

const GAME_TYPE = "dino";
const CANVAS_W = 600;
const CANVAS_H = 200;
const GROUND_Y = 165;
const DINO_W = 32;
const DINO_H = 42;
const DINO_X = 60;
const GRAVITY = 1.1;
const JUMP_VEL = -17;
const OBS_W = 22;

interface Obstacle {
  x: number;
  h: number;
}

const GROUND_DASHES = Array.from({ length: 18 }, (_, i) => ({
  x: i * 34 + 8,
  w: 18 + (i % 3) * 4,
}));

export default function DinoJumpGame({
  onRoundEnd,
  disabled,
}: DinoJumpGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>("idle");
  const dinoYRef = useRef(GROUND_Y - DINO_H);
  const velYRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const speedRef = useRef(5);
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const groundOffsetRef = useRef(0);
  const [gameState, setGameState] = useState<GameState>("idle");

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1625";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    if (stateRef.current === "playing") {
      groundOffsetRef.current =
        (groundOffsetRef.current + speedRef.current) % 34;
    }
    ctx.fillStyle = "#2d1f4e";
    for (const dash of GROUND_DASHES) {
      const dx = (dash.x - groundOffsetRef.current + CANVAS_W) % CANVAS_W;
      ctx.fillRect(dx, GROUND_Y + 4, dash.w, 2);
    }

    ctx.strokeStyle = "#7c3aed";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    if (stateRef.current === "idle") {
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText("JUMPER", CANVAS_W / 2, 68);
      ctx.fillStyle = "#c084fc";
      ctx.font = "14px monospace";
      ctx.fillText("Press SPACE or tap to start", CANVAS_W / 2, 98);
      ctx.fillStyle = "#9333ea";
      ctx.font = "12px monospace";
      ctx.fillText("Avoid the obstacles — jump to survive!", CANVAS_W / 2, 122);

      ctx.fillStyle = "#a855f7";
      ctx.fillRect(DINO_X, GROUND_Y - DINO_H, DINO_W, DINO_H);
      ctx.fillRect(DINO_X + DINO_W - 10, GROUND_Y - DINO_H - 9, 14, 11);
      ctx.fillStyle = "#1a1625";
      ctx.fillRect(DINO_X + DINO_W - 2, GROUND_Y - DINO_H - 5, 5, 5);
      return;
    }

    if (stateRef.current === "dead") {
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_W / 2, 63);
      ctx.fillStyle = "#c084fc";
      ctx.font = "16px monospace";
      ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_W / 2, 93);
      ctx.fillStyle = "#7c3aed";
      ctx.font = "13px monospace";
      ctx.fillText("Press SPACE or tap to play again", CANVAS_W / 2, 122);

      ctx.fillStyle = "#6b21a8";
      ctx.fillRect(DINO_X, GROUND_Y - DINO_H, DINO_W, DINO_H);
      ctx.fillRect(DINO_X + DINO_W - 10, GROUND_Y - DINO_H - 9, 14, 11);
      ctx.fillStyle = "#e9d5ff";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("X", DINO_X + DINO_W - 10, GROUND_Y - DINO_H - 1);
      return;
    }

    velYRef.current += GRAVITY;
    if (velYRef.current > 22) velYRef.current = 22;
    dinoYRef.current += velYRef.current;

    if (dinoYRef.current >= GROUND_Y - DINO_H) {
      dinoYRef.current = GROUND_Y - DINO_H;
      velYRef.current = 0;
    }

    frameRef.current++;
    scoreRef.current = Math.floor(frameRef.current / 5);
    speedRef.current = 5 + Math.floor(scoreRef.current / 150) * 0.7;

    const spawnInterval = Math.max(
      52,
      105 - Math.floor(scoreRef.current / 80) * 5,
    );
    if (frameRef.current % spawnInterval === 0) {
      const h = 22 + Math.random() * 36;
      obstaclesRef.current.push({ x: CANVAS_W + 10, h });
    }

    obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.x > -OBS_W);
    for (const obs of obstaclesRef.current) {
      obs.x -= speedRef.current;
      ctx.fillStyle = "#7c3aed";
      ctx.fillRect(obs.x, GROUND_Y - obs.h, OBS_W, obs.h);
      ctx.fillStyle = "#9333ea";
      ctx.fillRect(obs.x - 5, GROUND_Y - obs.h - 9, OBS_W + 10, 11);
      if (obs.h > 35) {
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(obs.x - 9, GROUND_Y - obs.h + 10, 10, 8);
        ctx.fillStyle = "#9333ea";
        ctx.fillRect(obs.x - 9, GROUND_Y - obs.h + 7, 10, 4);
      }
    }

    const onGround = dinoYRef.current >= GROUND_Y - DINO_H - 1;
    const legPhase = Math.floor(frameRef.current / 4) % 2;

    ctx.fillStyle = "#a855f7";
    ctx.fillRect(DINO_X, dinoYRef.current, DINO_W, DINO_H);
    ctx.fillRect(DINO_X + DINO_W - 10, dinoYRef.current - 9, 14, 11);
    ctx.fillStyle = "#1a1625";
    ctx.fillRect(DINO_X + DINO_W - 2, dinoYRef.current - 5, 5, 5);
    if (onGround) {
      ctx.fillStyle = "#9333ea";
      ctx.fillRect(DINO_X + 4, GROUND_Y, 9, legPhase ? 11 : 6);
      ctx.fillRect(DINO_X + 17, GROUND_Y, 9, legPhase ? 6 : 11);
    }

    ctx.fillStyle = "#c084fc";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${scoreRef.current}`, CANVAS_W - 16, 28);

    const dinoBox = {
      x: DINO_X + 6,
      y: dinoYRef.current + 5,
      w: DINO_W - 10,
      h: DINO_H - 6,
    };
    for (const obs of obstaclesRef.current) {
      if (
        dinoBox.x < obs.x + OBS_W - 3 &&
        dinoBox.x + dinoBox.w > obs.x + 3 &&
        dinoBox.y + dinoBox.h > GROUND_Y - obs.h + 3
      ) {
        const roundScore = scoreRef.current;
        stateRef.current = "dead";
        setGameState("dead");
        cancelAnimationFrame(rafRef.current);
        // Notify parent of round end — tokens accumulate there
        onRoundEnd(GAME_TYPE, roundScore);
        return;
      }
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [onRoundEnd]);

  const startGame = useCallback(() => {
    stateRef.current = "playing";
    dinoYRef.current = GROUND_Y - DINO_H;
    velYRef.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    speedRef.current = 5;
    frameRef.current = 0;
    groundOffsetRef.current = 0;
    setGameState("playing");
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(drawFrame);
  }, [drawFrame]);

  const jump = useCallback(() => {
    // Always restart on idle or dead — completely independent of token earning
    if (stateRef.current === "idle" || stateRef.current === "dead") {
      startGame();
      return;
    }
    if (
      stateRef.current === "playing" &&
      dinoYRef.current >= GROUND_Y - DINO_H - 3
    ) {
      velYRef.current = JUMP_VEL;
    }
  }, [startGame]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  // Window-level touch handler — catches touch events even when the game is
  // in 'dead' state and the canvas itself has pointerEvents: none.
  // This ensures restart always works on mobile regardless of token earning.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWindowTouch = (e: TouchEvent) => {
      // Only act if the touch is over our container
      const target = e.target as Node | null;
      if (container.contains(target)) {
        // Only prevent default if in dead/idle state to avoid blocking scroll
        if (stateRef.current === "dead" || stateRef.current === "idle") {
          e.preventDefault();
          jump();
        }
      }
    };

    window.addEventListener("touchstart", onWindowTouch, { passive: false });
    return () => window.removeEventListener("touchstart", onWindowTouch);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1a1625";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawFrame();
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawFrame]);

  // gameState is used to make the component re-render when state changes
  void gameState;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-3"
      data-ocid="dino_game.canvas_target"
      onClick={jump}
      onKeyDown={(e) => {
        if (e.code === "Space" || e.code === "Enter") jump();
      }}
      onTouchStart={(e) => {
        // preventDefault stops scroll hijack; jump handles restart independently
        e.preventDefault();
        jump();
      }}
      style={{
        cursor: "pointer",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          maxWidth: "100%",
          display: "block",
          borderRadius: "8px",
          border: "1px solid #3b1f6b",
          pointerEvents: "none",
        }}
        tabIndex={0}
        role="img"
        aria-label="Jumper game canvas"
      />
      {disabled && (
        <p className="text-xs text-muted-foreground text-center">
          Daily games cap reached — come back tomorrow!
        </p>
      )}
    </div>
  );
}
