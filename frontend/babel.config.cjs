module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    function transformImportMetaForJest({ types: t }) {
      return {
        visitor: {
          MetaProperty(path) {
            if (path.node.meta.name !== "import" || path.node.property.name !== "meta") {
              return;
            }

            path.replaceWith(
              t.objectExpression([
                t.objectProperty(
                  t.identifier("env"),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier("VITE_API_BASE_URL"),
                      t.stringLiteral(process.env.VITE_API_BASE_URL || "")
                    ),
                  ])
                ),
              ])
            );
          },
        },
      };
    },
  ],
};
