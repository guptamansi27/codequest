jest.mock("../../../../node_modules/@babel/standalone/babel.min.js?raw", () => "Babel source </script>", {
  virtual: true,
});

jest.mock("../../../../node_modules/react/umd/react.development.js?raw", () => "React dev source </script>", {
  virtual: true,
});

jest.mock("../../../../node_modules/react-dom/umd/react-dom.development.js?raw", () => "ReactDOM dev source </script>", {
  virtual: true,
});

describe("previewDocument", () => {
  test("creates a complete sandbox document with escaped scripts", () => {
    const { createPreviewDocument } = require("./previewDocument");

    const html = createPreviewDocument();

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Babel source <\\/script>");
    expect(html).toContain("React dev source <\\/script>");
    expect(html).toContain("ReactDOM dev source <\\/script>");
    expect(html).toContain("source: \"codequest-preview\"");
    expect(html).toContain("window.addEventListener(\"message\"");
    expect(html).toContain("elementExists");
    expect(html).toContain("renderReactFiles");
    expect(html).toContain("loadModule");
    expect(html).not.toContain("React dev source </script>");
  });
});
