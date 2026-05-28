type Color = "green" | "yellow" | "red" | "gray" | "blue";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
}

const colorClass: Record<Color, string> = {
  green: "bg-green-50 text-green-700 border border-green-200",
  yellow: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-700 border border-red-200",
  gray: "bg-slate-100 text-slate-600 border border-slate-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
};

export default function Badge({ color = "gray", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass[color]}`}
    >
      {children}
    </span>
  );
}