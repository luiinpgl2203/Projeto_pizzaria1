
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Orders from './components/Orders';
import Menu from './components/Menu';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import Clientes from './components/Clientes';
import Fiscal from './components/Fiscal';
import Settings from './components/Settings';
import Whatsapp from './components/Whatsapp';
import Toast from './components/Toast';
import DeliveryMap from './components/DeliveryMap';
import Caixa from './components/Caixa';
import Logistics from './components/Logistics';
import LoginScreen from './components/LoginScreen';
import KDS from './components/KDS';
import Costs from './components/Costs';
import Funcionarios from './components/Funcionarios';
import MotoboyDashboard from './components/MotoboyDashboard';
import CostAnalysisConfirmationModal from './components/CostAnalysisConfirmationModal';

import { MOCK_ORDERS, MOCK_INGREDIENTS, MOCK_PRODUCTS, MOCK_FISCAL_DOCS, MOCK_MOTOBOYS, MOCK_APP_USERS, MOCK_RECIPES, MOCK_FIXED_COSTS, MOCK_CLIENTS, MOCK_ADDONS, MOCK_ADDON_RECIPES } from './constants';
import { Order, Ingredient, Product, FiscalDocument, InvalidationRecord, NewOrderData, Motoboy, User, FixedCost, Recipe, AddonRecipe, Supplier, StockMovement, RecipePart, PizzeriaInfo, SystemRole, CashRegisterClosing, PaymentMethod, OrderItem, AnalysisResult, ConfirmedUpdate, Client, Addon } from './types';
import { fiscalApiService } from './services/fiscalApiService';
import { analyzeMenuImage, analyzeInvoices } from './services/geminiService';

// Firebase Imports
import { auth, db, handleFirestoreError } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  getDocs, 
  writeBatch,
  query,
  updateDoc,
  deleteDoc,
  deleteField
} from 'firebase/firestore';


export type Page = 'Dashboard' | 'Pedidos' | 'Cozinha' | 'Mapa de Entregas' | 'Logística' | 'Atendimento' | 'Cardápio' | 'Estoque' | 'Custos' | 'Fornecedores' | 'Clientes' | 'Funcionários' | 'Fiscal' | 'Caixa' | 'Configurações';

const App: React.FC = () => {
  // App-wide State
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>(MOCK_ADDONS);
  const [fiscalDocuments, setFiscalDocuments] = useState<FiscalDocument[]>(MOCK_FISCAL_DOCS);
  const [invalidationRecords, setInvalidationRecords] = useState<InvalidationRecord[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>(MOCK_MOTOBOYS);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  // FIX: Corrected typo in MOCK_FIXED_COSTS constant name.
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(MOCK_FIXED_COSTS);
  const [recipes, setRecipes] = useState<Recipe>({});
  const [addonRecipes, setAddonRecipes] = useState<AddonRecipe>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [cashRegisterClosings, setCashRegisterClosings] = useState<CashRegisterClosing[]>([]);
  const [pizzeriaInfo, setPizzeriaInfo] = useState<PizzeriaInfo>({ name: 'Pizzaria Funchal' });
  const [fiscalEnvironment, setFiscalEnvironment] = useState<'Homologação' | 'Produção'>('Homologação');
  const [chatbotUpsellEnabled, setChatbotUpsellEnabled] = useState(true);
  const [chatbotCouponEnabled, setChatbotCouponEnabled] = useState(false);

  // Authentication and UI State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
        const saved = localStorage.getItem('funchal_session');
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
  });
  const [users, setUsers] = useState<User[]>(MOCK_APP_USERS);
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // Analysis State
  const [isCostConfirmationModalOpen, setIsCostConfirmationModalOpen] = useState(false);
  const [costAnalysisResult, setCostAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisState, setAnalysisState] = useState({
      menu: { isAnalyzing: false, message: '' },
      costs: { isAnalyzing: false, message: '' }
  });

  // --- FIREBASE SYNC & MULTI-TENANCY ---
  // A arquitetura é multi-tenant: cada pizzaria tem seus dados isolados em subcoleções.
  // O mapeamento Usuário -> Pizzaria é feito no documento /users/{uid}.

  // Escuta mudanças no estado de autenticação (Firebase Auth)
  useEffect(() => {
    // Timeout de segurança para evitar tela de loading infinita
    const safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Busca o perfil do usuário no Firestore para obter o pizzeriaId
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
              const userData = userSnap.data() as User;
              setCurrentUser(userData);
              localStorage.setItem('funchal_session', JSON.stringify(userData));
          } else {
              // Verificação de fallback (se o usuário for anônimo mas tivermos dados no localStorage)
              const saved = localStorage.getItem('funchal_session');
              if (saved) {
                  const userData = JSON.parse(saved) as User;
                  setCurrentUser(userData);
                  // Tenta vincular o perfil ao novo UID se necessário
                  await setDoc(userRef, userData);
              }
          }
        } else {
          setCurrentUser(null);
          localStorage.removeItem('funchal_session');
        }
      } catch (error) {
        console.error("Erro na inicialização da autenticação:", error);
      } finally {
        setIsInitializing(false);
        clearTimeout(safetyTimer);
      }
    });
    return () => {
        unsubscribe();
        clearTimeout(safetyTimer);
    };
  }, []);

  // Sincronização em tempo real (Real-time Sync) do Firestore
  // Os dados são filtrados pelo pizzeriaId do usuário logado.
  useEffect(() => {
    if (!currentUser || !currentUser.pizzeriaId) return;

    const pid = currentUser.pizzeriaId;

    // Sincroniza Ingredientes
    const unsubIngredients = onSnapshot(collection(db, 'pizzerias', pid, 'ingredients'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Ingredient);
      if (data.length > 0) setIngredients(data);
    });

    // Sincroniza Produtos
    const unsubProducts = onSnapshot(collection(db, 'pizzerias', pid, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Product);
      if (data.length > 0) setProducts(data);
    });

    // Sincroniza Receitas
    const unsubRecipes = onSnapshot(collection(db, 'pizzerias', pid, 'recipes'), (snapshot) => {
      const newRecipes: Recipe = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        newRecipes[parseInt(doc.id)] = data.parts;
      });
      if (Object.keys(newRecipes).length > 0) setRecipes(newRecipes);
    });

    const unsubAddonRecipes = onSnapshot(collection(db, 'pizzerias', pid, 'addon_recipes'), (snapshot) => {
      const newAddonRecipes: AddonRecipe = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        newAddonRecipes[parseInt(doc.id)] = data.parts;
      });
      setAddonRecipes(newAddonRecipes);
    });

    const unsubPizzeriaInfo = onSnapshot(doc(db, 'pizzerias', pid), (snapshot) => {
      if (snapshot.exists()) {
        setPizzeriaInfo(snapshot.data() as PizzeriaInfo);
      }
    });

    const unsubSuppliers = onSnapshot(collection(db, 'pizzerias', pid, 'suppliers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(data);
    });

    const unsubMovements = onSnapshot(query(collection(db, 'pizzerias', pid, 'stock_movements')), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as StockMovement);
      // Ordenar por data decrescente
      setStockMovements(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    // Sincroniza Pedidos
    const unsubOrders = onSnapshot(collection(db, 'pizzerias', pid, 'orders'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      if (data.length > 0) setOrders(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // Sincroniza Funcionários
    const unsubUsers = onSnapshot(collection(db, 'pizzerias', pid, 'employees'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as User);
      if (data.length > 0) setUsers(data);
    });

    // Sincroniza Custos Fixos
    const unsubFixedCosts = onSnapshot(collection(db, 'pizzerias', pid, 'fixed_costs'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as FixedCost);
      setFixedCosts(data);
    });

    // Sincroniza Fechamentos de Caixa
    const unsubCashClosings = onSnapshot(collection(db, 'pizzerias', pid, 'cash_closings'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as CashRegisterClosing);
      setCashRegisterClosings(data.sort((a, b) => new Date(b.closingTime).getTime() - new Date(a.closingTime).getTime()));
    });

    // Sincroniza Clientes
    const unsubClients = onSnapshot(collection(db, 'pizzerias', pid, 'clients'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as Client));
      setClients(data);
    });

    return () => {
      unsubIngredients();
      unsubProducts();
      unsubRecipes();
      unsubAddonRecipes();
      unsubPizzeriaInfo();
      unsubSuppliers();
      unsubMovements();
      unsubOrders();
      unsubUsers();
      unsubFixedCosts();
      unsubCashClosings();
      unsubClients();
    };
  }, [currentUser]);

  // Seeding: Povoa o banco de dados da pizzaria se estiver vazio.
  useEffect(() => {
      const seedDatabase = async () => {
          if (!currentUser || !currentUser.pizzeriaId) return;
          const pid = currentUser.pizzeriaId;
          
          const ingredientsSnap = await getDocs(collection(db, 'pizzerias', pid, 'ingredients'));
          if (ingredientsSnap.empty) {
              console.log("Iniciando Seed do Banco de Dados para a Pizzaria...");
              const batch = writeBatch(db);
              
              MOCK_INGREDIENTS.forEach(ing => {
                  const ref = doc(db, 'pizzerias', pid, 'ingredients', ing.id.toString());
                  batch.set(ref, { ...ing, pizzeriaId: pid });
              });

              MOCK_PRODUCTS.forEach(prod => {
                  const ref = doc(db, 'pizzerias', pid, 'products', prod.id.toString());
                  batch.set(ref, { ...prod, pizzeriaId: pid });
              });

              MOCK_APP_USERS.forEach(user => {
                  const ref = doc(db, 'pizzerias', pid, 'employees', user.id.toString());
                  batch.set(ref, { ...user, pizzeriaId: pid });
              });

              MOCK_ORDERS.forEach(order => {
                  const ref = doc(db, 'pizzerias', pid, 'orders', order.id);
                  batch.set(ref, { ...order, pizzeriaId: pid });
              });

              MOCK_FIXED_COSTS.forEach(cost => {
                  const ref = doc(db, 'pizzerias', pid, 'fixed_costs', cost.id.toString());
                  batch.set(ref, { ...cost, pizzeriaId: pid });
              });

              MOCK_CLIENTS.forEach(client => {
                  const ref = doc(db, 'pizzerias', pid, 'clients', client.id.toString());
                  batch.set(ref, { ...client, pizzeriaId: pid });
              });

              Object.entries(MOCK_RECIPES).forEach(([prodId, parts]) => {
                  const ref = doc(db, 'pizzerias', pid, 'recipes', prodId);
                  batch.set(ref, { productId: parseInt(prodId), parts, pizzeriaId: pid });
              });

              await batch.commit();
              console.log("Banco de Dados Populado!");
          }
      };
      seedDatabase();
  }, [currentUser]);

  // --- HANDLERS ---

  const showToast = (message: string, type: 'success' | 'error' | 'warning', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  };

  const handleLogin = async (usernameInput: string, passwordInput: string): Promise<boolean> => {
    const uName = usernameInput.trim();
    const uPass = passwordInput.trim();

    if (!uName || !uPass) {
        showToast('Preencha usuário e senha.', 'warning');
        return false;
    }

    try {
        // --- CASO 1: ADMIN HARDCODED (admin/123) ---
        if (uName.toLowerCase() === 'admin' && uPass === '123') {
            const { signInAnonymously } = await import('firebase/auth');
            const result = await signInAnonymously(auth);
            
            const adminProfile: User = {
                id: 1,
                name: 'Administrador Funchal',
                username: 'admin',
                role: 'Admin',
                employmentStatus: 'Ativo',
                pizzeriaId: 'funchal-database'
            };
            
            await setDoc(doc(db, 'users', result.user.uid), adminProfile);

            setCurrentUser(adminProfile);
            localStorage.setItem('funchal_session', JSON.stringify(adminProfile));
            showToast('Bem-vindo, Administrador!', 'success');
            return true;
        }

        // --- CASO 2: BUSCAR NOS FUNCIONÁRIOS DA PIZZARIA ---
        const pid = 'funchal-database'; // Hardcoded for this tenant
        const employeesRef = collection(db, 'pizzerias', pid, 'employees');
        const empSnap = await getDocs(employeesRef);
        
        const dbUserMatch = empSnap.docs.find(d => {
            const data = d.data();
            return data.username === uName && data.password === uPass;
        });

        if (dbUserMatch) {
            const { signInAnonymously } = await import('firebase/auth');
            const result = await signInAnonymously(auth);
            
            const profileData = dbUserMatch.data() as User;
            await setDoc(doc(db, 'users', result.user.uid), profileData);
            
            setCurrentUser(profileData);
            localStorage.setItem('funchal_session', JSON.stringify(profileData));
            showToast(`Bem-vindo, ${profileData.name}!`, 'success');
            return true;
        }

        showToast('Usuário ou senha inválidos.', 'error');
        return false;
    } catch (err: any) {
        console.error("Login Error Catch:", err);
        showToast(`Erro ao realizar login: ${err.message}`, 'error');
        return false;
    }
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        setCurrentUser(null);
        localStorage.removeItem('funchal_session');
        showToast('Até logo!', 'warning');
    } catch (e) {
        setCurrentUser(null);
        localStorage.removeItem('funchal_session');
    }
  };
  
  // --- STOCK UTILITIES & HISTORY ---

  const logStockMovement = async (
    movement: Omit<StockMovement, 'id' | 'timestamp' | 'pizzeriaId' | 'userName'>
  ) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    const movementId = Math.random().toString(36).substring(7);
    const fullMovement: StockMovement = {
      ...movement,
      id: movementId,
      timestamp: new Date().toISOString(),
      pizzeriaId: pid,
      userName: currentUser.name
    };

    try {
      await setDoc(doc(db, 'pizzerias', pid, 'stock_movements', movementId), fullMovement);
    } catch (error) {
      console.error("Erro ao registrar movimentação de estoque:", error);
    }
  };

  const convertToBaseUnit = (quantity: number, unit: 'g' | 'ml' | 'un' | 'kg' | 'L', baseUnit: 'kg' | 'g' | 'L' | 'ml' | 'un'): number => {
    if (unit === baseUnit) return quantity;
    if (unit === 'g' && baseUnit === 'kg') return quantity / 1000;
    if (unit === 'kg' && baseUnit === 'g') return quantity * 1000;
    if (unit === 'ml' && baseUnit === 'L') return quantity / 1000;
    if (unit === 'L' && baseUnit === 'ml') return quantity * 1000;
    // Simplification: 1L of sauce ~ 1kg
    if (unit === 'g' && baseUnit === 'L') return quantity / 1000;
    if (unit === 'ml' && baseUnit === 'kg') return quantity / 1000;

    console.warn(`Conversão de unidade não suportada: de ${unit} para ${baseUnit}`);
    return quantity;
  };


  const handleCreateOrder = async (orderData: NewOrderData) => {
    const { customerName, items, paymentMethod, observation, orderType, address, postalCode, tableNumber, changeFor } = orderData;

    if (!currentUser?.pizzeriaId) {
        showToast('Erro: Usuário não autenticado em uma pizzaria.', 'error');
        return;
    }
    const pid = currentUser.pizzeriaId;

    if ((orderType !== 'Mesa' && !customerName) || items.length === 0) {
      showToast('Cliente e pelo menos um item são necessários.', 'error');
      return;
    }
    if (orderType === 'Mesa' && !tableNumber) {
        showToast('Número da mesa/comanda é obrigatório.', 'error');
        return;
    }

    // --- STOCK DEDUCTION LOGIC ---
    const deductStockForItems = async (itemsToDeduct: OrderItem[], orderId: string) => {
      const requiredIngredients: Map<number, { name: string; required: number }> = new Map();
      for (const item of itemsToDeduct) {
        // Product ingredients
        const recipe = recipes[item.productId];
        if (recipe) {
          for (const recipeIngredient of recipe) {
            const ingredientInfo = ingredients.find(i => i.id === recipeIngredient.ingredientId);
            if (ingredientInfo) {
                // Consideration of yieldFactor: quantityRequired / yieldFactor
                const yieldFactor = recipeIngredient.yieldFactor || ingredientInfo.yieldFactor || 1;
                const netQuantity = convertToBaseUnit(recipeIngredient.quantity, recipeIngredient.unit, ingredientInfo.unit) * item.quantity;
                const grossQuantity = netQuantity / yieldFactor;

                const existing = requiredIngredients.get(recipeIngredient.ingredientId);
                if (existing) {
                    existing.required += grossQuantity;
                } else {
                    requiredIngredients.set(recipeIngredient.ingredientId, { name: ingredientInfo.name, required: grossQuantity });
                }
            }
          }
        }
        // Addon ingredients
        if (item.addons) {
            for (const addon of item.addons) {
                const addonRecipe = addonRecipes[addon.id];
                if (addonRecipe) {
                    for (const recipeIngredient of addonRecipe) {
                        const ingredientInfo = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                        if (ingredientInfo) {
                            const yieldFactor = recipeIngredient.yieldFactor || ingredientInfo.yieldFactor || 1;
                            const netQuantity = convertToBaseUnit(recipeIngredient.quantity, recipeIngredient.unit, ingredientInfo.unit) * item.quantity;
                            const grossQuantity = netQuantity / yieldFactor;

                            const existing = requiredIngredients.get(recipeIngredient.ingredientId);
                            if (existing) {
                                existing.required += grossQuantity;
                            } else {
                                requiredIngredients.set(recipeIngredient.ingredientId, { name: ingredientInfo.name, required: grossQuantity });
                            }
                        }
                    }
                }
            }
        }
      }

      const lowStockWarnings: string[] = [];
      const batch = writeBatch(db);

      for (const [id, { name, required }] of requiredIngredients.entries()) {
        const stockIngredient = ingredients.find(i => i.id === id);
        if (stockIngredient) {
            const newStock = stockIngredient.stock - required;
            const ingRef = doc(db, 'pizzerias', pid, 'ingredients', id.toString());
            batch.update(ingRef, { stock: newStock });

            // Log history
            const movementId = Math.random().toString(36).substring(7);
            const moveRef = doc(db, 'pizzerias', pid, 'stock_movements', movementId);
            batch.set(moveRef, {
                id: movementId,
                ingredientId: id,
                ingredientName: name,
                type: 'Saída',
                quantity: required,
                unit: stockIngredient.unit,
                reason: `Pedido #${orderId}`,
                userName: currentUser.name,
                timestamp: new Date().toISOString(),
                pizzeriaId: pid
            });

            if (newStock <= stockIngredient.minStock) {
                lowStockWarnings.push(name + (newStock <= 0 ? " (esgotado)" : ""));
            }
        }
      }

      try {
          await batch.commit();
      } catch (error) {
          console.error("Erro ao abater estoque no Firebase:", error);
          showToast("Erro ao sincronizar estoque. Algumas quantidades podem estar desatualizadas.", "error");
      }

      return lowStockWarnings;
    };

    const nextOrderId = (Math.max(...orders.map(o => parseInt(o.id)), 0) + 1).toString();

    // --- ORDER HANDLING LOGIC ---
    if (orderType === 'Mesa' && tableNumber) {
        const existingOrder = orders.find(o => o.tableNumber === tableNumber && o.status !== 'Concluído' && o.status !== 'Cancelado');
        if (existingOrder) {
            // Add items to existing order
            const updatedItems = [...existingOrder.items];
            items.forEach(newItem => {
                const existingItem = updatedItems.find(i => i.productId === newItem.productId && JSON.stringify(i.addons || []) === JSON.stringify(newItem.addons || []));
                if (existingItem) {
                    existingItem.quantity += newItem.quantity;
                } else {
                    updatedItems.push(newItem);
                }
            });

            const newTotal = updatedItems.reduce((acc, item) => {
                const itemPrice = item.price;
                const addonsPrice = (item.addons || []).reduce((a, addon) => a + addon.price, 0);
                return acc + (itemPrice + addonsPrice) * item.quantity;
            }, 0);

            const lowStockWarnings = await deductStockForItems(items, existingOrder.id); // Deduct stock for new items only

            await updateDoc(doc(db, 'pizzerias', pid, 'orders', existingOrder.id), {
                items: updatedItems,
                total: newTotal,
                observation: observation || existingOrder.observation
            });
            
            if (lowStockWarnings.length > 0) {
                showToast(`Itens adicionados. Estoque baixo para: ${lowStockWarnings.join(', ')}.`, 'warning', 6000);
            } else {
                showToast(`Itens adicionados à Mesa ${tableNumber}.`, 'success');
            }
            return;
        }
    }

    // Create a new order if it's not an existing table order
    const lowStockWarnings = await deductStockForItems(items, nextOrderId);

    const newOrder: Order = {
        id: nextOrderId,
        customerName: orderType === 'Mesa' && tableNumber ? `Mesa ${tableNumber}` : customerName,
        date: new Date().toISOString(),
        total: items.reduce((acc, item) => {
            const itemPrice = item.price;
            const addonsPrice = (item.addons || []).reduce((a, addon) => a + addon.price, 0);
            return acc + (itemPrice + addonsPrice) * item.quantity;
        }, 0),
        status: 'Pendente',
        paymentMethod: orderType === 'Mesa' ? undefined : paymentMethod,
        items: items,
        orderType,
        source: 'Manual',
        address,
        postalCode,
        tableNumber,
        coordinates: orderType === 'Entrega' ? { lat: -23.5505 + (Math.random() - 0.5) * 0.15, lng: -46.6333 + (Math.random() - 0.5) * 0.15 } : undefined,
        observation,
        changeFor,
    };
    
    await setDoc(doc(db, 'pizzerias', pid, 'orders', newOrder.id), newOrder);
    // setOrders(prevOrders => [newOrder, ...prevOrders]); // Removing local state update since onSnapshot will handle it

    if (lowStockWarnings.length > 0) {
        showToast(`Pedido criado. Atenção, estoque baixo para: ${lowStockWarnings.join(', ')}.`, 'warning', 6000);
    } else {
        showToast(`Pedido #${newOrder.id} criado e enviado para a cozinha!`, 'success');
    }
  };
  
  const handleUpdatePizzeriaInfo = async (info: Partial<PizzeriaInfo>) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
      await setDoc(doc(db, 'pizzerias', pid), { ...pizzeriaInfo, ...info }, { merge: true });
      showToast('Informações da pizzaria atualizadas.', 'success');
    } catch (error) {
      handleFirestoreError(error, 'update', `pizzerias/${pid}`);
    }
  };

  const handleUpdateAddon = async (addonId: number, updatedData: Partial<Addon>) => {
    setAddons(prev => prev.map(a => a.id === addonId ? { ...a, ...updatedData } : a));
  };

  const handleUpdateAddonRecipe = async (addonId: number, parts: RecipePart[]) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
      await setDoc(doc(db, 'pizzerias', pid, 'addon_recipes', addonId.toString()), { parts });
      showToast('Ficha técnica do adicional atualizada.', 'success');
    } catch (error) {
      handleFirestoreError(error, 'update', `pizzerias/${pid}/addon_recipes/${addonId}`);
    }
  };
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    
    try {
        await updateDoc(doc(db, 'pizzerias', pid, 'orders', orderId), { status: newStatus });
        
        if (newStatus === 'Saiu para Entrega') {
            const order = orders.find(o => o.id === orderId);
            if(order) {
                showToast(`Mensagem de 'Saiu para Entrega' enviada para ${order.customerName} via WhatsApp.`, 'success');
            }
        } else if (newStatus === 'Pronto para Entrega') {
            showToast(`Pedido #${orderId} movido para a fila de despacho.`, 'success');
            if (currentUser?.role === 'Admin') {
                setCurrentPage('Logística');
            }
        } else {
            showToast(`Status do pedido #${orderId} atualizado para "${newStatus}".`, 'success');
        }
    } catch (error) {
        handleFirestoreError(error, 'update', `pizzerias/${pid}/orders/${orderId}`);
    }
  };

  const handleCloseTableOrder = async (orderId: string, paymentMethod: PaymentMethod, changeFor?: number) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
        await updateDoc(doc(db, 'pizzerias', pid, 'orders', orderId), { 
            status: 'Concluído', 
            paymentMethod, 
            changeFor 
        });
        showToast(`Conta da comanda #${orderId} fechada com sucesso.`, 'success');
    } catch (err) {
        handleFirestoreError(err, 'update', `pizzerias/${pid}/orders/${orderId}`);
    }
  };

  const handleCancelOrderItem = (orderId: string, itemIndex: number) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || !orderToUpdate.items[itemIndex]) return;

    const itemToCancel = orderToUpdate.items[itemIndex];

    const updatedItems = [...orderToUpdate.items];
    if (updatedItems[itemIndex].quantity > 1) {
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], quantity: updatedItems[itemIndex].quantity - 1 };
    } else {
        updatedItems.splice(itemIndex, 1);
    }

    // Recalculate total
    const newTotal = updatedItems.reduce((acc, item) => {
        const itemPrice = item.price;
        const addonsPrice = (item.addons || []).reduce((a, addon) => a + addon.price, 0);
        return acc + (itemPrice + addonsPrice) * item.quantity;
    }, 0);


    // Update orders state
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, items: updatedItems, total: newTotal } : o));
    
    // Add stock back
    const ingredientsToReturn: Map<number, number> = new Map();
    // 1. Return product ingredients
    const recipe = recipes[itemToCancel.productId];
    if (recipe) {
      for (const recipeIngredient of recipe) {
        const ingredientInfo = ingredients.find(i => i.id === recipeIngredient.ingredientId);
        if (ingredientInfo) {
          const quantityInBaseUnit = convertToBaseUnit(recipeIngredient.quantity, recipeIngredient.unit, ingredientInfo.unit) * 1; // 1 because we cancel one by one
          ingredientsToReturn.set(recipeIngredient.ingredientId, (ingredientsToReturn.get(recipeIngredient.ingredientId) || 0) + quantityInBaseUnit);
        }
      }
    }

    // 2. Return addon ingredients
    if (itemToCancel.addons) {
        for (const addon of itemToCancel.addons) {
            const addonRecipe = MOCK_ADDON_RECIPES[addon.id];
            if (addonRecipe) {
                for (const recipeIngredient of addonRecipe) {
                    const ingredientInfo = ingredients.find(i => i.id === recipeIngredient.ingredientId);
                    if (ingredientInfo) {
                        const quantityInBaseUnit = convertToBaseUnit(recipeIngredient.quantity, recipeIngredient.unit, ingredientInfo.unit) * 1;
                        ingredientsToReturn.set(recipeIngredient.ingredientId, (ingredientsToReturn.get(recipeIngredient.ingredientId) || 0) + quantityInBaseUnit);
                    }
                }
            }
        }
    }

    setIngredients(prevIngs => prevIngs.map(ing => {
        if (ingredientsToReturn.has(ing.id)) {
            return { ...ing, stock: ing.stock + ingredientsToReturn.get(ing.id)! };
        }
        return ing;
    }));
    
    showToast(`Item "${itemToCancel.name}" removido do pedido #${orderId}.`, 'warning');
  };


  const handleEmitFiscalDocument = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        showToast('Pedido não encontrado.', 'error');
        return;
    }

    const docId = (Math.floor(Math.random() * 900000) + 100000).toString();
    const newDoc: FiscalDocument = {
        id: docId,
        orderId: order.id,
        type: 'NFC-e',
        date: new Date().toISOString(),
        value: order.total,
        customer: order.customerName,
        status: 'Processando',
        environment: fiscalEnvironment,
    };

    setFiscalDocuments(prev => [newDoc, ...prev]);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, fiscalDocumentId: docId } : o));
    showToast(`Enviando NFC-e ${docId} para autorização...`, 'warning');
    if (currentUser?.role === 'Admin') setCurrentPage('Fiscal');
    
    try {
        const result = await fiscalApiService.emitirNFCe(order, docId, fiscalEnvironment);
        setFiscalDocuments(prev => prev.map(d => d.id === docId ? { ...d, ...result } : d));
        showToast(`NFC-e ${docId} autorizada com sucesso!`, 'success');
    } catch (error: any) {
        setFiscalDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Rejeitado', rejectionReason: error.message } : d));
        showToast(`Falha ao emitir NFC-e: ${error.message}`, 'error', 6000);
    }
  };
  
  const handleCancelFiscalDocument = async (docId: string) => {
    const doc = fiscalDocuments.find(d => d.id === docId);
    if (!doc || doc.status !== 'Autorizado') {
        showToast('Apenas documentos autorizados podem ser cancelados.', 'error');
        return;
    }
    
    setFiscalDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Cancelando' } : d));
    showToast(`Solicitando cancelamento da NFC-e ${docId}...`, 'warning');

    try {
        const result = await fiscalApiService.cancelarNFCe(doc);
        setFiscalDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Cancelado', ...result } : d));
        showToast(`NFC-e ${docId} cancelada com sucesso.`, 'success');
    } catch (error: any) {
         setFiscalDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Autorizado' } : d)); // Revert status
         showToast(`Falha ao cancelar: ${error.message}`, 'error');
    }
  };

  const handleInvalidateFiscalRange = async (series: number, start: number, end: number, reason: string) => {
    showToast(`Solicitando inutilização da faixa ${start}-${end}...`, 'warning');
    try {
        const result = await fiscalApiService.inutilizarNumeracao(series, start, end, reason, fiscalEnvironment);
        setInvalidationRecords(prev => [...prev, result]);
        showToast(`Faixa ${start}-${end} inutilizada com sucesso! Protocolo: ${result.protocol}`, 'success', 6000);
    } catch (error: any) {
        showToast(`Falha ao inutilizar: ${error.message}`, 'error');
    }
  };

  const handleUpdateMotoboy = async (motoboyId: number, updates: Partial<Motoboy>) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
        await updateDoc(doc(db, 'pizzerias', pid, 'motoboys', motoboyId.toString()), updates);
    } catch (err) {
        console.error("Erro ao atualizar motoboy:", err);
    }
  };
  
    const handleAddClient = async (clientData: Omit<Client, 'id' | 'registrationDate'>) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        const id = Math.max(0, ...clients.map(c => c.id)) + 1;
        const newClient: Client = {
            id,
            ...clientData,
            registrationDate: new Date().toISOString(),
        };
        try {
            await setDoc(doc(db, 'pizzerias', pid, 'clients', id.toString()), newClient);
            showToast(`Cliente "${newClient.name}" adicionado com sucesso.`, 'success');
        } catch (err) {
            handleFirestoreError(err, 'create' as any, `pizzerias/${pid}/clients/${id}`);
        }
    };

    const handleUpdateClient = async (clientId: number, updatedData: Partial<Client>) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        try {
            await updateDoc(doc(db, 'pizzerias', pid, 'clients', clientId.toString()), updatedData);
            showToast('Dados do cliente atualizados.', 'success');
        } catch (err) {
            handleFirestoreError(err, 'update' as any, `pizzerias/${pid}/clients/${clientId}`);
        }
    };

    const handleRemoveClient = async (clientId: number) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        try {
            await deleteDoc(doc(db, 'pizzerias', pid, 'clients', clientId.toString()));
            showToast(`Cliente removido com sucesso.`, 'warning');
        } catch (err) {
            handleFirestoreError(err, 'delete' as any, `pizzerias/${pid}/clients/${clientId}`);
        }
    };

  const handleAddFixedCost = async (name: string, value: number) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    const id = Math.max(0, ...fixedCosts.map(c => c.id)) + 1;
    const newCost: FixedCost = {
      id,
      name,
      value,
      pizzeriaId: pid
    };
    try {
        await setDoc(doc(db, 'pizzerias', pid, 'fixed_costs', id.toString()), newCost);
        showToast(`Custo "${name}" adicionado com sucesso.`, 'success');
    } catch (err) {
        handleFirestoreError(err, 'create' as any, `pizzerias/${pid}/fixed_costs/${id}`);
    }
  };

  const handleUpdateFixedCost = async (id: number, name: string, value: number) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
        await updateDoc(doc(db, 'pizzerias', pid, 'fixed_costs', id.toString()), { name, value });
        showToast(`Custo "${name}" atualizado.`, 'success');
    } catch (err) {
        handleFirestoreError(err, 'update' as any, `pizzerias/${pid}/fixed_costs/${id}`);
    }
  };

  const handleRemoveFixedCost = async (id: number) => {
    if (!currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
        await deleteDoc(doc(db, 'pizzerias', pid, 'fixed_costs', id.toString()));
        showToast('Custo mensal removido.', 'warning');
    } catch (err) {
        handleFirestoreError(err, 'delete' as any, `pizzerias/${pid}/fixed_costs/${id}`);
    }
  };

  const handleUpdateIngredient = async (id: number, updatedData: Partial<Ingredient>) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (!ingredient || !currentUser?.pizzeriaId) return;

    const pid = currentUser.pizzeriaId;
    const newDoc = { ...ingredient, ...updatedData };
    try {
      await setDoc(doc(db, 'pizzerias', pid, 'ingredients', id.toString()), newDoc);
      showToast('Ingrediente atualizado no banco de dados.', 'success');
    } catch (error) {
       handleFirestoreError(error, 'update', `pizzerias/${pid}/ingredients/${id}`);
    }
  };
  
    const handleUpdateIngredientUnit = async (ingredientId: number, newUnit: Ingredient['unit']) => {
        const ingredient = ingredients.find(i => i.id === ingredientId);
        if (!ingredient || !currentUser?.pizzeriaId) return;

        const pid = currentUser.pizzeriaId;
        const oldUnit = ingredient.unit;
        if (oldUnit === newUnit) return;

        if (oldUnit === 'un' || newUnit === 'un') {
            showToast(`Não é possível converter de/para 'un' (unidades).`, 'error');
            return;
        }

        const conversionFactors: { [key in Ingredient['unit']]: number } = {
            'g': 1, 'kg': 1000, 'ml': 1, 'L': 1000, 'un': 1,
        };

        const oldUnitBaseFactor = conversionFactors[oldUnit];
        const newUnitBaseFactor = conversionFactors[newUnit];
        const conversionRatio = oldUnitBaseFactor / newUnitBaseFactor;

        const updatedIng = {
            ...ingredient,
            unit: newUnit,
            stock: ingredient.stock * conversionRatio,
            minStock: ingredient.minStock * conversionRatio,
            costPerUnit: ingredient.costPerUnit / conversionRatio,
        };

        try {
            await setDoc(doc(db, 'pizzerias', pid, 'ingredients', ingredientId.toString()), updatedIng);
            const isCrossType = (['g', 'kg'].includes(oldUnit) && ['ml', 'L'].includes(newUnit)) || 
                                (['ml', 'L'].includes(oldUnit) && ['g', 'kg'].includes(newUnit));

            let toastMessage = `Unidade de '${ingredient.name}' alterada para '${newUnit}'.`;
            if (isCrossType) toastMessage += " (Assumindo 1g ≈ 1ml).";
            showToast(toastMessage, 'success', 5000);
        } catch (error) {
            handleFirestoreError(error, 'update', `pizzerias/${pid}/ingredients/${ingredientId}`);
        }
    };

  const handleRemoveIngredient = async (id: number) => {
    // No Firebase simplificado, vamos apenas reportar que a exclusão deve ser controlada
    showToast('Exclusão desabilitada nesta versão comercial para segurança de dados histórico.', 'warning');
  };
  
  const handleUpdateIngredientMinStock = async (id: number, minStock: number) => {
      const ingredient = ingredients.find(i => i.id === id);
      if (!ingredient || !currentUser?.pizzeriaId) return;
      const pid = currentUser.pizzeriaId;
      try {
          await setDoc(doc(db, 'pizzerias', pid, 'ingredients', id.toString()), { ...ingredient, minStock });
          showToast('Estoque mínimo sincronizado.', 'success');
      } catch (error) {
          handleFirestoreError(error, 'update', `pizzerias/${pid}/ingredients/${id}`);
      }
  };

  const handleUpdateIngredientYield = async (id: number, yieldFactor: number) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (!ingredient || !currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    try {
        await setDoc(doc(db, 'pizzerias', pid, 'ingredients', id.toString()), { ...ingredient, yieldFactor });
        showToast('Fator de aproveitamento atualizado.', 'success');
    } catch (error) {
        handleFirestoreError(error, 'update', `pizzerias/${pid}/ingredients/${id}`);
    }
  };

  const handleAdjustStock = async (id: number, newStock: number) => {
    const ingredient = ingredients.find(i => i.id === id);
    if (!ingredient || !currentUser?.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;
    
    try {
        const diff = newStock - ingredient.stock;
        await setDoc(doc(db, 'pizzerias', pid, 'ingredients', id.toString()), { ...ingredient, stock: newStock });
        
        await logStockMovement({
            ingredientId: id,
            ingredientName: ingredient.name,
            type: 'Ajuste',
            quantity: Math.abs(diff),
            unit: ingredient.unit,
            reason: 'Ajuste manual de inventário'
        });

        showToast('Estoque ajustado com sucesso.', 'success');
    } catch (error) {
        handleFirestoreError(error, 'update', `pizzerias/${pid}/ingredients/${id}`);
    }
  };
  
  const handleUpdateProduct = (productId: number, updatedData: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...updatedData } : p));
    showToast('Produto atualizado com sucesso.', 'success');
  };

  const handleRemoveProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    showToast('Produto removido com sucesso.', 'warning');
  };
  
  const handleAddProduct = (newProducts: (Omit<Product, 'id'> & { ingredients?: string[] })[]) => {
    let lastId = Math.max(0, ...products.map(p => p.id));
    let lastIngredientId = Math.max(0, ...ingredients.map(i => i.id));
    
    const updatedIngredients = [...ingredients];
    const updatedRecipes = { ...recipes };
    const finalProducts: Product[] = [];

    newProducts.forEach(analyzedProduct => {
        lastId++;
        const newProduct: Product = {
            id: lastId,
            name: analyzedProduct.name,
            category: analyzedProduct.category,
            price: analyzedProduct.price,
            description: analyzedProduct.description,
            imageUrl: '',
        };
        finalProducts.push(newProduct);

        if (analyzedProduct.ingredients && analyzedProduct.ingredients.length > 0) {
            const recipeParts: Recipe[number] = [];

            analyzedProduct.ingredients.forEach(ingredientName => {
                const normalizedName = ingredientName.trim().toLowerCase();
                let existingIngredient = updatedIngredients.find(ing => ing.name.toLowerCase() === normalizedName);

                if (!existingIngredient) {
                    lastIngredientId++;
                    const newIngredient: Ingredient = {
                        id: lastIngredientId,
                        name: ingredientName.charAt(0).toUpperCase() + ingredientName.slice(1),
                        stock: 0,
                        unit: 'g', // Default to grams
                        minStock: 0,
                        costPerUnit: 0
                    };
                    updatedIngredients.push(newIngredient);
                    existingIngredient = newIngredient;
                }
                
                const isLiquid = /molho|azeite|creme|catupiry/.test(normalizedName);

                recipeParts.push({
                    ingredientId: existingIngredient.id,
                    quantity: isLiquid ? 50 : 100, // Placeholder quantity
                    unit: isLiquid ? 'ml' : 'g' // Placeholder unit
                });
            });

            updatedRecipes[newProduct.id] = recipeParts;
        }
    });

    setProducts(prev => [...prev, ...finalProducts]);
    setIngredients(updatedIngredients);
    setRecipes(updatedRecipes);
    
    const message = finalProducts.length > 1 
        ? `${finalProducts.length} produtos e seus ingredientes foram adicionados!` 
        : `Produto "${finalProducts[0].name}" e seus ingredientes foram adicionados!`;
    showToast(message, 'success');
    
    setCurrentPage('Cardápio');
};

    const handleAddUser = async (userData: Omit<User, 'id' | 'employmentStatus'>) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        const id = Math.max(0, ...users.map(u => u.id)) + 1;
        try {
            await setDoc(doc(db, 'pizzerias', pid, 'employees', id.toString()), { ...userData, id, pizzeriaId: pid, employmentStatus: 'Ativo' });
            showToast(`Funcionário "${userData.name}" registrado com sucesso.`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Falha ao registrar funcionário.", "error");
        }
    };

    const handleUpdateUser = async (userId: number, updatedData: Partial<User>) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        try {
            if (updatedData.password === '') {
                delete updatedData.password;
            }
            await updateDoc(doc(db, 'pizzerias', pid, 'employees', userId.toString()), updatedData);
            showToast('Dados do funcionário atualizados.', 'success');
        } catch (error) {
            console.error(error);
            showToast("Falha ao atualizar funcionário.", "error");
        }
    };

    const handleToggleUserStatus = async (userId: number) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        const user = users.find(u => u.id === userId);
        if (!user) return;
        try {
            const newStatus = user.employmentStatus === 'Ativo' ? 'Inativo' : 'Ativo';
            await updateDoc(doc(db, 'pizzerias', pid, 'employees', userId.toString()), { employmentStatus: newStatus });
            showToast(`Status de ${user.name} alterado para ${newStatus}.`, 'warning');
        } catch (error) {
            console.error(error);
            showToast("Erro ao alterar status.", "error");
        }
    };

    const handleRemoveUser = async (userId: number) => {
        if (userId === currentUser?.id) {
            showToast('Você não pode excluir seu próprio usuário.', 'error');
            return;
        }
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        try {
            await deleteDoc(doc(db, 'pizzerias', pid, 'employees', userId.toString()));
            showToast('Funcionário removido com sucesso.', 'warning');
        } catch (error) {
            console.error(error);
            showToast("Erro ao excluir funcionário.", "error");
        }
    };

    const handleAddSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        const id = Math.random().toString(36).substring(7);
        try {
            await setDoc(doc(db, 'pizzerias', pid, 'suppliers', id), { ...supplierData, id, pizzeriaId: pid });
            showToast('Fornecedor cadastrado.', 'success');
        } catch (error) {
            handleFirestoreError(error, 'create', `pizzerias/${pid}/suppliers/${id}`);
        }
    };

    const handleRemoveSupplier = async (id: string) => {
        if (!currentUser?.pizzeriaId) return;
        // Logic for removal/deactivation
        showToast('Solicitação de remoção enviada.', 'warning');
    };

  const handleCloseCashRegister = async (date: string, ordersToClose: Order[], totals: { totalRevenue: number, paymentMethodTotals: Record<PaymentMethod, number> }) => {
    if (!currentUser || !currentUser.pizzeriaId) return;
    const pid = currentUser.pizzeriaId;

    if (cashRegisterClosings.some(c => c.id === date && c.status !== 'Reversed')) {
      showToast(`O caixa para a data ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')} já foi fechado.`, 'error');
      return;
    }

    const newClosing: CashRegisterClosing = {
      id: date,
      date: date,
      totalRevenue: totals.totalRevenue,
      paymentMethodTotals: totals.paymentMethodTotals,
      closedByUserId: currentUser.id,
      closedByUserName: currentUser.name,
      closingTime: new Date().toISOString(),
      status: 'Active',
    };

    try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'pizzerias', pid, 'cash_closings', date), newClosing);
        
        ordersToClose.forEach(order => {
            batch.update(doc(db, 'pizzerias', pid, 'orders', order.id), { closedInCashRegisterDate: date });
        });

        await batch.commit();

        const message = `Caixa do dia ${new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')} fechado com sucesso! Faturamento: R$ ${totals.totalRevenue.toFixed(2)}`;
        showToast(message, 'success');
    } catch (err) {
        handleFirestoreError(err, 'write' as any, `pizzerias/${pid}/cash_closings`);
    }
  };

  const handleReverseCashRegister = async (date: string, reason: string) => {
    if (currentUser?.role !== 'Admin' || !currentUser?.pizzeriaId) {
        showToast('Apenas administradores podem estornar o caixa.', 'error');
        return;
    }
    const pid = currentUser.pizzeriaId;

    try {
        const batch = writeBatch(db);
        batch.update(doc(db, 'pizzerias', pid, 'cash_closings', date), {
            status: 'Reversed',
            reversedByUserId: currentUser.id,
            reversedByUserName: currentUser.name,
            reversalTime: new Date().toISOString(),
            reversalReason: reason
        });

        // Opcionalmente, "reabrimos" os pedidos vinculados
        const ordersToReopen = orders.filter(o => o.closedInCashRegisterDate === date);
        ordersToReopen.forEach(order => {
            batch.update(doc(db, 'pizzerias', pid, 'orders', order.id), { closedInCashRegisterDate: deleteField() });
        });

        await batch.commit();
        showToast(`Fechamento de caixa do dia ${date} estornado com sucesso.`, 'warning');
    } catch (err) {
        handleFirestoreError(err, 'update' as any, `pizzerias/${pid}/cash_closings/${date}`);
    }
  };
  
    // --- NEW: Analysis Handlers ---
    const handleAnalyzeMenu = async (files: File[]) => {
        if (analysisState.menu.isAnalyzing) {
            showToast('A análise de cardápio já está em andamento.', 'warning');
            return;
        }

        setAnalysisState(prev => ({ ...prev, menu: { isAnalyzing: true, message: 'Iniciando...' } }));
        const updateStatus = (message: string) => {
            setAnalysisState(prev => ({ ...prev, menu: { isAnalyzing: true, message } }));
        };

        const result = await analyzeMenuImage(files, updateStatus);
        
        if (result.success && result.data && Array.isArray(result.data)) {
            const newProducts: (Omit<Product, 'id'> & { ingredients?: string[] })[] = (result.data as any[]).map((item: any) => ({
                name: item.name,
                category: item.category,
                price: item.price,
                description: item.description,
                imageUrl: '',
                ingredients: item.ingredients || []
            }));

            if (newProducts.length > 0) {
                handleAddProduct(newProducts);
            } else {
                showToast("Nenhum item válido foi encontrado no cardápio.", 'warning');
            }
        } else {
            showToast(`Erro ao analisar: ${result.message || 'Formato de resposta inesperado.'}`, 'error');
        }

        setAnalysisState(prev => ({ ...prev, menu: { isAnalyzing: false, message: '' } }));
    };

    const handleAnalyzeCosts = async (files: File[]) => {
        if (analysisState.costs.isAnalyzing) {
            showToast('A análise de custos já está em andamento.', 'warning');
            return;
        }
        
        setAnalysisState(prev => ({ ...prev, costs: { isAnalyzing: true, message: 'Iniciando...' } }));
        const updateStatus = (message: string) => {
            setAnalysisState(prev => ({ ...prev, costs: { isAnalyzing: true, message } }));
        };
        
        const result = await analyzeInvoices(files, updateStatus);
        
        if (result.success && result.data) {
            setCostAnalysisResult(result.data as AnalysisResult);
            setIsCostConfirmationModalOpen(true);
        } else {
            showToast(result.message || 'Falha ao analisar documentos.', 'error');
        }
        
        setAnalysisState(prev => ({ ...prev, costs: { isAnalyzing: false, message: '' } }));
    };

    const handleConfirmCostAnalysis = async (updates: ConfirmedUpdate) => {
        if (!currentUser?.pizzeriaId) return;
        const pid = currentUser.pizzeriaId;
        const batch = writeBatch(db);

        // Update Ingredients and Log Entry
        updates.ingredientUpdates.forEach(update => {
            const ingRef = doc(db, 'pizzerias', pid, 'ingredients', update.systemIngredientId.toString());
            const currentIng = ingredients.find(i => i.id === update.systemIngredientId);
            if (currentIng) {
                const newStock = currentIng.stock + update.quantityToAdd;
                batch.update(ingRef, { 
                    costPerUnit: update.newCost, 
                    stock: newStock 
                });

                // Log Movement
                const movementId = Math.random().toString(36).substring(7);
                const moveRef = doc(db, 'pizzerias', pid, 'stock_movements', movementId);
                batch.set(moveRef, {
                    id: movementId,
                    ingredientId: update.systemIngredientId,
                    ingredientName: currentIng.name,
                    type: 'Entrada',
                    quantity: update.quantityToAdd,
                    unit: currentIng.unit,
                    reason: 'Lançamento via Nota Fiscal (AI)',
                    userName: currentUser.name,
                    timestamp: new Date().toISOString(),
                    pizzeriaId: pid
                });
            }
        });

        // Update Fixed Costs
        updates.fixedCostUpdates.forEach(update => {
            const costRef = doc(db, 'pizzerias', pid, 'fixedCosts', update.systemCostId.toString());
            batch.update(costRef, { value: update.newValue });
        });

        try {
            await batch.commit();
            showToast(`${updates.ingredientUpdates.length} ingrediente(s) e ${updates.fixedCostUpdates.length} custo(s) atualizados no Firebase!`, 'success');
        } catch (error) {
            console.error("Erro ao confirmar análise de custos:", error);
            showToast("Falha ao salvar atualizações no banco de dados.", "error");
        }

        setIsCostConfirmationModalOpen(false);
        setCostAnalysisResult(null);
    };

    const handleConfirmMotoboyDelivery = (orderId: string, motoboyId: number) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, status: 'Concluído', deliveredByMotoboyId: motoboyId }
            : order
        )
      );
      showToast(`Pedido #${orderId} entregue com sucesso!`, 'success');
    };


  // --- RENDER LOGIC ---

  if (isInitializing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
              <div className="text-center animate-pulse">
                  <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-semibold">Iniciando plataforma segura...</p>
              </div>
          </div>
      );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Role-based routing
  if (currentUser.role === 'Cozinha') {
    return <KDS orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} currentUser={currentUser} onLogout={handleLogout} />;
  }
  
  if (currentUser.role === 'Motoboy') {
    const motoboyData = motoboys.find(m => m.id === currentUser.id);
    return <MotoboyDashboard orders={orders} motoboy={motoboyData} onConfirmDelivery={handleConfirmMotoboyDelivery} onUpdateMotoboy={handleUpdateMotoboy} currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Main admin/manager view
  const renderPage = () => {
    switch (currentPage) {
        case 'Dashboard': return <Dashboard
                                    orders={orders}
                                    fixedCosts={fixedCosts}
                                    ingredients={ingredients}
                                    products={products}
                                    recipes={recipes}
                                    setCurrentPage={setCurrentPage}
                                />;
        case 'Pedidos': return <Orders orders={orders} products={products} addons={addons} onCreateOrder={handleCreateOrder} onUpdateOrderStatus={handleUpdateOrderStatus} onEmitFiscalDocument={handleEmitFiscalDocument} onCancelOrderItem={handleCancelOrderItem} onCloseTableOrder={handleCloseTableOrder} currentUser={currentUser} />;
        case 'Cozinha': return <KDS orders={orders} onUpdateOrderStatus={handleUpdateOrderStatus} currentUser={currentUser} />;
        case 'Mapa de Entregas': return <DeliveryMap orders={orders} />;
        case 'Logística': return <Logistics orders={orders} motoboys={motoboys} onUpdateOrderStatus={handleUpdateOrderStatus} onUpdateMotoboy={handleUpdateMotoboy} showToast={showToast} />;
        case 'Atendimento': return <Whatsapp chatbotUpsellEnabled={chatbotUpsellEnabled} chatbotCouponEnabled={chatbotCouponEnabled} showToast={showToast} />;
        case 'Cardápio': return <Menu 
                                    products={products} 
                                    onAddProduct={handleAddProduct} 
                                    onUpdateProduct={handleUpdateProduct} 
                                    onRemoveProduct={handleRemoveProduct} 
                                    isAnalyzing={analysisState.menu.isAnalyzing}
                                    analysisMessage={analysisState.menu.message}
                                    onAnalyzeMenu={handleAnalyzeMenu}
                                    addons={addons}
                                    addonRecipes={addonRecipes}
                                    onUpdateAddon={handleUpdateAddon}
                                    onUpdateAddonRecipe={handleUpdateAddonRecipe}
                                    ingredients={ingredients}
                                />;
        case 'Estoque': return <Inventory 
                                    ingredients={ingredients} 
                                    setIngredients={setIngredients} 
                                    onRemoveIngredient={handleRemoveIngredient} 
                                    onUpdateIngredientMinStock={handleUpdateIngredientMinStock} 
                                    onUpdateIngredientUnit={handleUpdateIngredientUnit}
                                    onUpdateIngredientYield={handleUpdateIngredientYield}
                                    onAdjustStock={handleAdjustStock}
                                    recipes={recipes}
                                    products={products}
                                    stockMovements={stockMovements}
                                    orders={orders}
                                />;
        case 'Custos': return <Costs 
                                    orders={orders} 
                                    ingredients={ingredients} 
                                    setIngredients={setIngredients} 
                                    onUpdateIngredient={handleUpdateIngredient} 
                                    onRemoveIngredient={handleRemoveIngredient} 
                                    fixedCosts={fixedCosts} 
                                    setFixedCosts={setFixedCosts} 
                                    onAddFixedCost={handleAddFixedCost} 
                                    onUpdateFixedCost={handleUpdateFixedCost} 
                                    onRemoveFixedCost={handleRemoveFixedCost} 
                                    products={products} 
                                    recipes={recipes} 
                                    onUpdateProduct={handleUpdateProduct} 
                                    showToast={showToast} 
                                    onUpdateIngredientUnit={handleUpdateIngredientUnit}
                                    isAnalyzing={analysisState.costs.isAnalyzing}
                                    analysisMessage={analysisState.costs.message}
                                    onAnalyzeCosts={handleAnalyzeCosts}
                                />;
        case 'Fornecedores': return <Suppliers 
                                        ingredients={ingredients} 
                                        suppliers={suppliers}
                                        onAddSupplier={handleAddSupplier}
                                        onRemoveSupplier={handleRemoveSupplier}
                                    />;
        case 'Clientes': return <Clientes clients={clients} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} onRemoveClient={handleRemoveClient} />;
        // FIX: Passed handleUpdateUser function to onUpdateUser prop.
        case 'Funcionários': return <Funcionarios users={users} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onToggleStatus={handleToggleUserStatus} onRemoveUser={handleRemoveUser} />;
        case 'Fiscal': return <Fiscal 
                                documents={fiscalDocuments} 
                                onCancelDocument={handleCancelFiscalDocument} 
                                environment={fiscalEnvironment} 
                                invalidationRecords={invalidationRecords} 
                                onInvalidateRange={handleInvalidateFiscalRange}
                                orders={orders}
                                clients={clients}
                                ingredients={ingredients}
                                fixedCosts={fixedCosts}
                                products={products}
                                recipes={recipes}
                              />;
        case 'Caixa': return <Caixa orders={orders} showToast={showToast} cashRegisterClosings={cashRegisterClosings} onCloseCashRegister={handleCloseCashRegister} onReverseCashRegister={handleReverseCashRegister} currentUser={currentUser} />;
        case 'Configurações': return <Settings chatbotUpsellEnabled={chatbotUpsellEnabled} setChatbotUpsellEnabled={setChatbotUpsellEnabled} chatbotCouponEnabled={chatbotCouponEnabled} setChatbotCouponEnabled={setChatbotCouponEnabled} showToast={showToast} pizzeriaInfo={pizzeriaInfo} onUpdatePizzeriaInfo={handleUpdatePizzeriaInfo} currentUser={currentUser} />;
        default: return <Dashboard
                            orders={orders}
                            fixedCosts={fixedCosts}
                            ingredients={ingredients}
                            products={products}
                            recipes={recipes}
                            setCurrentPage={setCurrentPage}
                        />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} currentUser={currentUser} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          {renderPage()}
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {isCostConfirmationModalOpen && costAnalysisResult && (
          <CostAnalysisConfirmationModal
              analysisResult={costAnalysisResult}
              ingredients={ingredients}
              fixedCosts={fixedCosts}
              onClose={() => setIsCostConfirmationModalOpen(false)}
              onConfirm={handleConfirmCostAnalysis}
          />
      )}
    </div>
  );
};

export default App;