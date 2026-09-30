export function Sparkline({
  points,
  stroke = "#B8321F",
  width = 2,
  className = "h-11 w-full",
  baseline = false,
  label,
}: {
  points: string;
  stroke?: string;
  width?: number;
  className?: string;
  baseline?: boolean;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      className={`block ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={
        baseline
          ? { background: "linear-gradient(#D6CDBC,#D6CDBC) 0 50%/100% 1px no-repeat" }
          : undefined
      }
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        style={{ strokeWidth: width, vectorEffect: "non-scaling-stroke" }}
      />
    </svg>
  );
}

export const riseColor = (x: number) => (x > 0 ? "#B8321F" : "#2F5D3A");
