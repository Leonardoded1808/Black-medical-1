import React, { useState } from 'react';
import type { BackupData, Salesperson } from '../types';
import UploadIcon from './icons/UploadIcon';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ManagementProps {
    onImport: (data: BackupData) => void;
    onFullRestore: (data: any) => boolean;
    onFullBackup: () => void;
    onResetData: () => void;
    onExportSalespersonBackup: (salespersonId: string) => void;
    salespeople: Salesperson[];
}

const Management: React.FC<ManagementProps> = ({ 
    onImport, 
    onFullRestore, 
    onFullBackup,
    onResetData,
    onExportSalespersonBackup,
    salespeople
}) => {
    const [salespersonImportError, setSalespersonImportError] = useState<string | null>(null);
    const [salespersonImportSuccess, setSalespersonImportSuccess] = useState<string>('');

    const [fullRestoreError, setFullRestoreError] = useState<string | null>(null);
    
    const [selectedSalespersonId, setSelectedSalespersonId] = useState<string>('');

    const handleSalespersonFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSalespersonImportSuccess('');
        setSalespersonImportError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("El archivo no es legible.");
                }
                const data: BackupData = JSON.parse(text);
                
                if (!data.clients || !data.leads || !data.sourceSalespersonId) {
                     throw new Error("El archivo de backup de vendedor es inválido o está corrupto.");
                }

                onImport(data);
                setSalespersonImportSuccess(`Datos de ${file.name} importados correctamente.`);

            } catch (err: any) {
                setSalespersonImportError(err.message || 'Error al procesar el archivo.');
                setSalespersonImportSuccess('');
            } finally {
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };
    
    const handleFullRestoreFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setFullRestoreError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("El archivo no es legible.");
                const data = JSON.parse(text);
                if (data?.backupMetadata?.type !== 'full' || !data.users || !data.clients) {
                    throw new Error("El archivo no parece ser un backup completo válido.");
                }
                
                const confirmation = window.confirm(
                    '¡ADVERTENCIA! Esta acción reemplazará TODOS los datos actuales del CRM con los datos del archivo de backup. Esta acción es irreversible.\n\n¿Desea continuar?'
                );

                if (confirmation) {
                    const success = onFullRestore(data);
                    if (!success) {
                        setFullRestoreError('La restauración falló. Revise la consola para más detalles.');
                    }
                }
                
            } catch (err: any) {
                setFullRestoreError(err.message || 'Error al procesar el archivo de backup completo.');
            } finally {
                 event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };

    const handleResetClick = () => {
        if (window.confirm('¿Estás seguro de que quieres restablecer todos los datos a los valores predeterminados? Esta acción es irreversible y no se puede deshacer.')) {
            onResetData();
        }
    };


    return (
        <div className="p-4 sm:p-6 md:p-8 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-8">Gestión de Datos y Backups</h1>

            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                           <DownloadIcon className="h-5 w-5" /> Exportar Backup de Vendedor
                        </h2>
                        <p className="text-slate-400 mb-4 text-sm">
                            Genere un archivo <code>.json</code> con los datos específicos de un vendedor para que pueda trabajar de forma aislada.
                        </p>
                        <div className="flex items-center gap-4">
                            <select 
                                value={selectedSalespersonId}
                                onChange={(e) => setSelectedSalespersonId(e.target.value)}
                                className="w-full bg-slate-700 text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                                <option value="">Seleccione un vendedor...</option>
                                {salespeople.map(sp => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                            </select>
                            <button 
                                onClick={() => onExportSalespersonBackup(selectedSalespersonId)} 
                                disabled={!selectedSalespersonId}
                                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-5 rounded-lg transition-colors whitespace-nowrap"
                            >
                                Exportar
                            </button>
                        </div>
                    </div>
                     <div className="border-t border-slate-700"></div>
                     <div>
                        <h2 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                            <UploadIcon className="h-5 w-5" /> Importar Backup de Vendedor
                        </h2>
                        <p className="text-slate-400 mb-4 text-sm">
                            Seleccione un archivo <code>.json</code> de un vendedor para fusionar su trabajo (nuevos clientes, leads, etc.) con la base de datos principal.
                        </p>
                        <label htmlFor="salesperson-file-upload" className="w-full text-center cursor-pointer bg-slate-700/50 hover:bg-slate-700 border-2 border-slate-600 border-dashed rounded-lg p-4 block">
                            <span className="font-semibold text-cyan-300">Seleccionar archivo para importar...</span>
                            <input id="salesperson-file-upload" type="file" className="hidden" accept="application/json,.json" onChange={handleSalespersonFileChange} />
                        </label>
                        {salespersonImportSuccess && <p className="mt-3 text-sm text-green-400">{salespersonImportSuccess}</p>}
                        {salespersonImportError && <p className="mt-3 text-sm text-red-400">{salespersonImportError}</p>}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 space-y-8">
                        <div>
                             <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center gap-2">
                                <DownloadIcon className="h-5 w-5" /> Backup Completo del Sistema
                             </h2>
                             <p className="text-slate-400 mb-4 text-sm">
                                Genere un archivo <code>.json</code> con todos los datos del CRM, incluyendo usuarios y configuraciones.
                             </p>
                             <button onClick={onFullBackup} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-5 rounded-lg transition-colors w-full">
                                Generar Backup Completo
                             </button>
                        </div>
                        <div className="border-t border-slate-700"></div>
                        <div>
                            <h2 className="text-xl font-semibold text-teal-400 mb-4 flex items-center gap-2">
                                <UploadIcon className="h-5 w-5" /> Restaurar Sistema desde Backup
                            </h2>
                            <p className="text-slate-400 mb-4 text-sm">
                                Reemplace todos los datos actuales del CRM con los de un archivo de backup completo.
                            </p>
                             <label htmlFor="full-restore-upload" className="w-full text-center cursor-pointer bg-slate-700/50 hover:bg-slate-700 border-2 border-slate-600 border-dashed rounded-lg p-4 block">
                                <span className="font-semibold text-teal-300">Seleccionar archivo para restaurar...</span>
                                <input id="full-restore-upload" type="file" className="hidden" accept="application/json,.json" onChange={handleFullRestoreFileChange} />
                            </label>
                            {fullRestoreError && <p className="mt-3 text-sm text-red-400">{fullRestoreError}</p>}
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-red-500/50">
                         <div className="flex items-start gap-4">
                            <ExclamationTriangleIcon className="h-8 w-8 text-red-400 flex-shrink-0 mt-1"/>
                            <div>
                                <h2 className="text-xl font-semibold text-red-400 mb-2">Zona de Peligro</h2>
                                <p className="text-slate-400 mb-4 text-sm">
                                    <span className="font-bold">¡Acción destructiva!</span> Esta acción borrará permanentemente todos los datos del CRM y los restaurará a los valores de fábrica. No se puede deshacer.
                                </p>
                                <button onClick={handleResetClick} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-5 rounded-lg transition-colors w-full flex items-center justify-center gap-2">
                                    <RefreshIcon className="h-5 w-5"/>
                                    Restablecer Datos del Sistema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Management;