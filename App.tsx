
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { DUMMY_CLIENTS, DUMMY_LEADS, DUMMY_PRODUCTS, DUMMY_TASKS, DUMMY_SUPPORT_TICKETS, DUMMY_SALESPEOPLE, DUMMY_INTERACTIONS, DUMMY_OPPORTUNITIES, DUMMY_USERS, DUMMY_WHATSAPP_TEMPLATES } from './constants';
import type { Client, Lead, Product, Task, SupportTicket, Salesperson, Interaction, Opportunity, OpportunityProduct, User, BackupData, WhatsAppTemplate } from './types';
import { LeadStatus, OpportunityStage, TaskStatus } from './types';

import Panel from './components/Dashboard';
import Clients from './components/Clients';
import Listado from './components/Leads';
import Opportunities from './components/Sales';
import Salespeople from './components/Salespeople';
import Products from './components/Products';
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

const App: React.FC = () => {
    // Main data store (Single Source of Truth) - backed by localStorage
    const [mainClients, setMainClients] = useLocalStorage<Client[]>('crm_main_clients', DUMMY_CLIENTS);
    const [mainLeads, setMainLeads] = useLocalStorage<Lead[]>('crm_main_leads', DUMMY_LEADS);
    const [mainProducts, setMainProducts] = useLocalStorage<Product[]>('crm_main_products', DUMMY_PRODUCTS);
    const [mainOpportunities, setMainOpportunities] = useLocalStorage<Opportunity[]>('crm_main_opportunities', DUMMY_OPPORTUNITIES);
    const [mainTasks, setMainTasks] = useLocalStorage<Task[]>('crm_main_tasks', DUMMY_TASKS);
    const [mainSupportTickets, setMainSupportTickets] = useLocalStorage<SupportTicket[]>('crm_main_support_tickets', DUMMY_SUPPORT_TICKETS);
    const [mainSalespeople, setMainSalespeople] = useLocalStorage<Salesperson[]>('crm_main_salespeople', DUMMY_SALESPEOPLE);
    const [mainInteractions, setMainInteractions] = useLocalStorage<Interaction[]>('crm_main_interactions', DUMMY_INTERACTIONS);
    const [mainWhatsAppTemplates, setMainWhatsAppTemplates] = useLocalStorage<WhatsAppTemplate[]>('crm_main_whatsapp_templates', DUMMY_WHATSAPP_TEMPLATES);
    const [users, setUsers] = useLocalStorage<User[]>('crm_users', DUMMY_USERS);

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
            whatsappTemplates: mainWhatsAppTemplates,
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
        reader.onload = (e) => {
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
                
                // Directly set the main state, the local state will update via useEffect
                setMainClients(data.clients);
                setMainLeads(data.leads);
                setMainProducts(data.products);
                setMainOpportunities(data.opportunities);
                setMainTasks(data.tasks);
                setMainSupportTickets(data.supportTickets);
                setMainSalespeople(data.salespeople);
                setMainInteractions(data.interactions);
                setMainWhatsAppTemplates(data.whatsappTemplates || []);

                alert('Los datos del administrador han sido importados y actualizados correctamente.');

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
    
    const handleMergeSalespersonData = (data: BackupData) => {
        if (currentUser?.role !== 'admin') return;
        
        const merge = <T extends {id: string}>(mainData: T[], localData: T[]): T[] => {
            const mainDataMap = new Map(mainData.map(item => [item.id, item]));
            localData.forEach(item => {
                mainDataMap.set(item.id, item);
            });
            return Array.from(mainDataMap.values());
        };
        
        setMainClients(prev => merge(prev, data.clients));
        setMainLeads(prev => merge(prev, data.leads));
        setMainOpportunities(prev => merge(prev, data.opportunities));
        setMainTasks(prev => merge(prev, data.tasks));
        setMainInteractions(prev => merge(prev, data.interactions));
        
        alert("Los datos han sido fusionados con éxito.");
    };

    // --- Memoized CRUD Functions ---
    const addClient = useCallback((clientData: Omit<Client, 'id'>) => {
        const newClient: Client = { ...clientData, id: `cli-${Date.now()}`, createdAt: new Date().toISOString() };
        setMainClients(prev => [newClient, ...prev]);
        return newClient;
    }, []);

    const updateClient = useCallback((updatedClient: Client) => {
        setMainClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    }, []);
    
    const deleteClient = useCallback((clientId: string) => {
        const clientToDelete = mainClients.find(c => c.id === clientId);
        if (!clientToDelete) return;

        const clientNameToDeleteLower = clientToDelete.name.toLowerCase();

        const opportunitiesToDeleteIds = mainOpportunities
            .filter(o => o.clientId === clientId || o.clientName.toLowerCase() === clientNameToDeleteLower)
            .map(o => o.id);
        
        const leadsToDeleteIds = mainLeads
            .filter(l => l.company.toLowerCase() === clientNameToDeleteLower)
            .map(l => l.id);

        setMainClients(prev => prev.filter(c => c.id !== clientId));
        setMainOpportunities(prev => prev.filter(o => !opportunitiesToDeleteIds.includes(o.id)));
        setMainLeads(prev => prev.filter(l => !leadsToDeleteIds.includes(l.id)));
        setMainTasks(prev => prev.filter(t => t.clientId !== clientId && !opportunitiesToDeleteIds.includes(t.opportunityId || '')));
        setMainSupportTickets(prev => prev.filter(t => t.clientId !== clientId));
        setMainInteractions(prev => prev.filter(i => 
            !opportunitiesToDeleteIds.includes(i.opportunityId || '') &&
            !leadsToDeleteIds.includes(i.leadId || '')
        ));
    }, [mainClients, mainLeads, mainOpportunities]);

    const addLead = useCallback((leadData: Omit<Lead, 'id'>) => {
        const newLead: Lead = { ...leadData, id: `lead-${Date.now()}`, salespersonId: leadData.salespersonId || currentUser?.id || '', createdAt: new Date().toISOString() };
        setMainLeads(prev => [newLead, ...prev]);
    }, [currentUser]);

    const updateLead = useCallback((updatedLead: Lead) => {
        setMainLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    }, []);
    
    const deleteLead = useCallback((leadId: string) => {
        setMainLeads(prev => prev.filter(l => l.id !== leadId));
        setMainInteractions(prev => prev.filter(i => i.leadId !== leadId));
    }, []);

    const addProduct = useCallback((productData: Omit<Product, 'id'>) => {
        const newProduct: Product = { ...productData, id: `prod-${Date.now()}` };
        setMainProducts(prev => [newProduct, ...prev]);
    }, []);

    const updateProduct = useCallback((updatedProduct: Product) => {
        setMainProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, []);
    
    const deleteProduct = useCallback((productId: string) => {
        setMainProducts(prev => prev.filter(p => p.id !== productId));
        setMainOpportunities(prevOpps => 
            prevOpps.map(opp => {
                const productsBefore = opp.products.length;
                const updatedProducts = opp.products.filter(p => p.productId !== productId);
                if (updatedProducts.length < productsBefore) {
                    const newValue = updatedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
                    return { ...opp, products: updatedProducts, value: newValue };
                }
                return opp;
            })
        );
    }, []);
    
    const addOpportunity = useCallback((oppData: Omit<Opportunity, 'id' | 'clientName'>, explicitClientName?: string): Opportunity | null => {
        const clientName = explicitClientName || mainClients.find(c => c.id === oppData.clientId)?.name;
        if (!clientName) {
            console.error("Client name could not be determined for opportunity.");
            return null;
        };

        const opportunityId = `opp-${Date.now()}`;
        
        const newOpportunity: Opportunity = { 
            ...oppData, 
            id: opportunityId,
            clientName: clientName,
            salespersonId: oppData.salespersonId || currentUser?.id || '',
            createdAt: new Date().toISOString(),
        };
        setMainOpportunities(prev => [newOpportunity, ...prev]);
        
        const newOpportunityTask: Task = {
            id: `task-opp-${opportunityId}`,
            title: `Cierre Oportunidad: ${clientName}`,
            description: `Valor estimado: €${newOpportunity.value.toLocaleString('es-ES')}`,
            dueDate: newOpportunity.closeDate,
            salespersonId: newOpportunity.salespersonId,
            status: TaskStatus.PENDIENTE,
            opportunityId: newOpportunity.id,
            opportunityValue: newOpportunity.value,
            clientId: newOpportunity.clientId,
            associatedName: newOpportunity.clientName,
        };
        setMainTasks(prev => [newOpportunityTask, ...prev]);
        return newOpportunity;
    }, [currentUser, mainClients]);

    const updateOpportunity = useCallback((updatedOpportunity: Opportunity) => {
        let clientToUse: Client | undefined;
        let finalOppData = { ...updatedOpportunity };

        if (finalOppData.stage === OpportunityStage.GANADA && !finalOppData.clientId) {
            let existingClient = mainClients.find(c => c.name.toLowerCase() === finalOppData.clientName.toLowerCase());
            
            if (existingClient) {
                clientToUse = existingClient;
            } else {
                const originalLead = finalOppData.originalLeadId ? mainLeads.find(l => l.id === finalOppData.originalLeadId) : null;
                clientToUse = addClient({
                    name: finalOppData.clientName,
                    contactPerson: originalLead?.name || 'N/A',
                    email: originalLead?.email || 'N/A',
                    phone: originalLead?.phone || 'N/A',
                    address: '',
                });
            }
            
            if (clientToUse) {
                finalOppData.clientId = clientToUse.id;
                finalOppData.clientName = clientToUse.name;
            }
        } else if (finalOppData.clientId) {
            clientToUse = mainClients.find(c => c.id === finalOppData.clientId);
        }
        
        const clientNameForUpdate = clientToUse ? clientToUse.name : finalOppData.clientName;
        const fullyUpdatedOpp = { ...finalOppData, clientName: clientNameForUpdate };
        
        setMainOpportunities(prev => prev.map(o => o.id === fullyUpdatedOpp.id ? fullyUpdatedOpp : o));

        setMainTasks(prevTasks => {
            const taskIndex = prevTasks.findIndex(t => t.opportunityId === fullyUpdatedOpp.id);
            const taskData = {
                title: `Cierre Oportunidad: ${fullyUpdatedOpp.clientName}`,
                description: `Valor estimado: €${fullyUpdatedOpp.value.toLocaleString('es-ES')}`,
                dueDate: fullyUpdatedOpp.closeDate,
                salespersonId: fullyUpdatedOpp.salespersonId,
                clientId: fullyUpdatedOpp.clientId,
                associatedName: fullyUpdatedOpp.clientName,
                opportunityValue: fullyUpdatedOpp.value,
            };
            if (taskIndex > -1) {
                const newTasks = [...prevTasks];
                newTasks[taskIndex] = { ...newTasks[taskIndex], ...taskData };
                return newTasks;
            }
            const newOpportunityTask: Task = {
                id: `task-opp-${fullyUpdatedOpp.id}`,
                status: TaskStatus.PENDIENTE,
                opportunityId: fullyUpdatedOpp.id,
                ...taskData,
            };
            return [...prevTasks, newOpportunityTask];
        });
    }, [addClient, mainClients, mainLeads]);
    
    const deleteOpportunity = useCallback((opportunityId: string) => {
        setMainOpportunities(prev => prev.filter(o => o.id !== opportunityId));
        setMainTasks(prev => prev.filter(t => t.opportunityId !== opportunityId));
        setMainInteractions(prev => prev.filter(i => i.opportunityId !== opportunityId));
    }, []);

    const addInteraction = useCallback((interactionData: Omit<Interaction, 'id' | 'date'>) => {
        const now = new Date();
        const newInteraction: Interaction = { 
            ...interactionData, 
            id: `int-${now.getTime()}`,
            date: now.toISOString(),
            salespersonId: interactionData.salespersonId || currentUser?.id || '',
        };
        setMainInteractions(prev => [newInteraction, ...prev]);
        
        if (interactionData.leadId) {
            setMainLeads(prevLeads => prevLeads.map(lead => 
                lead.id === interactionData.leadId 
                    ? { ...lead, lastInteractionDate: now.toISOString().split('T')[0] } 
                    : lead
            ));
        }
    }, [currentUser]);
    
    const updateInteraction = useCallback((updatedInteraction: Interaction) => {
        setMainInteractions(prev => prev.map(i => i.id === updatedInteraction.id ? updatedInteraction : i));
    }, []);

    const deleteInteraction = useCallback((interactionId: string) => {
        setMainInteractions(prev => prev.filter(i => i.id !== interactionId));
    }, []);


    const addTask = useCallback((taskData: Omit<Task, 'id' | 'associatedName' | 'opportunityValue'>) => {
        const client = taskData.clientId ? mainClients.find(c => c.id === taskData.clientId) : undefined;
        const lead = taskData.leadId ? mainLeads.find(l => l.id === taskData.leadId) : undefined;
        const opportunity = taskData.opportunityId ? mainOpportunities.find(o => o.id === taskData.opportunityId) : undefined;
        const newTask: Task = {
            ...taskData,
            id: `task-${Date.now()}`,
            associatedName: opportunity?.clientName || client?.name || lead?.name,
            salespersonId: taskData.salespersonId || currentUser?.id || ''
        };
        setMainTasks(prev => [newTask, ...prev]);
    }, [currentUser, mainClients, mainLeads, mainOpportunities]);

    const updateTask = useCallback((updatedTask: Task) => {
        const client = updatedTask.clientId ? mainClients.find(c => c.id === updatedTask.clientId) : undefined;
        const lead = updatedTask.leadId ? mainLeads.find(l => l.id === updatedTask.leadId) : undefined;
        const opportunity = updatedTask.opportunityId ? mainOpportunities.find(o => o.id === updatedTask.opportunityId) : undefined;
        const fullyUpdatedTask = { ...updatedTask, associatedName: opportunity?.clientName || client?.name || lead?.name };
        setMainTasks(prev => prev.map(t => t.id === updatedTask.id ? fullyUpdatedTask : t));
    }, [mainClients, mainLeads, mainOpportunities]);

    const deleteTask = useCallback((taskId: string) => {
        setMainTasks(prev => prev.filter(t => t.id !== taskId));
    }, []);
    
    const addTicket = useCallback((ticketData: Omit<SupportTicket, 'id' | 'clientName' | 'createdDate'>) => {
        const client = mainClients.find(c => c.id === ticketData.clientId);
        if (!client) return;
        const newTicket: SupportTicket = { ...ticketData, id: `tic-${Date.now()}`, clientName: client.name, createdDate: new Date().toISOString().split('T')[0]};
        setMainSupportTickets(prev => [newTicket, ...prev]);
    }, [mainClients]);

    const updateTicket = useCallback((updatedTicket: SupportTicket) => {
         const client = mainClients.find(c => c.id === updatedTicket.clientId);
         if (!client) return;
         const fullyUpdatedTicket = { ...updatedTicket, clientName: client.name };
         setMainSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? fullyUpdatedTicket : t));
    }, [mainClients]);

    const deleteTicket = useCallback((ticketId: string) => {
        setMainSupportTickets(prev => prev.filter(t => t.id !== ticketId));
    }, []);

    const addSalesperson = useCallback((salespersonData: Omit<Salesperson, 'id'>, password_DO_NOT_USE: string) => {
        const newSalesperson: Salesperson = { ...salespersonData, id: `sales-${Date.now()}` };
        setMainSalespeople(prev => [newSalesperson, ...prev]);
        const newUser: User = { 
            ...newSalesperson, 
            role: 'salesperson', 
            password_DO_NOT_USE,
            mustChangePassword: true,
        };
        setUsers(prev => [...prev, newUser]);
    }, []);

    const updateSalesperson = useCallback((updatedSalesperson: Salesperson, password_DO_NOT_USE?: string) => {
        setMainSalespeople(prev => prev.map(sp => sp.id === updatedSalesperson.id ? updatedSalesperson : sp));
        setUsers(prev => prev.map(u => {
            if (u.id === updatedSalesperson.id) {
                const updatedUser: User = {
                    ...u,
                    ...updatedSalesperson,
                };
                if (password_DO_NOT_USE) {
                    updatedUser.password_DO_NOT_USE = password_DO_NOT_USE;
                    updatedUser.mustChangePassword = true;
                }
                return updatedUser;
            }
            return u;
        }));
    }, []);

    const deleteSalesperson = useCallback((salespersonId: string) => {
        setMainSalespeople(prev => prev.filter(sp => sp.id !== salespersonId));
        setUsers(prev => prev.filter(u => u.id !== salespersonId));
    
        const adminId = 'ADM';
        setMainLeads(prev => prev.map(l => l.salespersonId === salespersonId ? { ...l, salespersonId: adminId } : l));
        setMainTasks(prev => prev.map(t => t.salespersonId === salespersonId ? { ...t, salespersonId: adminId } : t));
        setMainOpportunities(prev => prev.map(o => o.salespersonId === salespersonId ? { ...o, salespersonId: adminId } : o));
        setMainInteractions(prev => prev.map(i => i.salespersonId === salespersonId ? { ...i, salespersonId: adminId } : i));
    }, []);

    const addWhatsAppTemplate = useCallback((templateData: Omit<WhatsAppTemplate, 'id'>) => {
        const newTemplate: WhatsAppTemplate = { ...templateData, id: `tmpl-${Date.now()}` };
        setMainWhatsAppTemplates(prev => [newTemplate, ...prev]);
    }, []);

    const updateWhatsAppTemplate = useCallback((updatedTemplate: WhatsAppTemplate) => {
        setMainWhatsAppTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    }, []);

    const deleteWhatsAppTemplate = useCallback((templateId: string) => {
        setMainWhatsAppTemplates(prev => prev.filter(t => t.id !== templateId));
    }, []);

    const convertLeadToOpportunity = useCallback((
        leadId: string, 
        opportunityData: { products: OpportunityProduct[], closeDate: string, stage: OpportunityStage, salespersonId: string }
    ): Opportunity | null => {
        const lead = mainLeads.find(l => l.id === leadId);
        if (!lead) return null;
        
        const value = opportunityData.products.reduce((sum, p) => sum + p.price * p.quantity, 0);

        const newOpp = addOpportunity({
            products: opportunityData.products,
            closeDate: opportunityData.closeDate,
            salespersonId: opportunityData.salespersonId,
            stage: opportunityData.stage,
            value: value,
            originalLeadId: leadId,
        }, lead.company);

        if (newOpp) {
            updateLead({ ...lead, status: LeadStatus.CALIFICADO });
        }
        
        return newOpp;
    }, [addOpportunity, updateLead, mainLeads]);
    
    const navLinkClasses = "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors";
    const activeClassName = `${navLinkClasses} bg-slate-700 text-white`;
    const inactiveClassName = `${navLinkClasses} text-slate-400 hover:bg-slate-700/50 hover:text-white`;

    const navItems = [
        { path: "/panel", icon: <ChartBarIcon className="h-5 w-5" />, label: "Panel" },
        { path: "/listado", icon: <TagIcon className="h-5 w-5" />, label: "Listado" },
        { path: "/opportunities", icon: <BriefcaseIcon className="h-5 w-5" />, label: "Oportunidades" },
        { path: "/clients", icon: <UserGroupIcon className="h-5 w-5" />, label: "Clientes" },
        { path: "/salespeople", icon: <UserIcon className="h-5 w-5" />, label: "Vendedores", adminOnly: true },
        { path: "/products", icon: <CubeIcon className="h-5 w-5" />, label: "Productos" },
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

                    </header>
                    <main className="flex-1 overflow-y-auto">
                        <ReactRouterDOM.Routes>
                            <ReactRouterDOM.Route path="/" element={<ReactRouterDOM.Navigate to="/panel" />} />
                            <ReactRouterDOM.Route path="/panel" element={<Panel clientsCount={data.clients.length} leadsCount={data.leads.length} salespeopleCount={data.salespeople.length} productsCount={data.products.length} leads={data.leads} salespeople={data.salespeople} interactions={data.interactions} opportunities={data.opportunities} />}/>
                            <ReactRouterDOM.Route path="/clients" element={<Clients clients={data.clients} updateClient={updateClient} deleteClient={deleteClient} opportunities={data.opportunities} salespeople={data.salespeople} />} />
                            <ReactRouterDOM.Route path="/listado" element={<Listado user={currentUser} leads={data.leads} salespeople={data.salespeople} interactions={data.interactions} products={data.products} opportunities={data.opportunities} addLead={addLead} updateLead={updateLead} deleteLead={deleteLead} addInteraction={addInteraction} updateInteraction={updateInteraction} deleteInteraction={deleteInteraction} convertLeadToOpportunity={convertLeadToOpportunity} whatsappTemplates={data.whatsappTemplates} />} />
                            <ReactRouterDOM.Route path="/opportunities" element={<Opportunities user={currentUser} opportunities={data.opportunities} clients={data.clients} products={data.products} salespeople={data.salespeople} addOpportunity={addOpportunity} updateOpportunity={updateOpportunity} deleteOpportunity={deleteOpportunity} interactions={data.interactions} addInteraction={addInteraction} updateInteraction={updateInteraction} deleteInteraction={deleteInteraction} leads={data.leads} />} />
                            <ReactRouterDOM.Route path="/salespeople" element={<Salespeople salespeople={data.salespeople} leads={data.leads} tasks={data.tasks} addSalesperson={addSalesperson} updateSalesperson={updateSalesperson} deleteSalesperson={deleteSalesperson} />} />
                            <ReactRouterDOM.Route path="/products" element={<Products products={data.products} addProduct={addProduct} updateProduct={updateProduct} deleteProduct={deleteProduct} />} />
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
             <button
                onClick={() => setIsGlobalSearchOpen(true)}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-cyan-500 hover:bg-cyan-600 text-white w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg flex items-center justify-center transform transition-transform hover:scale-110 z-50"
                aria-label="Abrir Búsqueda Global"
            >
                <SearchIcon className="h-7 w-7 sm:h-8 sm:h-8" />
            </button>
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
