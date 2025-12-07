import React from 'react';
import { X } from 'lucide-react';

export default function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 space-y-4">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 pr-8">
                    {title}
                </h2>

                {/* Message */}
                <p className="text-gray-600 text-sm">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
