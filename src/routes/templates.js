const Router = require("@koa/router");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { getBrowser } = require("../utils/browser");
const { renderTemplate } = require("../utils/render-template");

const router = new Router({
  prefix: "/templates",
});

const TEMPLATES_DIR = path.join(__dirname, "../../data/templates");

async function ensureTemplatesDir() {
  await fs.mkdir(TEMPLATES_DIR, { recursive: true });
}

function getTemplatePath(id) {
  if (!id) {
    throw new Error("Template id is required");
  }
  const safeId = String(id);
  if (safeId.includes("..") || safeId.includes("/")) {
    throw new Error("Invalid template id");
  }
  return path.join(TEMPLATES_DIR, `${safeId}.json`);
}

// List templates
router.get("/", async (ctx) => {
  try {
    await ensureTemplatesDir();
    const files = await fs.readdir(TEMPLATES_DIR);
    const templates = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(path.join(TEMPLATES_DIR, file), "utf-8");
        templates.push(JSON.parse(content));
      }
    }
    ctx.body = templates;
  } catch (err) {
    ctx.status = 500;
    ctx.body = { error: err.message };
  }
});

// Create/Update template
router.post("/", async (ctx) => {
  const template = ctx.request.body || {};
  if (!template.id) {
    template.id = crypto.randomUUID();
  }
  template.name = template.name || "Untitled";
  template.elements = Array.isArray(template.elements) ? template.elements : [];
  template.updatedAt = new Date().toISOString();

  try {
    await ensureTemplatesDir();
    const filePath = getTemplatePath(template.id);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    ctx.body = template;
  } catch (err) {
    ctx.status = 400;
    ctx.body = { error: err.message };
  }
});

// Get template
router.get("/:id", async (ctx) => {
  try {
    const filePath = getTemplatePath(ctx.params.id);
    const content = await fs.readFile(filePath, "utf-8");
    ctx.body = JSON.parse(content);
  } catch (err) {
    ctx.status = 404;
    ctx.body = { error: "Template not found" };
  }
});

// Render template
router.post("/:id/render", async (ctx) => {
  const { id } = ctx.params;
  const data = ctx.request.body;

  let template;
  try {
    const filePath = getTemplatePath(id);
    const content = await fs.readFile(filePath, "utf-8");
    template = JSON.parse(content);
  } catch (err) {
    ctx.status = 404;
    ctx.body = { error: "Template not found" };
    return;
  }

  const html = renderTemplate(template, data);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });

    const buffer = await page.screenshot({
      fullPage: true,
      type: "png",
      omitBackground: true,
    });

    ctx.set("Content-Type", "image/png");
    ctx.body = buffer;
  } finally {
    await page.close();
  }
});

// Direct render from JSON (no template saving)
router.post("/render", async (ctx) => {
  const { template, data } = ctx.request.body;

  if (!template) {
    ctx.status = 400;
    ctx.body = { error: "Template JSON is required in request body" };
    return;
  }

  if (!template.width || !template.height) {
    ctx.status = 400;
    ctx.body = { error: "Template must have width and height properties" };
    return;
  }

  const html = renderTemplate(template, data || {});

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });

    const buffer = await page.screenshot({
      fullPage: true,
      type: "png",
      omitBackground: true,
    });

    ctx.set("Content-Type", "image/png");
    ctx.body = buffer;
  } finally {
    await page.close();
  }
});

// Delete template
router.delete("/:id", async (ctx) => {
  try {
    const filePath = getTemplatePath(ctx.params.id);
    await fs.unlink(filePath);
    ctx.status = 200;
    ctx.body = { success: true };
  } catch (err) {
    ctx.status = 404;
    ctx.body = { error: "Template not found" };
  }
});

// Move template to folder
router.put("/:id/move", async (ctx) => {
  try {
    const filePath = getTemplatePath(ctx.params.id);
    const content = await fs.readFile(filePath, "utf-8");
    const template = JSON.parse(content);

    template.folderId = ctx.request.body.folderId || null;

    await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    ctx.body = template;
  } catch (err) {
    ctx.status = 404;
    ctx.body = { error: "Template not found" };
  }
});

module.exports = router;
