import { cva, type VariantProps } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--button-default-bg)] text-[var(--button-default-text)] shadow-[0_4px_14px_var(--primary-soft)] hover:bg-[var(--button-default-hover)] hover:shadow-[0_6px_20px_var(--primary-glow)]",
        destructive: "bg-[var(--button-destructive-bg)] text-white shadow-sm hover:bg-[var(--button-destructive-hover)]",
        outline: "border border-[var(--button-outline-border)] bg-[var(--button-outline-bg)] text-[var(--button-outline-text)] hover:border-[var(--primary-color)] hover:bg-[var(--button-outline-hover)]",
        secondary: "bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] hover:bg-[var(--button-secondary-hover)] border border-[var(--button-secondary-border)]",
        ghost: "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover)] hover:text-[var(--primary-color)]",
        link: "text-[var(--button-link-text)] bg-[var(--button-link-bg)] hover:bg-[var(--button-link-hover-bg)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
