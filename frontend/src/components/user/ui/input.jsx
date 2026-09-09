import * as React from "react";

import { cn } from "./utils";

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-gray-300 px-3 py-1 text-base bg-white transition-colors outline-none placeholder:text-gray-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
