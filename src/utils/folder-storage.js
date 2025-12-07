const path = require('path');
const fs = require('fs').promises;

const FOLDERS_FILE = path.join(__dirname, '../../data/folders.json');

async function ensureFoldersFile() {
    try {
        await fs.access(FOLDERS_FILE);
    } catch {
        await fs.writeFile(FOLDERS_FILE, JSON.stringify([], null, 2));
    }
}

async function loadFolders() {
    await ensureFoldersFile();
    try {
        const data = await fs.readFile(FOLDERS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

async function saveFolders(folders) {
    await ensureFoldersFile();
    await fs.writeFile(FOLDERS_FILE, JSON.stringify(folders, null, 2));
}

async function getFolder(id) {
    const folders = await loadFolders();
    return folders.find(f => f.id === id);
}

async function createFolder(name) {
    const folders = await loadFolders();
    const maxOrder = folders.reduce((max, f) => Math.max(max, f.order || 0), -1);

    const folder = {
        id: require('crypto').randomUUID(),
        name: name || 'New Folder',
        createdAt: new Date().toISOString(),
        order: maxOrder + 1
    };

    folders.push(folder);
    await saveFolders(folders);
    return folder;
}

async function updateFolder(id, updates) {
    const folders = await loadFolders();
    const index = folders.findIndex(f => f.id === id);

    if (index === -1) {
        throw new Error('Folder not found');
    }

    folders[index] = { ...folders[index], ...updates };
    await saveFolders(folders);
    return folders[index];
}

async function deleteFolder(id) {
    const folders = await loadFolders();
    const filtered = folders.filter(f => f.id !== id);
    await saveFolders(filtered);
}

module.exports = {
    loadFolders,
    saveFolders,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder
};
