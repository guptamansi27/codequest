import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge, badgeVariants } from "./badge";
import { Button, buttonVariants } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import { Input } from "./input";
import { Progress } from "./progress";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Textarea } from "./textarea";
import { cn } from "./utils";

describe("basic UI primitives", () => {
  test("merges class names with cn helper", () => {
    expect(cn("one", false, "", "two")).toBe("one two");
  });

  test("renders button and badge variants", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(
      <>
        <Button variant="secondary" size="sm" className="custom-button" onClick={onClick}>
          Save
        </Button>
        <Badge variant="outline" className="custom-badge">
          Active
        </Badge>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("custom-button");
    expect(screen.getByText("Active")).toHaveAttribute("data-slot", "badge");
    expect(screen.getByText("Active")).toHaveClass("custom-badge");
    expect(buttonVariants("destructive", "lg")).toContain("bg-red-600");
    expect(badgeVariants("secondary")).toContain("bg-gray-100");
  });

  test("renders card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Summary</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Metrics</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Dashboard")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Summary")).toHaveAttribute("data-slot", "card-description");
    expect(screen.getByText("Metrics")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");
  });

  test("renders alert title and description", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Invalid login</AlertTitle>
        <AlertDescription>Use a valid TCS email.</AlertDescription>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveClass("text-red-600");
    expect(screen.getByText("Invalid login")).toHaveAttribute("data-slot", "alert-title");
    expect(screen.getByText("Use a valid TCS email.")).toHaveAttribute("data-slot", "alert-description");
  });

  test("renders form inputs and textarea", () => {
    render(
      <>
        <Input aria-label="Email" type="email" defaultValue="usera2@tcs.com" />
        <Textarea aria-label="Description" defaultValue="Build a layout" />
      </>,
    );

    expect(screen.getByLabelText("Email")).toHaveValue("usera2@tcs.com");
    expect(screen.getByLabelText("Description")).toHaveValue("Build a layout");
  });

  test("renders table primitives", () => {
    render(
      <Table>
        <TableCaption>Users</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Asha</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Users")).toHaveAttribute("data-slot", "table-caption");
    expect(screen.getByText("Name")).toHaveAttribute("data-slot", "table-head");
    expect(screen.getByText("Asha")).toHaveAttribute("data-slot", "table-cell");
  });

  test("renders avatar, progress, separator, and skeleton primitives", () => {
    const { container } = render(
      <>
        <Avatar>
          <AvatarImage src="/user.png" alt="User avatar" />
          <AvatarFallback>UA</AvatarFallback>
        </Avatar>
        <Progress value={40} aria-label="Progress" />
        <Separator orientation="vertical" />
        <Skeleton data-testid="skeleton" className="custom-skeleton" />
      </>,
    );

    expect(screen.getByText("UA")).toHaveAttribute("data-slot", "avatar-fallback");
    expect(screen.getByLabelText("Progress")).toHaveAttribute("data-slot", "progress");
    expect(container.querySelector("[data-slot='progress-indicator']")).toHaveStyle({
      transform: "translateX(-60%)",
    });
    expect(container.querySelector("[data-slot='separator-root']")).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByTestId("skeleton")).toHaveClass("cq-skel", "custom-skeleton");
  });
});
