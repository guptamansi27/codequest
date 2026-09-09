import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";

const buttonVariants = (variant = "default", size = "default", className = "") => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";
  
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "hover:bg-gray-100 hover:text-gray-900",
    link: "text-blue-600 underline-offset-4 hover:underline",
  };
  
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    sm: "h-8 px-3 py-1.5 text-xs",
    lg: "h-10 px-6 py-2.5 text-base",
    icon: "h-9 w-9",
  };
  
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
};

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={buttonVariants(variant, size, className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
