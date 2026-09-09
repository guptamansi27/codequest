export const CHALLENGE_TECH_TYPES = {
  HTML: "HTML",
  HTML_CSS: "HTML_CSS",
  HTML_CSS_JS: "HTML_CSS_JS",
  REACT: "REACT",
};

export const STACK_TO_TECH_TYPE = {
  HTML: CHALLENGE_TECH_TYPES.HTML,
  CSS: CHALLENGE_TECH_TYPES.HTML_CSS,
  HTML_CSS: CHALLENGE_TECH_TYPES.HTML_CSS,
  JS: CHALLENGE_TECH_TYPES.HTML_CSS_JS,
  JAVASCRIPT: CHALLENGE_TECH_TYPES.HTML_CSS_JS,
  HTML_CSS_JS: CHALLENGE_TECH_TYPES.HTML_CSS_JS,
  REACT: CHALLENGE_TECH_TYPES.REACT,
};

export const VALIDATION_DEFINITIONS = {
  elementExists: {
    label: "Element exists",
    description: "Checks that a selector renders in the preview DOM.",
  },
  hasText: {
    label: "Contains text",
    description: "Checks that a selector or the page contains expected text.",
  },
  hasAttribute: {
    label: "Has attribute",
    description: "Checks that an element includes a required HTML attribute.",
  },
  textContentEquals: {
    label: "Text equals",
    description: "Checks that an element's visible text exactly matches the expected value.",
  },
  isVisible: {
    label: "Visible",
    description: "Checks that an element is rendered and visible.",
  },
  hasClass: {
    label: "Has class",
    description: "Checks that an element includes the expected CSS class.",
  },
  styleMatches: {
    label: "Style matches",
    description: "Checks a computed CSS property value on an element.",
  },
  matchesLayout: {
    label: "Layout matches",
    description: "Checks an element's measured layout values.",
  },
  isResponsive: {
    label: "Responsive",
    description: "Checks that the target fits within the preview viewport.",
  },
  isClickable: {
    label: "Clickable",
    description: "Checks that a visible target can be clicked.",
  },
  handlesEvent: {
    label: "Vanilla event behavior",
    description: "Dispatches a DOM event and checks for the expected visible DOM result.",
  },
  attributeChanges: {
    label: "Attribute changes",
    description: "Clicks or dispatches an event and checks that a target attribute changes.",
  },
  domUpdatesAfterClick: {
    label: "DOM updates after click",
    description: "Clicks a control and checks for the expected DOM text or markup update.",
  },
  textExists: {
    label: "Text exists",
    description: "Checks that text appears in the rendered React UI.",
  },
  buttonClickUpdatesText: {
    label: "Button click updates text",
    description: "Clicks a rendered button and checks that target text updates.",
  },
  inputUpdatesState: {
    label: "Input updates UI",
    description: "Types into an input and checks the visible state-driven UI update.",
  },
  rendersComponent: {
    label: "Component renders",
    description: "Checks that a rendered component root or selector exists.",
  },
  conditionallyRenders: {
    label: "Conditionally renders",
    description: "Checks that UI appears after a visible interaction.",
  },
  listRenders: {
    label: "List renders",
    description: "Checks that a rendered list contains the expected items.",
  },
  classExists: {
    label: "Class exists",
    description: "Checks that rendered React UI includes the expected class.",
  },
  attributeExists: {
    label: "Attribute exists",
    description: "Checks that rendered React UI includes the expected attribute.",
  },
  rendersPropValue: {
    label: "Renders prop value",
    description: "Checks that a component renders a visible value passed through props.",
  },
  rendersDynamicProps: {
    label: "Renders dynamic props",
    description: "Checks that prop-driven UI updates or displays dynamic prop content.",
  },
  conditionallyRendersFromProps: {
    label: "Conditional props render",
    description: "Checks that UI appears when prop-driven conditions are met.",
  },
  rendersList: {
    label: "Renders list",
    description: "Checks that a list selector renders the expected number of items.",
  },
  rendersMappedItems: {
    label: "Renders mapped items",
    description: "Checks that mapped list content appears in the rendered UI.",
  },
  rendersDynamicListLength: {
    label: "Dynamic list length",
    description: "Checks that a dynamic list renders the expected item count.",
  },
  formSubmitsSuccessfully: {
    label: "Form submits",
    description: "Submits a rendered form and checks the expected visible result.",
  },
  validationMessageAppears: {
    label: "Validation message appears",
    description: "Triggers validation and checks that a message appears.",
  },
  togglesElementVisibility: {
    label: "Toggles visibility",
    description: "Clicks a control and checks that a target element appears or disappears.",
  },
  stateChangesDOM: {
    label: "State changes DOM",
    description: "Performs an interaction and checks the state-driven DOM result.",
  },
  componentExists: {
    label: "Component exists",
    description: "Checks that a component's rendered selector exists.",
  },
  childComponentRenders: {
    label: "Child component renders",
    description: "Checks that a child component's visible DOM renders.",
  },
  nestedComponentVisible: {
    label: "Nested component visible",
    description: "Checks that nested component UI is visible.",
  },
  loadingIndicatorVisible: {
    label: "Loading indicator",
    description: "Checks that a loading state is visible.",
  },
  asyncContentRenders: {
    label: "Async content renders",
    description: "Waits for async UI content and checks the expected result.",
  },
  delayedStateUpdate: {
    label: "Delayed state update",
    description: "Waits for delayed state and checks the visible UI update.",
  },
  updatesState: { label: "Updates state", description: "Checks that an interaction updates visible state-driven UI." },
  useEffectRuns: { label: "Effect renders output", description: "Checks visible UI produced after an effect runs." },
  togglesVisibility: { label: "Toggles visibility", description: "Checks that clicking a control toggles visible UI." },
  parentChildCommunication: { label: "Parent-child communication", description: "Checks visible UI updated through parent and child interaction." },
  controlledInput: { label: "Controlled input", description: "Types into an input and checks controlled UI output." },
  rendersDynamicData: { label: "Renders dynamic data", description: "Checks that dynamic data appears in the UI." },
  passesProps: { label: "Passes props", description: "Checks visible output rendered from props." },
  updatesAfterAsyncAction: { label: "Async action update", description: "Waits for an async action to update visible UI." },
  rendersMappedArray: { label: "Renders mapped array", description: "Checks mapped array items in the rendered UI." },
  statePersists: { label: "State persists", description: "Checks state remains visible after interaction." },
  hookUsageValidation: { label: "Hook behavior", description: "Checks rendered behavior produced by hook-driven state." },
  customHookUsage: { label: "Custom hook behavior", description: "Checks visible behavior produced by a custom hook." },
  multipleStateUpdates: { label: "Multiple state updates", description: "Checks UI after multiple state-driven updates." },
  derivedStateRendering: { label: "Derived state rendering", description: "Checks UI derived from state or props." },
};

export const VALIDATION_FORM_FIELDS = {
  elementExists: ["selector"],
  hasText: ["selector", "expected"],
  hasAttribute: ["selector", "attribute", "expected"],
  textContentEquals: ["selector", "expected"],
  isVisible: ["selector"],
  hasClass: ["selector", "className"],
  styleMatches: ["selector", "property", "expected"],
  matchesLayout: ["selector", "expected"],
  isResponsive: ["selector"],
  isClickable: ["selector"],
  handlesEvent: ["selector", "event", "expected"],
  attributeChanges: ["buttonSelector", "targetSelector", "attribute", "expected"],
  domUpdatesAfterClick: ["buttonSelector", "targetSelector", "expected"],
  textExists: ["selector", "expected"],
  buttonClickUpdatesText: ["buttonSelector", "targetSelector", "expected"],
  inputUpdatesState: ["inputSelector", "targetSelector", "inputValue", "expected"],
  rendersComponent: ["selector"],
  conditionallyRenders: ["buttonSelector", "targetSelector", "expected"],
  listRenders: ["selector", "expectedCount", "expected"],
  classExists: ["selector", "className"],
  attributeExists: ["selector", "attribute", "expected"],
  rendersPropValue: ["selector", "expected"],
  rendersDynamicProps: ["selector", "expected"],
  conditionallyRendersFromProps: ["selector", "expected"],
  rendersList: ["selector", "expectedCount"],
  rendersMappedItems: ["selector", "expectedCount", "expected"],
  rendersDynamicListLength: ["selector", "expectedCount"],
  formSubmitsSuccessfully: ["selector", "expected"],
  validationMessageAppears: ["selector", "expected"],
  togglesElementVisibility: ["buttonSelector", "targetSelector"],
  stateChangesDOM: ["buttonSelector", "targetSelector", "expected"],
  componentExists: ["selector"],
  childComponentRenders: ["selector"],
  nestedComponentVisible: ["selector"],
  loadingIndicatorVisible: ["selector", "expected"],
  asyncContentRenders: ["selector", "expected", "timeout"],
  delayedStateUpdate: ["selector", "expected", "timeout"],
  updatesState: ["buttonSelector", "targetSelector", "expected"],
  useEffectRuns: ["selector", "expected", "timeout"],
  togglesVisibility: ["buttonSelector", "targetSelector"],
  parentChildCommunication: ["buttonSelector", "targetSelector", "expected"],
  controlledInput: ["inputSelector", "targetSelector", "inputValue", "expected"],
  rendersDynamicData: ["selector", "expected"],
  passesProps: ["selector", "expected"],
  updatesAfterAsyncAction: ["buttonSelector", "targetSelector", "expected", "timeout"],
  rendersMappedArray: ["selector", "expectedCount", "expected"],
  statePersists: ["buttonSelector", "targetSelector", "expected"],
  hookUsageValidation: ["buttonSelector", "targetSelector", "expected"],
  customHookUsage: ["buttonSelector", "targetSelector", "expected"],
  multipleStateUpdates: ["buttonSelector", "targetSelector", "expected"],
  derivedStateRendering: ["selector", "expected"],
};

export const VALIDATION_GROUPS = {
  [CHALLENGE_TECH_TYPES.HTML]: [
    "elementExists",
    "hasText",
    "hasAttribute",
    "textContentEquals",
    "isVisible",
  ],
  [CHALLENGE_TECH_TYPES.HTML_CSS]: [
    "elementExists",
    "hasText",
    "hasClass",
    "styleMatches",
    "matchesLayout",
    "isResponsive",
    "isVisible",
  ],
  [CHALLENGE_TECH_TYPES.HTML_CSS_JS]: [
    "elementExists",
    "hasText",
    "hasClass",
    "styleMatches",
    "isVisible",
    "isClickable",
    "handlesEvent",
    "textContentEquals",
    "attributeChanges",
    "domUpdatesAfterClick",
  ],
  [CHALLENGE_TECH_TYPES.REACT]: [
    "elementExists",
    "textExists",
    "textContentEquals",
    "buttonClickUpdatesText",
    "inputUpdatesState",
    "formSubmitsSuccessfully",
    "validationMessageAppears",
    "rendersComponent",
    "componentExists",
    "childComponentRenders",
    "nestedComponentVisible",
    "rendersPropValue",
    "rendersDynamicProps",
    "conditionallyRendersFromProps",
    "conditionallyRenders",
    "togglesElementVisibility",
    "stateChangesDOM",
    "listRenders",
    "rendersList",
    "rendersMappedItems",
    "rendersDynamicListLength",
    "loadingIndicatorVisible",
    "asyncContentRenders",
    "delayedStateUpdate",
    "updatesState",
    "useEffectRuns",
    "togglesVisibility",
    "parentChildCommunication",
    "controlledInput",
    "rendersDynamicData",
    "passesProps",
    "updatesAfterAsyncAction",
    "rendersMappedArray",
    "statePersists",
    "hookUsageValidation",
    "customHookUsage",
    "multipleStateUpdates",
    "derivedStateRendering",
    "classExists",
    "attributeExists",
  ],
};

export const VALIDATION_BADGES = {
  [CHALLENGE_TECH_TYPES.HTML]: "HTML Structure Validation",
  [CHALLENGE_TECH_TYPES.HTML_CSS]: "HTML + CSS Validation",
  [CHALLENGE_TECH_TYPES.HTML_CSS_JS]: "Vanilla JS Validation",
  [CHALLENGE_TECH_TYPES.REACT]: "React Validation",
};

export const getChallengeTechType = (stackOrTechnology = "") => {
  const key = String(stackOrTechnology || "").trim().toUpperCase();
  return STACK_TO_TECH_TYPE[key] || CHALLENGE_TECH_TYPES.HTML;
};

export const getValidationTypesForStack = (stackOrTechnology = "") =>
  VALIDATION_GROUPS[getChallengeTechType(stackOrTechnology)] || VALIDATION_GROUPS.HTML;

export const getDefaultValidationType = (stackOrTechnology = "") =>
  getValidationTypesForStack(stackOrTechnology)[0] || "elementExists";

export const isValidationAllowedForStack = (type, stackOrTechnology = "") =>
  getValidationTypesForStack(stackOrTechnology).includes(type);

export const getValidationDefinition = (type) =>
  VALIDATION_DEFINITIONS[type] || { label: type, description: "Runs this validation against the rendered preview." };

export const getValidationFormFields = (type) =>
  VALIDATION_FORM_FIELDS[type] || ["selector", "expected"];

const FIELD_LABELS = {
  selector: "Selector",
  targetSelector: "Target selector",
  buttonSelector: "Button selector",
  inputSelector: "Input selector",
  attribute: "Attribute",
  property: "CSS property",
  className: "Class name",
  expected: "Expected value",
  expectedCount: "Expected item count",
  inputValue: "Input value",
  event: "Event",
  timeout: "Timeout",
};

const EXAMPLE_BY_TYPE = {
  elementExists: ["Create an h1 heading", "selector: h1", "<h1>Hello</h1>", "No h1 rendered"],
  hasText: ["Show Welcome inside a banner", "selector: .banner, expected: Welcome", "Banner contains Welcome", "Banner text is missing"],
  hasAttribute: ["Add alt text to an image", "selector: img, attribute: alt, expected: Logo", "Image has alt=\"Logo\"", "Alt attribute is empty"],
  textContentEquals: ["Render Hello World in an h1", "selector: h1, expected: Hello World", "<h1>Hello World</h1>", "<h1>Hello</h1>"],
  isVisible: ["Show the profile card", "selector: .profile-card", "Profile card is visible", "Profile card is hidden or missing"],
  hasClass: ["Highlight the active tab", "selector: .tab, class: active", "Tab includes active class", "Tab renders without active class"],
  styleMatches: ["Make the heading blue", "selector: h1, property: color, expected: blue", "Computed color is blue", "Color stays black"],
  matchesLayout: ["Set the card width", "selector: .card, expected: width: 300", "Card width matches", "Card is too narrow or too wide"],
  isResponsive: ["Make the layout fit mobile", "selector: .layout", "Layout fits inside the viewport", "Layout overflows horizontally"],
  isClickable: ["Make the submit button clickable", "selector: button", "Button can be clicked", "Button is hidden or disabled"],
  handlesEvent: ["Update text on click", "selector: button, event: click, expected: Done", "Click shows Done", "Click does not change the page"],
  attributeChanges: ["Toggle aria-expanded", "button: button, target: .menu, attribute: aria-expanded, expected: true", "Click sets aria-expanded to true", "Attribute stays false"],
  domUpdatesAfterClick: ["Show a success message", "button: button, target: .message, expected: Saved", "Click renders Saved", "Message never appears"],
  textExists: ["Render a welcome message", "selector: body, expected: Welcome Aman", "Text appears in the React UI", "Text is not rendered"],
  buttonClickUpdatesText: ["Create an increment counter", "button: button, target: p, expected: 1", "Click renders 1", "Click does not update text"],
  inputUpdatesState: ["Mirror input text", "input: input, target: p, value: Aman", "Typing renders Aman", "Input changes but output stays empty"],
  rendersComponent: ["Render a Header component", "selector: header", "Header appears on screen", "Header component is not mounted"],
  componentExists: ["Render a TodoList component", "selector: .todo-list", "Todo list root exists", "Todo list root is missing"],
  childComponentRenders: ["Render a child Card component", "selector: .card", "Child card appears", "Parent renders but child is missing"],
  nestedComponentVisible: ["Show text inside a nested panel", "selector: .panel .title", "Nested title is visible", "Nested title is missing"],
  rendersPropValue: ["Display username using props", "selector: .greeting, expected: Aman", "Renders Aman", "Hardcoded fallback text"],
  rendersDynamicProps: ["Show a selected theme", "selector: .theme, expected: Dark", "Changing props shows Dark", "Old prop value remains visible"],
  conditionallyRendersFromProps: ["Show admin tools from props", "selector: .admin-tools, expected: Admin", "Admin tools render when enabled", "Admin tools never render"],
  conditionallyRenders: ["Reveal details after click", "button: button, target: .details, expected: Details", "Click reveals details", "Details stay hidden"],
  togglesElementVisibility: ["Show and hide a menu", "button: button, target: .menu", "Click toggles menu visibility", "Menu never changes"],
  stateChangesDOM: ["Mark a task complete", "button: button, target: .status, expected: Complete", "Click shows Complete", "Status stays Pending"],
  rendersList: ["Render three skills", "selector: li, expected count: 3", "Three list items render", "Only one item renders"],
  rendersMappedItems: ["Map names into list items", "selector: li, expected count: 3, expected: Aman", "All mapped names render", "One or more names are missing"],
  rendersDynamicListLength: ["Add an item to a list", "selector: li, expected count: 4", "List grows to four items", "List count stays the same"],
  formSubmitsSuccessfully: ["Submit a contact form", "selector: form, expected: Submitted", "Submit renders Submitted", "Submit does nothing"],
  validationMessageAppears: ["Require an email field", "selector: .error, expected: Email is required", "Error message appears", "Form fails silently"],
  loadingIndicatorVisible: ["Show loading while fetching", "selector: .loading, expected: Loading", "Loading text appears", "No loading state renders"],
  asyncContentRenders: ["Load profile data", "selector: .profile, expected: Aman", "Async content appears", "Loading never resolves"],
  delayedStateUpdate: ["Show a timeout message", "selector: .message, expected: Ready, timeout: 3000", "Ready appears after delay", "Message never updates"],
  updatesState: ["Increase a score", "button: button, target: .score, expected: 10", "Click updates score to 10", "Score remains 0"],
  useEffectRuns: ["Load initial greeting", "selector: .greeting, expected: Hello, timeout: 1000", "Effect renders Hello", "Effect output never appears"],
  togglesVisibility: ["Open a modal", "button: button, target: .modal", "Click opens or closes modal", "Modal visibility does not change"],
  parentChildCommunication: ["Child button updates parent text", "button: .child button, target: .parent-status, expected: Updated", "Parent text updates", "Only child changes"],
  controlledInput: ["Control a name input", "input: input, target: .preview, value: Aman, expected: Aman", "Preview mirrors input", "Preview stays blank"],
  rendersDynamicData: ["Display fetched course name", "selector: .course, expected: React Basics", "Course name renders", "Static placeholder remains"],
  passesProps: ["Pass title to a card", "selector: .card-title, expected: Dashboard", "Card title shows Dashboard", "Card ignores title prop"],
  updatesAfterAsyncAction: ["Save then show status", "button: button, target: .status, expected: Saved, timeout: 3000", "Saved appears after action", "Status never updates"],
  rendersMappedArray: ["Render an array of tasks", "selector: li, expected count: 3, expected: Practice", "Array items render", "Mapped output is incomplete"],
  statePersists: ["Keep selected tab after click", "button: .tab, target: .active-tab, expected: Profile", "Selected tab remains Profile", "Selection resets immediately"],
  hookUsageValidation: ["Use a hook to update count", "button: button, target: .count, expected: 1", "Hook state updates UI", "Hook state is not reflected"],
  customHookUsage: ["Use a custom toggle hook", "button: button, target: .status, expected: On", "Custom hook toggles status", "Status never changes"],
  multipleStateUpdates: ["Update total and message", "button: button, target: .summary, expected: Total: 2", "Both state updates appear", "Only one value updates"],
  derivedStateRendering: ["Show total from cart items", "selector: .total, expected: 300", "Derived total is correct", "Total is stale or incorrect"],
};

export const getValidationMetadata = (type) => {
  const definition = getValidationDefinition(type);
  const fields = getValidationFormFields(type);
  const example = EXAMPLE_BY_TYPE[type] || [
    definition.label,
    fields.map((field) => `${FIELD_LABELS[field] || field}: value`).join(", "),
    "The expected UI is visible",
    "The expected UI is missing",
  ];
  const supportedTypes = Object.entries(VALIDATION_GROUPS)
    .filter(([, validations]) => validations.includes(type))
    .map(([tech]) => tech);

  return {
    id: type,
    label: definition.label,
    supportedTypes,
    description: definition.description,
    requiredFields: fields.map((field) => FIELD_LABELS[field] || field),
    optionalFields: type.includes("async") || type.includes("delayed") ? ["Timeout"] : [],
    exampleChallenge: example[0],
    exampleTestcase: example[1],
    passExample: example[2],
    failExample: example[3],
    difficultyRecommendations: type.includes("async") || type.includes("List") || type.includes("Mapped")
      ? "Best for medium and hard challenges."
      : "Suitable when this behavior is part of the challenge requirement.",
    validationLogicReference: type,
  };
};

export const getValidationMetadataForStack = (stackOrTechnology = "") =>
  getValidationTypesForStack(stackOrTechnology).map(getValidationMetadata);

export const getValidationBadge = (stackOrTechnology = "") =>
  VALIDATION_BADGES[getChallengeTechType(stackOrTechnology)] || VALIDATION_BADGES.HTML;

export const ALL_VALIDATION_TYPES = Object.keys(VALIDATION_DEFINITIONS);
