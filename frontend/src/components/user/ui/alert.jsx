import * as React from "react";

import { cn } from "./utils";

const alertVariants = (variant = "default", className = "") => {
  const baseClasses = "relative w-full rounded-lg border px-4 py-3 text-sm grid items-start gap-y-0.5";
  
  const variantClasses = {
    default: "bg-white text-gray-900 border-gray-200",
    destructive: "bg-white text-red-600 border-red-200",
  };
  
  return cn(baseClasses, variantClasses[variant], className);
};

function Alert({
  className,
  variant,
  ...props
}) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={alertVariants(variant, className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
