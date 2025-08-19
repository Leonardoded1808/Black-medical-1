import React, { useState } from 'react';
import type { User } from '../types';

interface PasswordChangeProps {
    user: User;
    onChangePassword: (userId: string, newPass: string) => void;
    onLogout: () => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ user, onChangePassword, onLogout }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setNewPassword('');
            setConfirmPassword('');
            return;
        }
        onChangePassword(user.id, newPassword);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-10 w-10 text-cyan-400">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        <h1 className="text-3xl font-bold">Black Medical</h1>
                    </div>
                    <h2 className="text-2xl font-semibold mt-4">Bienvenido, {user.name.split(' ')[0]}</h2>
                    <p className="text-slate-400 mt-2">Por motivos de seguridad, debe establecer una nueva contraseña personal.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                     <div>
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Introduzca su nueva contraseña"
                            required
                            autoFocus
                        />
                    </div>
                     <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-slate-300 mb-2"
                        >
                           Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-700 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            placeholder="Confirme su nueva contraseña"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 text-center animate-pulse">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transform hover:scale-105"
                    >
                        Establecer Contraseña
                    </button>
                </form>
                <div className="text-center">
                    <button onClick={onLogout} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Volver a la pantalla de inicio</button>
                </div>
            </div>
        </div>
    );
};

export default PasswordChange;
