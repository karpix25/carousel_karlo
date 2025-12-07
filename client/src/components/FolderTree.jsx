import React, { useState } from 'react';
import { Folder, FolderOpen, File, Trash2, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '../hooks/useTranslation';
import DeleteConfirmModal from './DeleteConfirmModal';

// Draggable Template Item
function TemplateItem({ template, onDelete, onClick }) {
    const { t } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: template.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        >
            <File size={16} className="text-gray-400 flex-shrink-0" />
            <span
                className="flex-1 text-sm text-gray-700 truncate"
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                {template.name || 'Untitled'}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                title={t('templates.delete')}
            >
                <Trash2 size={14} className="text-red-500" />
            </button>
        </div>
    );
}

// Folder with templates
function FolderItem({ folder, templates, onDeleteTemplate, onDeleteFolder, onRename, onTemplateClick, isExpanded, onToggle }) {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(folder.name);

    const folderTemplates = templates.filter(t => t.folderId === folder.id);

    const handleRename = () => {
        if (name.trim() && name !== folder.name) {
            onRename(folder.id, name.trim());
        }
        setIsEditing(false);
    };

    return (
        <div className="space-y-1">
            <div className="group flex items-center gap-2 px-3 py-2 hover:bg-purple-50 rounded-lg transition-colors">
                <button
                    onClick={onToggle}
                    className="p-0.5 hover:bg-purple-100 rounded transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDown size={16} className="text-purple-600" />
                    ) : (
                        <ChevronRight size={16} className="text-purple-600" />
                    )}
                </button>

                {isExpanded ? (
                    <FolderOpen size={16} className="text-purple-600 flex-shrink-0" />
                ) : (
                    <Folder size={16} className="text-purple-600 flex-shrink-0" />
                )}

                {isEditing ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') {
                                setName(folder.name);
                                setIsEditing(false);
                            }
                        }}
                        className="flex-1 text-sm font-medium text-gray-900 bg-white border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span
                        className="flex-1 text-sm font-medium text-gray-900 truncate cursor-pointer"
                        onDoubleClick={() => setIsEditing(true)}
                    >
                        {folder.name}
                    </span>
                )}

                <span className="text-xs text-gray-400">({folderTemplates.length})</span>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                    title={t('folders.deleteFolder')}
                >
                    <Trash2 size={14} className="text-red-500" />
                </button>
            </div>

            {isExpanded && (
                <div className="ml-6 space-y-0.5">
                    <SortableContext items={folderTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {folderTemplates.map(template => (
                            <TemplateItem
                                key={template.id}
                                template={template}
                                onDelete={() => onDeleteTemplate(template.id)}
                                onClick={() => onTemplateClick(template.id)}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

// Main FolderTree Component
export default function FolderTree({ folders, templates, onMove, onDeleteTemplate, onDeleteFolder, onCreateFolder, onRenameFolder, onTemplateClick }) {
    const { t } = useTranslation();
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const [deleteModal, setDeleteModal] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const rootTemplates = templates.filter(t => !t.folderId);

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        // Check if dropped on a folder
        const targetFolder = folders.find(f => f.id === over.id);
        if (targetFolder) {
            onMove(active.id, targetFolder.id);
        } else if (over.id === 'root') {
            onMove(active.id, null);
        }
    };

    const toggleFolder = (folderId) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    const handleDeleteFolder = async (folderId) => {
        const folderTemplates = templates.filter(t => t.folderId === folderId);

        if (folderTemplates.length > 0) {
            setDeleteModal({
                type: 'folder-error',
                title: t('folders.cannotDelete') || 'Cannot Delete Folder',
                message: `This folder contains ${folderTemplates.length} template(s). Move or delete templates first.`,
            });
        } else {
            setDeleteModal({
                type: 'folder',
                id: folderId,
                title: t('folders.deleteFolder') || 'Delete Folder',
                message: 'This action cannot be undone.',
            });
        }
    };

    const handleDeleteTemplate = (templateId) => {
        const template = templates.find(t => t.id === templateId);
        setDeleteModal({
            type: 'template',
            id: templateId,
            title: t('templates.deleteConfirm')?.replace('{name}', template?.name || 'Untitled') || 'Delete Template?',
            message: t('templates.deleteMessage') || 'This action cannot be undone.',
        });
    };

    const confirmDelete = () => {
        if (deleteModal.type === 'template') {
            onDeleteTemplate(deleteModal.id);
        } else if (deleteModal.type === 'folder') {
            onDeleteFolder(deleteModal.id);
        }
        setDeleteModal(null);
    };

    return (
        <>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">{t('folders.title') || 'Templates'}</h2>
                    <button
                        onClick={onCreateFolder}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        {t('folders.newFolder') || 'New Folder'}
                    </button>
                </div>

                {/* Folder Tree */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <div className="space-y-2">
                        {/* Folders */}
                        {folders.map(folder => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                templates={templates}
                                onDeleteTemplate={handleDeleteTemplate}
                                onDeleteFolder={() => handleDeleteFolder(folder.id)}
                                onRename={onRenameFolder}
                                onTemplateClick={onTemplateClick}
                                isExpanded={expandedFolders.has(folder.id)}
                                onToggle={() => toggleFolder(folder.id)}
                            />
                        ))}

                        {/* Root Templates */}
                        {rootTemplates.length > 0 && (
                            <div className="space-y-0.5">
                                <SortableContext items={rootTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    {rootTemplates.map(template => (
                                        <TemplateItem
                                            key={template.id}
                                            template={template}
                                            onDelete={() => handleDeleteTemplate(template.id)}
                                            onClick={() => onTemplateClick(template.id)}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        )}
                    </div>
                </DndContext>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={!!deleteModal}
                title={deleteModal?.title || ''}
                message={deleteModal?.message || ''}
                onConfirm={deleteModal?.type === 'folder-error' ? () => setDeleteModal(null) : confirmDelete}
                onCancel={() => setDeleteModal(null)}
                confirmText={deleteModal?.type === 'folder-error' ? 'OK' : (t('templates.confirmDelete') || 'Delete')}
                cancelText={deleteModal?.type === 'folder-error' ? undefined : (t('templates.cancel') || 'Cancel')}
            />
        </>
    );
}
