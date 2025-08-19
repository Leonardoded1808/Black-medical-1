import React, { useState } from 'react';
import type { User } from '../types';

interface LoginProps {
    onLogin: (userId: string, pass: string) => boolean;
    users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, users }) => {
    const [userId, setUserId] = useState(users[0]?.id || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!userId) {
            setError('Por favor, seleccione un usuario.');
            return;
        }
        const success = onLogin(userId, password);
        if (!success) {
            setError('Usuario o contraseña incorrectos.');
            setPassword('');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <svg className="h-10 w-10 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h1 className="text-3xl font-bold">Black Medical</h1>
                    </div>
                    <p className="text-slate-400">Seleccione su usuario para continuar</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="user-select" className="block text-sm font-medium text-slate-300 mb-2">Usuario</label>
                        <select
                            id="user-select"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className="w-full bg-slate-700 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.role === 'admin' ? 'Admin' : 'Vendedor'})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            name="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="peer w-full bg-slate-700 text-white p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-transparent"
                            placeholder="Contraseña"
                            required
                        />
                         <label
                            htmlFor="password"
                            className="absolute left-4 -top-3.5 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-focus:-top-3.5 peer-focus:text-cyan-400 peer-focus:text-sm"
                        >
                            Contraseña
                        </label>
                    </div>

                    {error && (
                        <p className="text-sm text-red-400 text-center animate-pulse">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transform hover:scale-105"
                    >
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;