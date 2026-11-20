const { Plugin } = require("obsidian");
const path = require("path");

module.exports = class FlemingPlugin extends Plugin {
  async onload() {
    const adapter = this.app.vault.adapter;
    const vaultRoot = typeof adapter.getBasePath === "function"
      ? adapter.getBasePath()
      : adapter.basePath;
    const flemingPath = path.resolve(vaultRoot, this.manifest.dir, "fleming.js");
    const Fleming = require(flemingPath);

    this.registerMarkdownCodeBlockProcessor("fleming", (source, el) => {
      try {
        el.innerHTML = Fleming.render(source, () => {});
      } catch (error) {
        el.empty();
        el.createEl("pre", { text: `fleming error: ${error.message}` });
      }
    });
  }
};
