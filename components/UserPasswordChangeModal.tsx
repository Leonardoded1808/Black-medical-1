import React, { useState } from 'react';
import type { User } from '../types';
import KeyIcon from './icons/KeyIcon';

interface UserPasswordChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onChangePassword: (userId: string, oldPass: string, newPass: string) => { success: boolean; message: string };
}

const UserPasswordChangeModal: React.FC<UserPasswordChangeModalProps> = ({ isOpen, onClose, user, onChangePassword }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleClose = () => {
        // Reset state on close
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setSuccess('');
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Todos los campos son obligatorios.');
            return;
        }

        if (newPassword.length < 6) {
            setError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }
        
        if (newPassword === currentPassword) {
            setError('La nueva contraseña no puede ser igual a la actual.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las nuevas contraseñas no coinciden.');
            return;
        }

        const result = onChangePassword(user.id, currentPassword, newPassword);

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                handleClose();
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-slate-700 relative">
                <button onClick={handleClose} className="absolute top-3 right-3 text-slate-400 hover:text-white text-3xl leading-none">&times;</button>
                <div className="flex items-center space-x-3 mb-6">
                    <KeyIcon className="h-6 w-6 text-cyan-400" />
                    <h2 className="text-2xl font-bold text-white">Cambiar Contraseña</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Contraseña Actual</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                            autoFocus
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Confirmar Nueva Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            required
                        />
                    </div>
                    
                    {error && (
                        <p className="text-sm text-red-400 text-center animate-pulse">{error}</p>
                    )}
                    {success && (
                        <p className="text-sm text-green-400 text-center">{success}</p>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={handleClose} className="py-2 px-4 bg-slate-600 hover:bg-slate-500 rounded-md text-white font-semibold transition-colors">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-md text-white font-semibold transition-colors">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserPasswordChangeModal;
