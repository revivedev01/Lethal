import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  TextareaHTMLAttributes
} from "react";

const cx = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

/* ─────────────────────────────────────────────────
   BUTTON
   ───────────────────────────────────────────────── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  icon?: boolean;
}

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  icon = false,
  ...props
}: PropsWithChildren<ButtonProps>) {
  const variantClass = {
    primary: "r-btn-primary",
    ghost: "r-btn-ghost",
    danger: "r-btn-danger",
    subtle: "r-btn-subtle"
  }[variant];

  const sizeClass = {
    sm: "r-btn-sm",
    md: "",
    lg: "r-btn-lg"
  }[size];

  return (
    <button
      className={cx("r-btn", variantClass, sizeClass, icon && "r-btn-icon", className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* Convenience aliases */
export function GhostButton({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button className={cx("r-btn r-btn-ghost", className)} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button className={cx("r-btn r-btn-icon", className)} {...props}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────
   INPUT
   ───────────────────────────────────────────────── */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("r-input", className)} {...props} />;
}

/* ─────────────────────────────────────────────────
   TEXTAREA
   ───────────────────────────────────────────────── */
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("r-input", "resize-none", className)} {...props} />;
}

/* ─────────────────────────────────────────────────
   CARD
   ───────────────────────────────────────────────── */
export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={cx("r-card", className)} {...props}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   AVATAR
   ───────────────────────────────────────────────── */
interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  username: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  color?: string;
}

const AVATAR_COLORS = [
  "#4f83ff", "#7c5af0", "#e85c5c", "#23a55a",
  "#f0b232", "#e8775a", "#5ab8e8", "#a855f7"
];

const getAvatarColor = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export function Avatar({
  username,
  size = "md",
  color,
  className,
  style,
  ...props
}: AvatarProps) {
  const bg = color ?? getAvatarColor(username);
  const initial = username.charAt(0).toUpperCase();
  const sizeClass = `r-avatar-${size}`;

  return (
    <div
      className={cx("r-avatar", sizeClass, className)}
      style={{ background: bg, ...style }}
      {...props}
    >
      {initial}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   STATUS DOT
   ───────────────────────────────────────────────── */
interface StatusDotProps {
  status?: "online" | "idle" | "dnd" | "offline";
  className?: string;
}

export function StatusDot({ status = "offline", className }: StatusDotProps) {
  return <span className={cx("r-status", status, className)} />;
}

/* ─────────────────────────────────────────────────
   BADGE / PILL
   ───────────────────────────────────────────────── */
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "accent" | "success" | "danger" | "neutral";
}

export function Badge({
  variant = "neutral",
  className,
  children,
  ...props
}: PropsWithChildren<BadgeProps>) {
  return (
    <span
      className={cx("r-badge", `r-badge-${variant}`, className)}
      {...props}
    >
      {children}
    </span>
  );
}

/* Pill is an alias for Badge with neutral variant */
export function Pill({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span className={cx("r-badge r-badge-neutral", className)} {...props}>
      {children}
    </span>
  );
}

/* ─────────────────────────────────────────────────
   DIVIDER
   ───────────────────────────────────────────────── */
export function Divider({ className }: { className?: string }) {
  return <div className={cx("r-divider", className)} />;
}

/* ─────────────────────────────────────────────────
   SKELETON
   ───────────────────────────────────────────────── */
interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({
  width,
  height = 16,
  rounded = false,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cx("r-skeleton", rounded && "rounded-full", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style
      }}
      {...props}
    />
  );
}
