import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";
import { Checkbox } from "./checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./hover-card";
import { Label } from "./label";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "./popover";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Switch } from "./switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

describe("interactive UI primitives", () => {
  let consoleErrorSpy;

  beforeAll(() => {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders accordion, tabs, label, checkbox, switch, and radio group wrappers", async () => {
    const user = userEvent.setup();

    render(
      <>
        <Accordion type="single" collapsible>
          <AccordionItem value="one">
            <AccordionTrigger>Question</AccordionTrigger>
            <AccordionContent>Answer</AccordionContent>
          </AccordionItem>
        </Accordion>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview panel</TabsContent>
          <TabsContent value="details">Details panel</TabsContent>
        </Tabs>

        <Label htmlFor="notify" className="custom-label">Notifications</Label>
        <Checkbox id="notify" aria-label="Notifications checkbox" />
        <Switch aria-label="Enable hints" />
        <RadioGroup defaultValue="easy" aria-label="Difficulty">
          <RadioGroupItem value="easy" aria-label="Easy" />
          <RadioGroupItem value="hard" aria-label="Hard" />
        </RadioGroup>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Question" }));
    expect(screen.getByText("Answer").closest("[data-slot='accordion-content']")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Details" }));
    expect(screen.getByText("Details panel")).toHaveAttribute("data-slot", "tabs-content");
    expect(screen.getByText("Notifications")).toHaveClass("custom-label");
    expect(screen.getByLabelText("Notifications checkbox")).toHaveAttribute("data-slot", "checkbox");
    expect(screen.getByLabelText("Enable hints")).toHaveAttribute("data-slot", "switch");
    expect(screen.getByLabelText("Easy")).toHaveAttribute("data-slot", "radio-group-item");
  });

  test("renders dialog, popover, collapsible, hover card, and tooltip content", async () => {
    const user = userEvent.setup();

    render(
      <>
        <Dialog>
          <DialogTrigger>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Challenge Settings</DialogTitle>
              <DialogDescription>Edit challenge preferences.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose>Done</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Popover>
          <PopoverAnchor>Anchor</PopoverAnchor>
          <PopoverTrigger>Open popover</PopoverTrigger>
          <PopoverContent className="custom-popover">Popover body</PopoverContent>
        </Popover>

        <Collapsible>
          <CollapsibleTrigger>More</CollapsibleTrigger>
          <CollapsibleContent>More details</CollapsibleContent>
        </Collapsible>

        <HoverCard open>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent className="custom-hover">Hover body</HoverCardContent>
        </HoverCard>

        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>Tip target</TooltipTrigger>
            <TooltipContent className="custom-tooltip">Tip body</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-slot", "dialog-content");
    expect(screen.getByText("Challenge Settings")).toHaveAttribute("data-slot", "dialog-title");
    await user.click(screen.getByRole("button", { name: "Done" }));

    await user.click(screen.getByRole("button", { name: "Open popover" }));
    expect(screen.getByText("Popover body")).toHaveClass("custom-popover");

    await user.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("More details")).toHaveAttribute("data-slot", "collapsible-content");
    expect(screen.getByText("Hover body")).toHaveClass("custom-hover");
    expect(screen.getAllByText("Tip body")[0]).toHaveClass("custom-tooltip");
  });
});
