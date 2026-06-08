
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { DUMMY_CLIENTS, DUMMY_LEADS, DUMMY_PRODUCTS, DUMMY_TASKS, DUMMY_SUPPORT_TICKETS, DUMMY_SALESPEOPLE, DUMMY_INTERACTIONS, DUMMY_OPPORTUNITIES, DUMMY_USERS, DUMMY_WHATSAPP_TEMPLATES } from './constants';
import type { Client, Lead, Product, Task, SupportTicket, Salesperson, Interaction, Opportunity, OpportunityProduct, User, BackupData, WhatsAppTemplate } from './types';
import { LeadStatus, OpportunityStage, TaskStatus, TaskPriority, TaskType } from './types';

import Panel from './components/Dashboard';
import Ventas from './components/Clients';
import Clientes from './components/Leads';
import Prospectos from './components/Sales';
import Salespeople from './components/Salespeople';
import Products from './components/Products';
import AiCampaigns from './components/AiCampaigns';
import Agenda from './components/Agenda';
import Support from './components/Support';
import WhatsAppTemplates from './components/WhatsAppTemplates';
import GlobalSearch from './components/GlobalSearch';
import Login from './components/Login';
import Management from './components/Management';
import PasswordChange from './components/PasswordChange';
import UserPasswordChangeModal from './components/UserPasswordChangeModal';


import ChartBarIcon from './components/icons/ChartBarIcon';
import UserGroupIcon from './components/icons/UserGroupIcon';
import TagIcon from './components/TagIcon';
import BriefcaseIcon from './components/icons/BriefcaseIcon';
import UserIcon from './components/icons/UserIcon';
import CubeIcon from './components/icons/CubeIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import CalendarIcon from './components/icons/CalendarIcon';
import WrenchScrewdriverIcon from './components/icons/WrenchScrewdriverIcon';
import MenuIcon from './components/icons/MenuIcon';
import XIcon from './components/icons/XIcon';
import LogoutIcon from './components/icons/LogoutIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import CogIcon from './components/icons/CogIcon';
import KeyIcon from './components/icons/KeyIcon';
import UploadIcon from './components/icons/UploadIcon';
import SearchIcon from './components/icons/SearchIcon';
import ChatBubbleBottomCenterTextIcon from './components/icons/ChatBubbleBottomCenterTextIcon';
import BellIcon from './components/icons/BellIcon';


// Custom hook to manage state in localStorage
function useLocalStorage<T>(key: string, initialValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === 'undefined') {
            return initialValue instanceof Function ? initialValue() : initialValue;
        }
        try {
            const item = window.localStorage.getItem(key);
            if (item) {
                return JSON.parse(item);
            }
        } catch (error) {
            console.warn(`Error reading localStorage key “${key}”:`, error);
        }
        
        return initialValue instanceof Function ? initialValue() : initialValue;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            } catch (error) {
                console.warn(`Error setting localStorage key “${key}”:`, error);
            }
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

import { 
    subscribeToCollection, 
    saveDocument, 
    addDocument, 
    deleteDocument, 
    auth, 
    signInWithGoogle, 
    logout 
} from './services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
    // Main data store (Single Source of Truth)
    const [mainClients, setMainClients] = useLocalStorage<Client[]>('crm_clients', []);
    const [mainLeads, setMainLeads] = useLocalStorage<Lead[]>('crm_leads', []);
    const [mainProducts, setMainProducts] = useLocalStorage<Product[]>('crm_products', []);
    const [mainOpportunities, setMainOpportunities] = useLocalStorage<Opportunity[]>('crm_opportunities', []);
    const [mainTasks, setMainTasks] = useLocalStorage<Task[]>('crm_tasks', []);
    const [mainSupportTickets, setMainSupportTickets] = useLocalStorage<SupportTicket[]>('crm_tickets', []);
    const [mainSalespeople, setMainSalespeople] = useLocalStorage<Salesperson[]>('crm_salespeople', []);
    const [mainInteractions, setMainInteractions] = useLocalStorage<Interaction[]>('crm_interactions', []);
    const [mainWhatsAppTemplates, setMainWhatsAppTemplates] = useLocalStorage<WhatsAppTemplate[]>('crm_whatsapp_templates', []);
    const [users, setUsers] = useState<User[]>(DUMMY_USERS); // Users managed via auth/admin mainly, keeping dummy as base for local login if needed or migration

    useEffect(() => {
        const unsubClients = subscribeToCollection<Client>('clients', setMainClients);
        const unsubLeads = subscribeToCollection<Lead>('leads', setMainLeads);
        const unsubProducts = subscribeToCollection<Product>('products', setMainProducts);
        const unsubOpps = subscribeToCollection<Opportunity>('opportunities', setMainOpportunities);
        const unsubTasks = subscribeToCollection<Task>('tasks', setMainTasks);
        const unsubTickets = subscribeToCollection<SupportTicket>('supportTickets', setMainSupportTickets);
        const unsubSalespeople = subscribeToCollection<Salesperson>('salespeople', setMainSalespeople);
        const unsubInteractions = subscribeToCollection<Interaction>('interactions', setMainInteractions);
        const unsubTemplates = subscribeToCollection<WhatsAppTemplate>('whatsappTemplates', setMainWhatsAppTemplates);

        return () => {
            unsubClients();
            unsubLeads();
            unsubProducts();
            unsubOpps();
            unsubTasks();
            unsubTickets();
            unsubSalespeople();
            unsubInteractions();
            unsubTemplates();
        };
    }, []);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
    const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('currentUser');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch {
            return null;
        }
    });

    const salespersonImportRef = useRef<HTMLInputElement>(null);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('currentUser');
        setCurrentUser(null);
    }, []);

    // Fix for ensuring admin password from constants is always respected over stale localStorage
    useEffect(() => {
        const canonicalAdminUser = DUMMY_USERS.find(u => u.id === 'ADM');
        if (!canonicalAdminUser) return;

        const adminUserInState = users.find(u => u.id === 'ADM');
        
        if (!adminUserInState || adminUserInState.password_DO_NOT_USE !== canonicalAdminUser.password_DO_NOT_USE) {
            setUsers(currentUsers => {
                const adminExists = currentUsers.some(u => u.id === 'ADM');
                if (adminExists) {
                    return currentUsers.map(u => 
                        u.id === 'ADM' 
                        ? { ...u, password_DO_NOT_USE: canonicalAdminUser.password_DO_NOT_USE } 
                        : u
                    );
                } else {
                    return [canonicalAdminUser, ...currentUsers];
                }
            });
        }
    }, []); // Run only once to prevent loops and fix on load

    useEffect(() => {
        if (currentUser?.mustChangePassword) {
            setRequiresPasswordChange(true);
        } else {
            setRequiresPasswordChange(false);
        }
    }, [currentUser]);

    // STARTUP BUG FIX: Validate user session on initial load.
    useEffect(() => {
        // This prevents errors if an admin has deleted the user, but their session persists.
        if (currentUser && !users.some(u => u.id === currentUser.id)) {
            console.warn(`Stale user session found for ID ${currentUser.id}. Logging out.`);
            handleLogout();
        }
    }, []); // Empty dependency array ensures this runs only once on mount.


    const setAuth = (user: User | null) => {
        if (user) {
            sessionStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            sessionStorage.removeItem('currentUser');
        }
        setCurrentUser(user);
    }
    
    // Derived data object passed to components based on current user role.
    // This is the single point of data filtering, ensuring consistency.
    const data = useMemo(() => {
        const isAdmin = currentUser?.role === 'admin';

        if (isAdmin || !currentUser || currentUser.mustChangePassword) {
            return {
                clients: mainClients,
                leads: mainLeads,
                products: mainProducts,
                opportunities: mainOpportunities,
                tasks: mainTasks,
                supportTickets: mainSupportTickets,
                salespeople: mainSalespeople,
                interactions: mainInteractions,
                whatsappTemplates: mainWhatsAppTemplates,
            };
        }

        // If salesperson, filter data on the fly from the main state
        const salespersonId = currentUser.id;
        const salespersonLeads = mainLeads.filter(l => l.salespersonId === salespersonId);
        const salespersonOpps = mainOpportunities.filter(o => o.salespersonId === salespersonId);

        // Get all clients associated with this salesperson's opportunities and leads
        const clientIdsFromOpps = new Set(salespersonOpps.map(o => o.clientId).filter(id => id));
        const leadCompanies = new Set(salespersonLeads.map(l => l.company.toLowerCase()));
        
        mainClients.forEach(c => {
            if (leadCompanies.has(c.name.toLowerCase())) {
                clientIdsFromOpps.add(c.id);
            }
        });

        return {
            // Salespeople can see all clients, products, and other salespeople for context.
            clients: mainClients, 
            products: mainProducts,
            salespeople: mainSalespeople,
            whatsappTemplates: mainWhatsAppTemplates,
            
            // Data filtered for the current salesperson
            leads: salespersonLeads,
            opportunities: salespersonOpps,
            tasks: mainTasks.filter(t => t.salespersonId === salespersonId),
            supportTickets: mainSupportTickets.filter(st => st.clientId && clientIdsFromOpps.has(st.clientId)),
            
            // Pass all interactions so components can resolve relationships (e.g., lead -> opportunity)
            interactions: mainInteractions,
        };
    }, [currentUser, mainClients, mainLeads, mainProducts, mainOpportunities, mainTasks, mainSupportTickets, mainSalespeople, mainInteractions, mainWhatsAppTemplates]);
    

    const handleLogin = (userId: string, pass: string): boolean => {
        const user = users.find(u => u.id === userId);
        if (user && user.password_DO_NOT_USE === pass) {
            setAuth(user);
            return true;
        }
        return false;
    };

    const changeUserPassword = (userId: string, newPassword: string) => {
        let updatedUser: User | null = null;
        setUsers(prevUsers => prevUsers.map(u => {
            if (u.id === userId) {
                updatedUser = { ...u, password_DO_NOT_USE: newPassword, mustChangePassword: false };
                return updatedUser;
            }
            return u;
        }));

        if (updatedUser) {
            setAuth(updatedUser);
        }
    };

    const handleSelfPasswordChange = (userId: string, oldPass: string, newPass: string): { success: boolean; message: string } => {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: 'Usuario no encontrado.' };
        }

        const user = users[userIndex];

        if (user.password_DO_NOT_USE !== oldPass) {
            return { success: false, message: 'La contraseña actual es incorrecta.' };
        }

        const updatedUser = { ...user, password_DO_NOT_USE: newPass };

        setUsers(prevUsers => {
            const newUsers = [...prevUsers];
            newUsers[userIndex] = updatedUser;
            return newUsers;
        });

        setAuth(updatedUser); // This will update sessionStorage and currentUser state

        return { success: true, message: 'Contraseña actualizada con éxito.' };
    };

    const handleFullBackup = () => {
        if (!currentUser || currentUser.role !== 'admin') return;

        const fullBackupData = {
            backupMetadata: {
                type: 'full',
                exportedBy: currentUser.id,
                exportDate: new Date().toISOString(),
            },
            clients: mainClients,
            leads: mainLeads,
            products: mainProducts,
            opportunities: mainOpportunities,
            tasks: mainTasks,
            supportTickets: mainSupportTickets,
            salespeople: mainSalespeople,
            interactions: mainInteractions,
            whatsappTemplates: mainWhatsAppTemplates,
            users: users,
        };

        const jsonString = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(fullBackupData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `black-medical-full-backup-${date}.json`;
        link.click();
    };

    const handleFullBackupRestore = (data: any) => {
        if (!currentUser || currentUser.role !== 'admin') return false;
        
        try {
            setMainClients(data.clients || []);
            setMainLeads(data.leads || []);
            setMainProducts(data.products || []);
            setMainOpportunities(data.opportunities || []);
            setMainTasks(data.tasks || []);
            setMainSupportTickets(data.supportTickets || []);
            setMainSalespeople(data.salespeople || []);
            setMainInteractions(data.interactions || []);
            setMainWhatsAppTemplates(data.whatsappTemplates || []);
            setUsers(data.users || []);
            alert('La restauración del backup se ha completado con éxito. La página se recargará ahora.');
            window.location.reload();
            return true;
        } catch (error) {
            alert('Ocurrió un error durante la restauración. Por favor, verifique el archivo de backup.');
            console.error("Error restoring full backup:", error);
            return false;
        }
    };


    const handleResetData = () => {
        if (currentUser?.role !== 'admin') return;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('crm_')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.removeItem('currentUser');
        window.location.reload();
    };
    
    const handleExportSalespersonBackup = (salespersonId: string) => {
        if (currentUser?.role !== 'admin' || !salespersonId) return;

        const salesperson = mainSalespeople.find(sp => sp.id === salespersonId);
        if (!salesperson) {
            alert("Vendedor no encontrado.");
            return;
        }

        const assignedLeads = mainLeads.filter(l => l.salespersonId === salespersonId);
        const assignedOpportunities = mainOpportunities.filter(o => o.salespersonId === salespersonId);
        
        const clientIdsFromOpps = new Set(assignedOpportunities.map(o => o.clientId));
        const leadCompanies = new Set(assignedLeads.map(l => l.company.toLowerCase()));
        
        const assignedClients = mainClients.filter(c => 
            clientIdsFromOpps.has(c.id) || leadCompanies.has(c.name.toLowerCase())
        );
        const assignedClientIds = new Set(assignedClients.map(c => c.id));
        
        const salespersonData: BackupData = {
            sourceSalespersonId: salespersonId,
            clients: assignedClients,
            leads: assignedLeads,
            products: mainProducts, // All products
            opportunities: assignedOpportunities,
            tasks: mainTasks.filter(t => t.salespersonId === salespersonId),
            interactions: mainInteractions.filter(i => 
                i.salespersonId === salespersonId || 
                assignedLeads.some(l => l.id === i.leadId) || 
                assignedOpportunities.some(o => o.id === i.opportunityId)
            ),
            supportTickets: mainSupportTickets.filter(st => assignedClientIds.has(st.clientId!)),
            salespeople: mainSalespeople, // All salespeople for context
            whatsappTemplates: mainWhatsAppTemplates, // Export ALL admin templates so salesperson gets them
        };

        const jsonString = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(salespersonData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `backup-vendedor-${salesperson.name.replace(/\s+/g, '_')}-${date}.json`;
        link.click();
    };

    const handleImportSalespersonData = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!currentUser || currentUser.role !== 'salesperson') return;

        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read.");
                const data: BackupData = JSON.parse(text);

                if (!data.sourceSalespersonId || !data.clients || !data.products) {
                    throw new Error("Invalid salesperson backup file format.");
                }

                if (data.sourceSalespersonId !== currentUser.id) {
                    throw new Error(`Este backup pertenece a otro vendedor (${data.sourceSalespersonId}) y no puede ser importado.`);
                }
                
                // Persistent merge: Save each new item to Firestore
                const persistentMerge = async <T extends {id: string}>(collectionName: string, local: T[], incoming: T[]) => {
                    const localIds = new Set(local.map(item => item.id));
                    const newItems = incoming.filter(item => !localIds.has(item.id));
                    
                    for (const item of newItems) {
                        await saveDocument(collectionName, item.id, item);
                    }
                    return newItems.length;
                };
                
                const clientsAdded = await persistentMerge('clients', mainClients, data.clients);
                const leadsAdded = await persistentMerge('leads', mainLeads, data.leads);
                const prodsAdded = await persistentMerge('products', mainProducts, data.products || []);
                const oppsAdded = await persistentMerge('opportunities', mainOpportunities, data.opportunities || []);
                const tasksAdded = await persistentMerge('tasks', mainTasks, data.tasks || []);
                const ticketsAdded = await persistentMerge('supportTickets', mainSupportTickets, data.supportTickets || []);
                const interactionsAdded = await persistentMerge('interactions', mainInteractions, data.interactions || []);
                const templatesAdded = await persistentMerge('whatsappTemplates', mainWhatsAppTemplates, data.whatsappTemplates || []);
                
                alert(`Backup importado con éxito: ${clientsAdded + leadsAdded + prodsAdded + oppsAdded + tasksAdded + ticketsAdded + interactionsAdded + templatesAdded} nuevos registros añadidos.`);

            } catch (err: any) {
                alert(`Error al importar: ${err.message}`);
                console.error("Error importing salesperson data:", err);
            } finally {
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };

    const handleExportWorkdayData = () => {
        if (!currentUser || currentUser.role !== 'salesperson') return;
        
        // The `data` object from useMemo already contains the correctly filtered data
        // for the current user, matching what was previously in local state.
        const backupData: BackupData = {
            clients: data.clients,
            leads: data.leads,
            products: data.products,
            opportunities: data.opportunities,
            tasks: data.tasks,
            supportTickets: data.supportTickets,
            salespeople: data.salespeople,
            interactions: data.interactions,
            whatsappTemplates: data.whatsappTemplates,
            sourceSalespersonId: currentUser.id,
        };
        const jsonString = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backupData, null, 2))}`;
        const link = document.createElement("a");
        link.href = jsonString;
        const date = new Date().toISOString().split('T')[0];
        link.download = `jornada-${currentUser.name.replace(' ', '_')}-${date}.json`;
        link.click();
    };
    
    const handleMergeSalespersonData = async (data: BackupData) => {
        if (currentUser?.role !== 'admin') return;
        
        // Persistent merge for admin
        const persistentMerge = async <T extends {id: string}>(collectionName: string, mainData: T[], localData: T[]) => {
            const mainIds = new Set(mainData.map(item => item.id));
            const newItems = localData.filter(item => !mainIds.has(item.id));
            
            for (const item of newItems) {
                await saveDocument(collectionName, item.id, item);
            }
            return newItems.length;
        };
        
        const cCount = await persistentMerge('clients', mainClients, data.clients || []);
        const lCount = await persistentMerge('leads', mainLeads, data.leads || []);
        const pCount = await persistentMerge('products', mainProducts, data.products || []);
        const oCount = await persistentMerge('opportunities', mainOpportunities, data.opportunities || []);
        const tCount = await persistentMerge('tasks', mainTasks, data.tasks || []);
        const iCount = await persistentMerge('interactions', mainInteractions, data.interactions || []);
        const sCount = await persistentMerge('supportTickets', mainSupportTickets, data.supportTickets || []);
        const wCount = await persistentMerge('whatsappTemplates', mainWhatsAppTemplates, data.whatsappTemplates || []);
        
        alert(`Los datos han sido anexados con éxito. Registros añadidos: ${cCount + lCount + pCount + oCount + tCount + iCount + sCount + wCount}.`);
    };

    // --- Memoized CRUD Functions ---
    const addClient = useCallback(async (clientData: Omit<Client, 'id'>) => {
        const id = `cli-${Date.now()}`;
        const newClient: Client = { ...clientData, id, createdAt: new Date().toISOString() };
        setMainClients(prev => [newClient, ...prev]);
        saveDocument('clients', id, newClient).catch(console.error);
        return newClient;
    }, []);

    const updateClient = useCallback(async (updatedClient: Client) => {
        setMainClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        saveDocument('clients', updatedClient.id, updatedClient).catch(console.error);
    }, []);
    
    const deleteClient = useCallback(async (clientId: string) => {
        const clientToDelete = mainClients.find(c => c.id === clientId);
        if (!clientToDelete) return;

        setMainClients(prev => prev.filter(c => c.id !== clientId));

        const clientNameToDeleteLower = clientToDelete.name.toLowerCase();

        const opportunitiesToDeleteIds = mainOpportunities
            .filter(o => o.clientId === clientId || o.clientName.toLowerCase() === clientNameToDeleteLower)
            .map(o => o.id);
        
        const leadsToDeleteIds = mainLeads
            .filter(l => l.company.toLowerCase() === clientNameToDeleteLower)
            .map(l => l.id);

        await deleteDocument('clients', clientId);
        for (const id of opportunitiesToDeleteIds) await deleteDocument('opportunities', id);
        for (const id of leadsToDeleteIds) await deleteDocument('leads', id);
    }, [mainClients, mainLeads, mainOpportunities]);

    const addLead = useCallback(async (leadData: Omit<Lead, 'id'>) => {
        const id = `lead-${Date.now()}`;
        const newLead: Lead = { 
            ...leadData, 
            id, 
            salespersonId: leadData.salespersonId || currentUser?.id || '', 
            createdAt: new Date().toISOString(),
            isUnread: true 
        };
        setMainLeads(prev => [newLead, ...prev]);
        saveDocument('leads', id, newLead).catch(console.error);
    }, [currentUser]);

    const updateLead = useCallback(async (updatedLead: Lead) => {
        const original = mainLeads.find(l => l.id === updatedLead.id);
        if (original && original.salespersonId !== updatedLead.salespersonId) {
            updatedLead.isUnread = true;
        }
        setMainLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        saveDocument('leads', updatedLead.id, updatedLead).catch(console.error);
    }, [mainLeads]);

    const bulkUpdateLeads = useCallback(async (leadsToUpdate: Lead[]) => {
        setMainLeads(prev => {
            const updatedMap = new Map(leadsToUpdate.map(l => [l.id, l]));
            return prev.map(l => updatedMap.has(l.id) ? updatedMap.get(l.id)! : l);
        });
        
        for (const lead of leadsToUpdate) {
            const original = mainLeads.find(l => l.id === lead.id);
            if (original && original.salespersonId !== lead.salespersonId) {
                lead.isUnread = true;
            }
            saveDocument('leads', lead.id, lead).catch(console.error);
        }
    }, [mainLeads]);
    
    const deleteLead = useCallback(async (leadId: string) => {
        setMainLeads(prev => prev.filter(l => l.id !== leadId));
        deleteDocument('leads', leadId).catch(console.error);
    }, []);

    const addProduct = useCallback(async (productData: Omit<Product, 'id'>) => {
        const id = `prod-${Date.now()}`;
        const newProduct: Product = { ...productData, id };
        
        // Optimistic update
        setMainProducts(prev => [newProduct, ...prev]);
        
        // Background sync
        saveDocument('products', id, newProduct).catch(e => {
            console.error("Failed to sync new product:", e);
        });
    }, [setMainProducts]);

    const updateProduct = useCallback(async (updatedProduct: Product) => {
         // Optimistic update
         setMainProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
         
         // Background sync
         saveDocument('products', updatedProduct.id, updatedProduct).catch(e => {
            console.error("Failed to sync updated product:", e);
         });
    }, [setMainProducts]);

    const deleteProduct = useCallback(async (productId: string) => {
        setMainProducts(prev => prev.filter(p => p.id !== productId));
        deleteDocument('products', productId).catch(console.error);
    }, []);

    const addOpportunity = useCallback(async (oppData: Omit<Opportunity, 'id' | 'clientName'>, explicitClientName?: string) => {
        let clientName = explicitClientName || '';
        if (oppData.clientId && !clientName) {
            const client = mainClients.find(c => c.id === oppData.clientId);
            if (client) clientName = client.name;
        } else if (!clientName) {
             const lead = mainLeads.find(l => l.id === oppData.originalLeadId);
             if (lead) clientName = lead.name;
        }
        
        const opportunityId = `opp-${Date.now()}`;
        const newOpp: Opportunity = { 
            ...oppData, 
            id: opportunityId, 
            clientName: clientName || 'Desconocido', 
            createdAt: new Date().toISOString(),
            salespersonId: oppData.salespersonId || currentUser?.id || ''
        };
        setMainOpportunities(prev => [newOpp, ...prev]);
        saveDocument('opportunities', opportunityId, newOpp).catch(console.error);
        
        const newOpportunityTask: Task = {
            id: `task-opp-${opportunityId}`,
            title: `Cierre Oportunidad: ${newOpp.clientName}`,
            description: `Valor estimado: €${newOpp.value.toLocaleString('es-ES')}`,
            dueDate: newOpp.closeDate,
            salespersonId: newOpp.salespersonId,
            status: TaskStatus.PENDIENTE,
            priority: TaskPriority.ALTA,
            type: TaskType.RECORDATORIO,
            opportunityId: newOpp.id,
            opportunityValue: newOpp.value,
            clientId: newOpp.clientId,
            associatedName: newOpp.clientName,
        };
        setMainTasks(prev => [newOpportunityTask, ...prev]);
        saveDocument('tasks', newOpportunityTask.id, newOpportunityTask).catch(console.error);
        return newOpp;
    }, [mainClients, mainLeads, currentUser, setMainOpportunities, setMainTasks]);

    const updateOpportunity = useCallback(async (updatedOpp: Opportunity) => {
        setMainOpportunities(prev => prev.map(o => o.id === updatedOpp.id ? updatedOpp : o));
        saveDocument('opportunities', updatedOpp.id, updatedOpp).catch(console.error);
        const taskData = {
            title: `Cierre Oportunidad: ${updatedOpp.clientName}`,
            description: `Valor estimado: €${updatedOpp.value.toLocaleString('es-ES')}`,
            dueDate: updatedOpp.closeDate,
            salespersonId: updatedOpp.salespersonId,
            clientId: updatedOpp.clientId,
            associatedName: updatedOpp.clientName,
            opportunityValue: updatedOpp.value,
        };
        setMainTasks(prev => prev.map(t => t.id === `task-opp-${updatedOpp.id}` ? { ...t, ...taskData } : t));
        saveDocument('tasks', `task-opp-${updatedOpp.id}`, taskData).catch(console.error);
    }, [setMainOpportunities, setMainTasks]);

    const deleteOpportunity = useCallback(async (oppId: string) => {
        setMainOpportunities(prev => prev.filter(o => o.id !== oppId));
        setMainTasks(prev => prev.filter(t => t.id !== `task-opp-${oppId}`));
        deleteDocument('opportunities', oppId).catch(console.error);
        deleteDocument('tasks', `task-opp-${oppId}`).catch(console.error);
    }, [setMainOpportunities, setMainTasks]);

    const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'associatedName' | 'opportunityValue'> & { associatedName?: string, opportunityValue?: number }) => {
        let associatedName = taskData.associatedName || '';
        let opportunityValue = taskData.opportunityValue;

        if (taskData.clientId) {
            const client = mainClients.find(c => c.id === taskData.clientId);
            if (client) associatedName = client.name;
        } else if (taskData.leadId) {
            const lead = mainLeads.find(l => l.id === taskData.leadId);
            if (lead) associatedName = lead.name;
        } else if (taskData.opportunityId) {
            const opp = mainOpportunities.find(o => o.id === taskData.opportunityId);
            if (opp) {
                associatedName = opp.clientName;
                opportunityValue = opp.value;
            }
        }

        const id = `task-${Date.now()}`;
        const newTask: Task = {
            ...taskData,
            id,
            associatedName,
            opportunityValue,
            salespersonId: taskData.salespersonId || currentUser?.id || ''
        };
        setMainTasks(prev => [newTask, ...prev]);
        saveDocument('tasks', id, newTask).catch(console.error);
    }, [mainClients, mainLeads, mainOpportunities, currentUser, setMainTasks]);

    const updateTask = useCallback(async (updatedTask: Task) => {
        setMainTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        saveDocument('tasks', updatedTask.id, updatedTask).catch(console.error);
    }, [setMainTasks]);

    const deleteTask = useCallback(async (taskId: string) => {
        setMainTasks(prev => prev.filter(t => t.id !== taskId));
        deleteDocument('tasks', taskId).catch(console.error);
    }, [setMainTasks]);

    const addSalesperson = useCallback(async (spData: Omit<Salesperson, 'id'>, password: string) => {
        const id = `sp-${Date.now()}`;
        const newSp: Salesperson = { ...spData, id };
        const newUser: User = { ...newSp, role: 'salesperson', password_DO_NOT_USE: password, mustChangePassword: true };
        setMainSalespeople(prev => [newSp, ...prev]);
        saveDocument('salespeople', id, newSp).catch(console.error);
        setUsers(prev => [newUser, ...prev]);
    }, [setMainSalespeople]);

    const updateSalesperson = useCallback(async (updatedSp: Salesperson, newPassword?: string) => {
        setMainSalespeople(prev => prev.map(s => s.id === updatedSp.id ? updatedSp : s));
        saveDocument('salespeople', updatedSp.id, updatedSp).catch(console.error);
        if (newPassword) {
             setUsers(prev => prev.map(u => u.id === updatedSp.id ? { ...u, ...updatedSp, password_DO_NOT_USE: newPassword } : u));
        }
    }, [setMainSalespeople]);

    const deleteSalesperson = useCallback(async (spId: string) => {
        setMainSalespeople(prev => prev.filter(s => s.id !== spId));
        deleteDocument('salespeople', spId).catch(console.error);
    }, [setMainSalespeople]);

    const addInteraction = useCallback(async (interactionData: Omit<Interaction, 'id' | 'date'>) => {
        const now = new Date();
        const id = `int-${now.getTime()}`;
        const newInteraction: Interaction = {
            ...interactionData,
            id,
            date: now.toISOString(),
            salespersonId: interactionData.salespersonId || currentUser?.id || ''
        };
        setMainInteractions(prev => [newInteraction, ...prev]);
        saveDocument('interactions', id, newInteraction).catch(console.error);
        
        if (interactionData.leadId) {
            const lead = mainLeads.find(l => l.id === interactionData.leadId);
            if (lead) {
                const updatedLead = { ...lead, lastInteractionDate: now.toISOString().split('T')[0] };
                setMainLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        saveDocument('leads', updatedLead.id, updatedLead).catch(console.error);
            }
        }
    }, [currentUser, mainLeads, setMainInteractions, setMainLeads]);

    const updateInteraction = useCallback(async (updatedInt: Interaction) => {
        setMainInteractions(prev => prev.map(i => i.id === updatedInt.id ? updatedInt : i));
        saveDocument('interactions', updatedInt.id, updatedInt).catch(console.error);
    }, [setMainInteractions]);

    const deleteInteraction = useCallback(async (intId: string) => {
       setMainInteractions(prev => prev.filter(i => i.id !== intId));
       deleteDocument('interactions', intId).catch(console.error);
    }, [setMainInteractions]);

    const addWhatsAppTemplate = useCallback(async (templateData: Omit<WhatsAppTemplate, 'id'>) => {
        const id = `wa-${Date.now()}`;
        const newTemplate: WhatsAppTemplate = { ...templateData, id };
        setMainWhatsAppTemplates(prev => [newTemplate, ...prev]);
        saveDocument('whatsappTemplates', id, newTemplate).catch(console.error);
    }, [setMainWhatsAppTemplates]);

    const updateWhatsAppTemplate = useCallback(async (updatedTemp: WhatsAppTemplate) => {
        setMainWhatsAppTemplates(prev => prev.map(w => w.id === updatedTemp.id ? updatedTemp : w));
        saveDocument('whatsappTemplates', updatedTemp.id, updatedTemp).catch(console.error);
    }, [setMainWhatsAppTemplates]);

    const deleteWhatsAppTemplate = useCallback(async (tempId: string) => {
        setMainWhatsAppTemplates(prev => prev.filter(w => w.id !== tempId));
        deleteDocument('whatsappTemplates', tempId).catch(console.error);
    }, [setMainWhatsAppTemplates]);

    const addTicket = useCallback(async (ticketData: Omit<SupportTicket, 'id' | 'clientName' | 'createdDate'>) => {
        const client = mainClients.find(c => c.id === ticketData.clientId);
        if (!client) return;
        const id = `tic-${Date.now()}`;
        const newTicket: SupportTicket = { ...ticketData, id, clientName: client.name, createdDate: new Date().toISOString().split('T')[0]};
        setMainSupportTickets(prev => [newTicket, ...prev]);
        saveDocument('supportTickets', id, newTicket).catch(console.error);
    }, [mainClients, setMainSupportTickets]);

    const updateTicket = useCallback(async (updatedTicket: SupportTicket) => {
         const client = mainClients.find(c => c.id === updatedTicket.clientId);
         if (!client) return;
         const fullyUpdatedTicket = { ...updatedTicket, clientName: client.name };
         setMainSupportTickets(prev => prev.map(t => t.id === fullyUpdatedTicket.id ? fullyUpdatedTicket : t));
        saveDocument('supportTickets', updatedTicket.id, fullyUpdatedTicket).catch(console.error);
    }, [mainClients, setMainSupportTickets]);

    const deleteTicket = useCallback(async (ticketId: string) => {
        setMainSupportTickets(prev => prev.filter(t => t.id !== ticketId));
        deleteDocument('supportTickets', ticketId).catch(console.error);
    }, [setMainSupportTickets]);

    const convertLeadToOpportunity = useCallback(async (
        leadId: string, 
        opportunityData: { products: OpportunityProduct[], closeDate: string, stage: OpportunityStage, salespersonId: string }
    ) => {
        const lead = mainLeads.find(l => l.id === leadId);
        if (!lead) return null;
        
        const value = opportunityData.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
        let finalClientId = undefined;

        if (opportunityData.stage === OpportunityStage.GANADA) {
            const existingClient = mainClients.find(c => c.name.toLowerCase() === lead.company.toLowerCase());
            if (existingClient) {
                finalClientId = existingClient.id;
            } else {
                const newClient = await addClient({
                    name: lead.company || lead.name,
                    contactPerson: lead.name,
                    email: lead.email,
                    phone: lead.phone,
                    address: ''
                });
                finalClientId = newClient.id;
            }
        }

        const newOpp = await addOpportunity({
            products: opportunityData.products,
            closeDate: opportunityData.closeDate,
            salespersonId: opportunityData.salespersonId,
            stage: opportunityData.stage,
            value: value,
            originalLeadId: leadId,
            clientId: finalClientId,
        }, lead.company || lead.name);

        if (newOpp) {
            await updateLead({ ...lead, status: LeadStatus.CALIFICADO });
        }
        
        return newOpp;
    }, [addOpportunity, updateLead, mainLeads, mainClients, addClient]);
    
    const pendingTasksCount = useMemo(() => {
        if (!currentUser) return 0;
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        return data.tasks.filter(task => {
            if (task.status !== TaskStatus.PENDIENTE) return false;
            if (currentUser.role === 'salesperson' && task.salespersonId !== currentUser.id) return false;
            
            const taskDate = new Date(task.dueDate);
            return taskDate <= now;
        }).length;
    }, [data.tasks, currentUser]);

    const navLinkClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors";
    const activeClassName = `${navLinkClasses} bg-slate-700 text-white`;
    const inactiveClassName = `${navLinkClasses} text-slate-400 hover:bg-slate-700/50 hover:text-white`;

    const navItems = [
        { path: "/panel", icon: <ChartBarIcon className="h-5 w-5" />, label: "Panel" },
        { path: "/listado", icon: <TagIcon className="h-5 w-5" />, label: "Clientes" },
        { path: "/opportunities", icon: <BriefcaseIcon className="h-5 w-5" />, label: "Prospectos" },
        { path: "/clients", icon: <UserGroupIcon className="h-5 w-5" />, label: "Ventas" },
        { path: "/salespeople", icon: <UserIcon className="h-5 w-5" />, label: "Vendedores", adminOnly: true },
        { path: "/products", icon: <CubeIcon className="h-5 w-5" />, label: "Productos" },
        { path: "/campaigns", icon: <SparklesIcon className="h-5 w-5" />, label: "Campañas IA" },
        { path: "/agenda", icon: <CalendarIcon className="h-5 w-5" />, label: "Agenda" },
        { path: "/whatsapp-prompts", icon: <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />, label: "WhatsApp Prompts" },
        { path: "/support", icon: <WrenchScrewdriverIcon className="h-5 w-5" />, label: "Soporte" },
        { path: "/management", icon: <CogIcon className="h-5 w-5" />, label: "Gestión", adminOnly: true },
    ].filter(item => currentUser?.role === 'admin' || !item.adminOnly);

    if (!currentUser) {
        return <Login onLogin={handleLogin} users={users} />;
    }

    if (requiresPasswordChange) {
        return <PasswordChange user={currentUser} onChangePassword={changeUserPassword} onLogout={() => handleLogout()} />;
    }

    return (
        <ReactRouterDOM.HashRouter>
            <div className="flex h-screen bg-slate-900 font-sans">
                {isMobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true"></div>}
                
                <aside className={`w-64 bg-slate-800 text-white flex flex-col p-4 border-r border-slate-700/50 fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-40 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between space-x-2 p-3 mb-6">
                         <div className="flex items-center space-x-2">
                            <svg className="h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-xl font-bold">Black Medical</span>
                        </div>
                        <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu"><XIcon className="h-6 w-6"/></button>
                    </div>
                    <nav className="flex-1 flex flex-col space-y-2 overflow-y-auto">
                        {navItems.map(item => (
                            <ReactRouterDOM.NavLink key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => isActive ? activeClassName : inactiveClassName}>
                                {item.icon}<span>{item.label}</span>
                            </ReactRouterDOM.NavLink>
                        ))}
                    </nav>
                     <div className="mt-auto pt-4 border-t border-slate-700/50 space-y-2">
                        {currentUser.role === 'salesperson' && (
                            <>
                                <button onClick={handleExportWorkdayData} className={`${inactiveClassName} w-full !text-cyan-400 hover:!text-cyan-300`}>
                                    <DownloadIcon className="h-5 w-5" /><span>Exportar Jornada</span>
                                </button>
                                <button onClick={() => salespersonImportRef.current?.click()} className={`${inactiveClassName} w-full !text-green-400 hover:!text-green-300`}>
                                    <UploadIcon className="h-5 w-5" /><span>Importar Datos Admin</span>
                                </button>
                                <input
                                    type="file"
                                    ref={salespersonImportRef}
                                    onChange={handleImportSalespersonData}
                                    className="hidden"
                                    accept="application/json,.json"
                                />
                            </>
                        )}
                        <button onClick={() => setIsPasswordChangeModalOpen(true)} className={`${inactiveClassName} w-full`}>
                            <KeyIcon className="h-5 w-5" /><span>Cambiar Contraseña</span>
                        </button>
                        <button onClick={() => handleLogout()} className={`${inactiveClassName} w-full`}>
                            <LogoutIcon className="h-5 w-5" /><span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 p-2 sm:p-3 flex items-center justify-between flex-shrink-0">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 md:hidden" aria-label="Open menu">
                            <MenuIcon className="h-6 w-6 text-white"/>
                        </button>
                        
                        <div className="hidden md:flex items-center space-x-2 ml-2">
                            <span className="text-slate-400">Bienvenido,</span>
                            <span className="text-white font-semibold">{currentUser.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 md:hidden">
                            {/* This space is intentionally left for mobile layout balance, could add a logo here if needed */}
                        </div>

                        <div className="flex items-center space-x-3 pr-2">
                             <button
                                onClick={() => setIsGlobalSearchOpen(true)}
                                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                aria-label="Abrir Búsqueda Global"
                            >
                                <SearchIcon className="h-6 w-6" />
                            </button>

                            <ReactRouterDOM.Link
                                to="/agenda"
                                className="p-2 text-slate-400 hover:text-yellow-400 transition-colors relative"
                                aria-label="Ver Tareas Pendientes"
                            >
                                <BellIcon className="h-6 w-6" />
                                {pendingTasksCount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-slate-800">
                                        {pendingTasksCount}
                                    </span>
                                )}
                            </ReactRouterDOM.Link>
                        </div>

                    </header>
                    <main className="flex-1 overflow-y-auto">
                        <ReactRouterDOM.Routes>
                            <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/panel" />} />
                            <ReactRouterDOM.Route path="/panel" element={<Panel clientsCount={data.clients.length} leadsCount={data.leads.length} salespeopleCount={data.salespeople.length} productsCount={data.products.length} leads={data.leads} salespeople={data.salespeople} interactions={data.interactions} opportunities={data.opportunities} tasks={data.tasks} />}/>
                            <ReactRouterDOM.Route path="/clients" element={<Ventas clients={data.clients} addClient={addClient} updateClient={updateClient} deleteClient={deleteClient} opportunities={data.opportunities} salespeople={data.salespeople} interactions={data.interactions} addInteraction={addInteraction} updateInteraction={updateInteraction} deleteInteraction={deleteInteraction} currentUser={currentUser} />} />
                            <ReactRouterDOM.Route path="/listado" element={<Clientes user={currentUser} leads={data.leads} salespeople={data.salespeople} interactions={data.interactions} products={data.products} opportunities={data.opportunities} addLead={addLead} updateLead={updateLead} bulkUpdateLeads={bulkUpdateLeads} deleteLead={deleteLead} addInteraction={addInteraction} updateInteraction={updateInteraction} deleteInteraction={deleteInteraction} convertLeadToOpportunity={convertLeadToOpportunity} whatsappTemplates={data.whatsappTemplates} />} />
                            <ReactRouterDOM.Route path="/opportunities" element={<Prospectos user={currentUser} opportunities={data.opportunities} clients={data.clients} products={data.products} salespeople={data.salespeople} addOpportunity={addOpportunity} updateOpportunity={updateOpportunity} deleteOpportunity={deleteOpportunity} interactions={data.interactions} addInteraction={addInteraction} updateInteraction={updateInteraction} deleteInteraction={deleteInteraction} leads={data.leads} addTask={addTask} />} />
                            <ReactRouterDOM.Route path="/salespeople" element={<Salespeople salespeople={data.salespeople} leads={data.leads} tasks={data.tasks} addSalesperson={addSalesperson} updateSalesperson={updateSalesperson} deleteSalesperson={deleteSalesperson} />} />
                            <ReactRouterDOM.Route path="/products" element={<Products products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />} />
                            <ReactRouterDOM.Route path="/campaigns" element={<AiCampaigns products={data.products} />} />
                            <ReactRouterDOM.Route path="/agenda" element={<Agenda user={currentUser} tasks={data.tasks} clients={data.clients} leads={data.leads} opportunities={data.opportunities} salespeople={data.salespeople} addTask={addTask} updateTask={updateTask} deleteTask={deleteTask} />} />
                            <ReactRouterDOM.Route path="/whatsapp-prompts" element={<WhatsAppTemplates templates={data.whatsappTemplates} addTemplate={addWhatsAppTemplate} updateTemplate={updateWhatsAppTemplate} deleteTemplate={deleteWhatsAppTemplate} />} />
                            <ReactRouterDOM.Route path="/support" element={<Support tickets={data.supportTickets} clients={data.clients} addTicket={addTicket} updateTicket={updateTicket} deleteTicket={deleteTicket} />} />
                            <ReactRouterDOM.Route 
                                path="/management" 
                                element={
                                    <Management 
                                        onImport={handleMergeSalespersonData} 
                                        onFullRestore={handleFullBackupRestore} 
                                        onFullBackup={handleFullBackup}
                                        onResetData={handleResetData}
                                        onExportSalespersonBackup={handleExportSalespersonBackup}
                                        salespeople={data.salespeople}
                                    />} 
                                />
                        </ReactRouterDOM.Routes>
                    </main>
                </div>
            </div>
            <GlobalSearch
                isOpen={isGlobalSearchOpen}
                onClose={() => setIsGlobalSearchOpen(false)}
                clients={mainClients}
                leads={mainLeads}
                opportunities={mainOpportunities}
                tasks={mainTasks}
                products={mainProducts}
                supportTickets={mainSupportTickets}
                interactions={mainInteractions}
                salespeople={mainSalespeople}
            />
            {isPasswordChangeModalOpen && currentUser && (
                <UserPasswordChangeModal
                    isOpen={isPasswordChangeModalOpen}
                    onClose={() => setIsPasswordChangeModalOpen(false)}
                    user={currentUser}
                    onChangePassword={handleSelfPasswordChange}
                />
            )}
        </ReactRouterDOM.HashRouter>
    );
}

export default App;
