import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  TextareaHTMLAttributes
} from "react";

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(" ");

export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={joinClasses(
        "border border-white/10 bg-[var(--relay-surface)]/90 p-5 shadow-[0_12px_24px_rgba(0,0,0,0.16)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={joinClasses(
        "inline-flex items-center justify-center border border-[var(--relay-accent)] bg-[var(--relay-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  className,
  children,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={joinClasses(
        "inline-flex items-center justify-center border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[var(--relay-text)] transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={joinClasses(
        "w-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--relay-text)] outline-none placeholder:text-[var(--relay-muted)] focus:border-[var(--relay-accent)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={joinClasses(
        "w-full resize-none border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--relay-text)] outline-none placeholder:text-[var(--relay-muted)] focus:border-[var(--relay-accent)]",
        className
      )}
      {...props}
    />
  );
}

export function Pill({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) {
  return (
    <span
      className={joinClasses(
        "inline-flex items-center border border-white/10 bg-white/5 px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--relay-muted)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
