import { ReactNode, ButtonHTMLAttributes } from "react";

export type PixelButtonVariant = "primary" | "secondary" | "accent" | "danger" | "disabled";
export type PixelButtonSize = "sm" | "md" | "lg";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PixelButtonVariant;
  size?: PixelButtonSize;
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<PixelButtonVariant, string> = {
  primary: "bg-yellow-400 dark:bg-yellow-500 hover:bg-yellow-500 dark:hover:bg-yellow-600 text-black",
  secondary: "bg-white hover:bg-gray-100 dark:bg-gray-200 dark:hover:bg-gray-300 text-black",
  accent: "bg-blue-400 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-600 text-white",
  danger: "bg-red-400 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-600 text-white",
  disabled: "bg-gray-400 dark:bg-gray-600 text-gray-700 dark:text-gray-400 cursor-not-allowed opacity-60",
};

const sizeStyles: Record<PixelButtonSize, string> = {
  sm: "py-1 sm:py-1.5 px-1 sm:px-1.5 text-[10px] sm:text-xs",
  md: "py-1.5 sm:py-2 px-1.5 sm:px-2 text-xs sm:text-sm md:text-base",
  lg: "py-2 sm:py-3 md:py-4 px-1 sm:px-1.5 text-sm sm:text-base md:text-lg",
};

export const PixelButton = ({
  variant = "secondary",
  size = "md",
  children,
  icon,
  fullWidth = false,
  disabled = false,
  className = "",
  ...props
}: PixelButtonProps) => {
  const effectiveVariant = disabled ? "disabled" : variant;

  return (
    <button
      disabled={disabled}
      className={`
        font-black doodle-button shadow-xl
        flex items-center justify-center gap-1 sm:gap-1.5
        ${variantStyles[effectiveVariant]}
        ${sizeStyles[size]}
        ${fullWidth ? "w-full" : ""}
        ${disabled ? "" : "cursor-pointer"}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="leading-tight font-micro">{children}</span>
    </button>
  );
};

// Specialized button for vertical layouts (like the Insert Coin button)
export const PixelButtonVertical = ({
  variant = "secondary",
  children,
  icon,
  disabled = false,
  className = "",
  ...props
}: PixelButtonProps) => {
  const effectiveVariant = disabled ? "disabled" : variant;

  return (
    <button
      disabled={disabled}
      className={`
        font-black py-2 sm:py-3 md:py-4 px-1 sm:px-1.5
        doodle-button shadow-xl
        flex flex-col items-center justify-center gap-0.5
        ${variantStyles[effectiveVariant]}
        ${disabled ? "" : "cursor-pointer"}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="text-[10px] sm:text-xs md:text-sm leading-tight font-micro">{children}</span>
    </button>
  );
};

// Icon-only pixel button
export const PixelIconButton = ({
  variant = "secondary",
  size = "md",
  children,
  disabled = false,
  className = "",
  ...props
}: PixelButtonProps) => {
  const effectiveVariant = disabled ? "disabled" : variant;

  const iconSizeStyles: Record<PixelButtonSize, string> = {
    sm: "p-1 sm:p-1.5",
    md: "p-2 sm:p-2.5 md:p-3",
    lg: "p-2 sm:p-3 md:p-4",
  };

  return (
    <button
      disabled={disabled}
      className={`
        doodle-button shadow-xl
        flex items-center justify-center
        ${variantStyles[effectiveVariant]}
        ${iconSizeStyles[size]}
        ${disabled ? "" : "cursor-pointer"}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {children}
    </button>
  );
};
