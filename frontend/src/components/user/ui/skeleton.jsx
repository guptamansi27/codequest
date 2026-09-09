import { cn } from "./utils";
import "../../../styles/premium-skeleton.css";

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("cq-skel", className)}
      {...props}
    />
  );
}

export { Skeleton };
