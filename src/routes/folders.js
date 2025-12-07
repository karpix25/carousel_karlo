const Router = require("@koa/router");
const fs = require("fs").promises;
const path = require("path");
const {
    loadFolders,
    createFolder,
    updateFolder,
    deleteFolder
} = require("../utils/folder-storage");

const router = new Router({
    prefix: "/folders",
});

const TEMPLATES_DIR = path.join(__dirname, "../../data/templates");

// List all folders
router.get("/", async (ctx) => {
    try {
        const folders = await loadFolders();
        ctx.body = folders;
    } catch (err) {
        ctx.status = 500;
        ctx.body = { error: err.message };
    }
});

// Create folder
router.post("/", async (ctx) => {
    try {
        const { name } = ctx.request.body;
        const folder = await createFolder(name);
        ctx.body = folder;
    } catch (err) {
        ctx.status = 400;
        ctx.body = { error: err.message };
    }
});

// Update folder
router.put("/:id", async (ctx) => {
    try {
        const { name } = ctx.request.body;
        const folder = await updateFolder(ctx.params.id, { name });
        ctx.body = folder;
    } catch (err) {
        ctx.status = 404;
        ctx.body = { error: err.message };
    }
});

// Delete folder
router.delete("/:id", async (ctx) => {
    try {
        // Check if folder has templates
        const files = await fs.readdir(TEMPLATES_DIR);
        const templates = [];

        for (const file of files) {
            if (file.endsWith(".json")) {
                const content = await fs.readFile(path.join(TEMPLATES_DIR, file), "utf-8");
                templates.push(JSON.parse(content));
            }
        }

        const hasTemplates = templates.some(t => t.folderId === ctx.params.id);

        if (hasTemplates) {
            ctx.status = 400;
            ctx.body = { error: "Cannot delete folder with templates" };
            return;
        }

        await deleteFolder(ctx.params.id);
        ctx.status = 200;
        ctx.body = { success: true };
    } catch (err) {
        ctx.status = 500;
        ctx.body = { error: err.message };
    }
});

module.exports = router;
