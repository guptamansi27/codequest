import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "./utils";

const badgeVariants = (variant = "default", className = "") => {
  const baseClasses = "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-colors overflow-hidden";
  
  const variantClasses = {
    default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
    destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
    outline: "text-gray-900 border-gray-300 hover:bg-gray-100",
  };
  
  return cn(baseClasses, variantClasses[variant], className);
};

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={badgeVariants(variant, className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
