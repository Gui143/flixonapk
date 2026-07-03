// Logo "FlixOn" — triângulo de play estilizado em gradiente violeta.
export default function Logo({ size = 32 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-gradient-to-br from-flixon-violet to-flixon-violet-dark flex items-center justify-center shadow-glow shrink-0"
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="white"
        aria-hidden
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  );
}
