
import React from 'react';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmButtonText = 'Eliminar',
    cancelButtonText = 'Cancelar'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700">
                <div className="flex items-start space-x-4">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="mt-0 text-left flex-1">
                        <h3 className="text-lg leading-6 font-bold text-white" id="modal-title">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <div className="text-sm text-slate-300">
                                {message}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors"
                    >
                        {cancelButtonText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold transition-colors"
                    >
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
