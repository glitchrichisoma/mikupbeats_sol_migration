import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
interface FlappyBirdGameProps {
  /** Called when the round ends — passes the score for that round */
  onRoundEnd: (gameType: string, score: number) => void;
  disabled: boolean;
  onGameStateChange?: (state: GameState) => void;
}

export interface FlappyBirdGameHandle {
  flap: () => void;
}

type GameState = "idle" | "playing" | "dead";

const GAME_TYPE = "flappy";
const CANVAS_W = 400;
const CANVAS_H = 500;
const BIRD_X = 90;
const BIRD_R = 15;
const GRAVITY = 0.55;
const FLAP_VEL = -8;
const PIPE_W = 52;
const PIPE_GAP = 175;
const PIPE_SPEED = 2.6;
const PIPE_INTERVAL = 95;

interface Pipe {
  x: number;
  topH: number;
  passed: boolean;
}

const FlappyBirdGame = forwardRef<FlappyBirdGameHandle, FlappyBirdGameProps>(
  ({ onRoundEnd, disabled, onGameStateChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const stateRef = useRef<GameState>("idle");
    const birdYRef = useRef(CANVAS_H / 2);
    const velYRef = useRef(0);
    const pipesRef = useRef<Pipe[]>([]);
    const scoreRef = useRef(0);
    const frameRef = useRef(0);
    const rafRef = useRef<number>(0);
    const [, setGameState] = useState<GameState>("idle");

    // Use a ref for onRoundEnd to avoid stale closure in the memoized drawFrame
    const onRoundEndRef = useRef(onRoundEnd);
    useEffect(() => {
      onRoundEndRef.current = onRoundEnd;
    }, [onRoundEnd]);

    const drawFrame = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0f0d1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = "#2d1f4e";
      ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 44);
      ctx.fillStyle = "#4c2880";
      ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 3);

      if (stateRef.current === "idle") {
        const bobY = CANVAS_H / 2 + Math.sin(Date.now() / 280) * 5;
        ctx.save();
        ctx.translate(BIRD_X, bobY);
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9333ea";
        ctx.beginPath();
        ctx.ellipse(-5, 5, 11, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f0e0ff";
        ctx.beginPath();
        ctx.arc(6, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1a1625";
        ctx.beginPath();
        ctx.arc(7, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#c084fc";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("FLAPPY", CANVAS_W / 2, CANVAS_H / 2 - 68);
        ctx.fillStyle = "#a855f7";
        ctx.font = "14px monospace";
        ctx.fillText("Tap anywhere to start", CANVAS_W / 2, CANVAS_H / 2 + 65);
        ctx.fillStyle = "#7c3aed";
        ctx.font = "12px monospace";
        ctx.fillText("Fly through the pipes!", CANVAS_W / 2, CANVAS_H / 2 + 86);

        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      if (stateRef.current === "dead") {
        ctx.fillStyle = "#c084fc";
        ctx.font = "bold 26px monospace";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 32);
        ctx.fillStyle = "#a855f7";
        ctx.font = "18px monospace";
        ctx.fillText(
          `Score: ${scoreRef.current}`,
          CANVAS_W / 2,
          CANVAS_H / 2 + 10,
        );
        ctx.fillStyle = "#7c3aed";
        ctx.font = "13px monospace";
        ctx.fillText(
          "Tap anywhere to play again",
          CANVAS_W / 2,
          CANVAS_H / 2 + 46,
        );
        return;
      }

      frameRef.current++;

      velYRef.current += GRAVITY;
      if (velYRef.current > 16) velYRef.current = 16;
      birdYRef.current += velYRef.current;

      if (frameRef.current % PIPE_INTERVAL === 0) {
        const minTop = 50;
        const maxTop = CANVAS_H - 44 - PIPE_GAP - 50;
        const topH = minTop + Math.random() * (maxTop - minTop);
        pipesRef.current.push({ x: CANVAS_W, topH, passed: false });
      }

      pipesRef.current = pipesRef.current.filter((p) => p.x > -PIPE_W);
      for (const pipe of pipesRef.current) {
        pipe.x -= PIPE_SPEED;

        ctx.fillStyle = "#5b21b6";
        ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(pipe.x - 5, pipe.topH - 18, PIPE_W + 10, 18);
        ctx.fillStyle = "#6d28d9";
        ctx.fillRect(pipe.x + 6, 0, 6, pipe.topH - 18);

        const botY = pipe.topH + PIPE_GAP;
        ctx.fillStyle = "#5b21b6";
        ctx.fillRect(pipe.x, botY, PIPE_W, CANVAS_H - 44 - botY);
        ctx.fillStyle = "#7c3aed";
        ctx.fillRect(pipe.x - 5, botY, PIPE_W + 10, 18);
        ctx.fillStyle = "#6d28d9";
        ctx.fillRect(pipe.x + 6, botY + 18, 6, CANVAS_H - 44 - botY - 18);

        if (!pipe.passed && pipe.x + PIPE_W < BIRD_X) {
          pipe.passed = true;
          scoreRef.current++;
        }
      }

      const angle = Math.max(-0.45, Math.min(0.7, velYRef.current * 0.07));
      ctx.save();
      ctx.translate(BIRD_X, birdYRef.current);
      ctx.rotate(angle);

      ctx.fillStyle = "#a855f7";
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();

      const wingSin = Math.sin(frameRef.current * 0.35);
      ctx.fillStyle = "#9333ea";
      ctx.beginPath();
      ctx.ellipse(-5, 4 + wingSin * 3, 11, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e9d5ff";
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 1, -2);
      ctx.lineTo(BIRD_R + 7, 0);
      ctx.lineTo(BIRD_R - 1, 3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#f0e0ff";
      ctx.beginPath();
      ctx.arc(5, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1625";
      ctx.beginPath();
      ctx.arc(6, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${scoreRef.current}`, CANVAS_W / 2, 38);

      if (
        birdYRef.current - BIRD_R <= 0 ||
        birdYRef.current + BIRD_R >= CANVAS_H - 44
      ) {
        killGame();
        return;
      }

      for (const pipe of pipesRef.current) {
        if (
          BIRD_X + BIRD_R - 4 > pipe.x + 4 &&
          BIRD_X - BIRD_R + 4 < pipe.x + PIPE_W - 4
        ) {
          if (
            birdYRef.current - BIRD_R + 4 < pipe.topH ||
            birdYRef.current + BIRD_R - 4 > pipe.topH + PIPE_GAP
          ) {
            killGame();
            return;
          }
        }
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const killGame = useCallback(() => {
      const roundScore = scoreRef.current;
      stateRef.current = "dead";
      setGameState("dead");
      onGameStateChange?.("dead");
      cancelAnimationFrame(rafRef.current);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#0f0d1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#2d1f4e";
      ctx.fillRect(0, CANVAS_H - 44, CANVAS_W, 44);
      ctx.fillStyle = "#c084fc";
      ctx.font = "bold 26px monospace";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 32);
      ctx.fillStyle = "#a855f7";
      ctx.font = "18px monospace";
      ctx.fillText(
        `Score: ${scoreRef.current}`,
        CANVAS_W / 2,
        CANVAS_H / 2 + 10,
      );
      ctx.fillStyle = "#7c3aed";
      ctx.font = "13px monospace";
      ctx.fillText(
        "Tap anywhere to play again",
        CANVAS_W / 2,
        CANVAS_H / 2 + 46,
      );

      // Call via ref so drawFrame's stale closure always uses the latest callback
      onRoundEndRef.current(GAME_TYPE, roundScore);
    }, [onGameStateChange]);

    const startGame = useCallback(() => {
      cancelAnimationFrame(rafRef.current);
      stateRef.current = "playing";
      birdYRef.current = CANVAS_H / 2;
      velYRef.current = 0;
      pipesRef.current = [];
      scoreRef.current = 0;
      frameRef.current = 0;
      setGameState("playing");
      onGameStateChange?.("playing");
      rafRef.current = requestAnimationFrame(drawFrame);
    }, [drawFrame, onGameStateChange]);

    const flap = useCallback(() => {
      // Always restart on idle or dead — regardless of earned tokens
      if (stateRef.current === "idle" || stateRef.current === "dead") {
        startGame();
        return;
      }
      if (stateRef.current === "playing") {
        velYRef.current = FLAP_VEL;
      }
    }, [startGame]);

    useImperativeHandle(ref, () => ({ flap }), [flap]);

    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          flap();
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [flap]);

    useEffect(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawFrame);
      return () => cancelAnimationFrame(rafRef.current);
    }, [drawFrame]);

    const handlePointer = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        flap();
      },
      [flap],
    );

    return (
      <div
        ref={containerRef}
        className="flex flex-col items-center gap-3"
        data-ocid="flappy_game.canvas_target"
        style={{ cursor: "pointer", userSelect: "none", touchAction: "none" }}
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
            cursor: "pointer",
          }}
          onClick={handlePointer}
          onMouseDown={handlePointer}
          onTouchStart={handlePointer}
          onKeyDown={(e) => {
            if (e.code === "Space" || e.code === "ArrowUp") {
              e.preventDefault();
              flap();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Flappy game — tap or press Space to flap"
        />
        {disabled && (
          <p className="text-xs text-muted-foreground text-center">
            Daily games cap reached — come back tomorrow!
          </p>
        )}
      </div>
    );
  },
);

FlappyBirdGame.displayName = "FlappyBirdGame";

export default FlappyBirdGame;
