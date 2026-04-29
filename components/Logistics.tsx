import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Order, Motoboy } from '../types';
import { Map as MapIcon, Route } from 'lucide-react';

declare global {
    interface Window { google: any; }
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCe62lLPdUab6H_T28htTp6uz12d2o9HA0';
const PIZZERIA_LOCATION = { lat: -23.5505, lng: -46.6333 };
const PIZZERIA_ADDRESS_URL = "Pizzaria+Funchal,+S%C3%A3o+Paulo";

const mapStyles = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] }, { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] }, { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] }, { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] }, { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] }, { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] }, { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] }, { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] }, { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] }, { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] }, { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] }, { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] }, { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] }, { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] }, { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] }, { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

const loadGoogleMapsScript = (callback: () => void) => {
    const scriptId = 'google-maps-script';
    if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
        script.id = scriptId;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        script.onload = () => callback();
    } else {
        if(window.google) callback();
        else document.getElementById(scriptId)?.addEventListener('load', callback);
    }
};

const getMotoboyIcon = (status: Motoboy['status']) => {
    const color = {
        'Livre': '#A2FF00', // brand-lime
        'Em Entrega': '#FF7300', // brand-orange
        'Retornando': '#3b82f6', // blue-500
    }[status];
    return {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2,
        scale: 8,
    };
};

interface LogisticsProps {
    orders: Order[];
    motoboys: Motoboy[];
    onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
    onUpdateMotoboy: (motoboyId: number, updates: Partial<Motoboy>) => void;
    showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const Logistics: React.FC<LogisticsProps> = ({ orders, motoboys, onUpdateOrderStatus, onUpdateMotoboy, showToast }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const [markers, setMarkers] = useState<any[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [selectedMotoboyId, setSelectedMotoboyId] = useState<string>('');

    const pendingOrders = useMemo(() => 
        orders.filter(o => o.status === 'Pronto para Entrega' && o.orderType === 'Entrega'), 
    [orders]);
    const availableMotoboys = useMemo(() => motoboys.filter(m => m.status === 'Livre'), [motoboys]);

    useEffect(() => {
        loadGoogleMapsScript(() => {
            if (mapRef.current && !map) {
                const mapInstance = new window.google.maps.Map(mapRef.current, { center: PIZZERIA_LOCATION, zoom: 14, styles: mapStyles, mapTypeControl: false, streetViewControl: false });
                new window.google.maps.Marker({ position: PIZZERIA_LOCATION, map: mapInstance, title: 'Pizzaria Funchal', icon: { url: 'https://i.ibb.co/M5R9dfRm/logo-funchal.jpg', scaledSize: new window.google.maps.Size(40, 40) } });
                setMap(mapInstance);
            }
        });
    }, []);

    useEffect(() => {
        if (map && window.google) {
            markers.forEach(marker => marker.setMap(null));
            const newMarkers = motoboys.map(motoboy => new window.google.maps.Marker({ position: motoboy.location, map, title: `${motoboy.name} (${motoboy.status})`, icon: getMotoboyIcon(motoboy.status) }));
            setMarkers(newMarkers);
        }
    }, [map, motoboys]);

    useEffect(() => {
        const interval = setInterval(() => {
            motoboys.forEach(motoboy => {
                const targetOrderId = motoboy.assignedOrderIds[0];
                const order = orders.find(o => o.id === targetOrderId);
                
                if (motoboy.status === 'Em Entrega' && order?.coordinates) {
                    const newLat = motoboy.location.lat + (order.coordinates.lat - motoboy.location.lat) * 0.1;
                    const newLng = motoboy.location.lng + (order.coordinates.lng - motoboy.location.lng) * 0.1;
                    onUpdateMotoboy(motoboy.id, { location: { lat: newLat, lng: newLng } });

                    const distanceToDest = Math.sqrt(Math.pow(newLat - order.coordinates.lat, 2) + Math.pow(newLng - order.coordinates.lng, 2));
                    if (distanceToDest < 0.001) {
                        onUpdateOrderStatus(order.id, 'Concluído');
                        showToast(`Pedido #${order.id} entregue!`, 'success');
                        const remainingOrderIds = motoboy.assignedOrderIds.slice(1);
                        onUpdateMotoboy(motoboy.id, { assignedOrderIds: remainingOrderIds, status: remainingOrderIds.length > 0 ? 'Em Entrega' : 'Retornando' });
                    }
                } else if (motoboy.status === 'Retornando') {
                    const newLat = motoboy.location.lat + (PIZZERIA_LOCATION.lat - motoboy.location.lat) * 0.1;
                    const newLng = motoboy.location.lng + (PIZZERIA_LOCATION.lng - motoboy.location.lng) * 0.1;
                    onUpdateMotoboy(motoboy.id, { location: { lat: newLat, lng: newLng } });
                    
                    const distanceToPizzeria = Math.sqrt(Math.pow(newLat - PIZZERIA_LOCATION.lat, 2) + Math.pow(newLng - PIZZERIA_LOCATION.lng, 2));
                    if(distanceToPizzeria < 0.001) {
                         showToast(`${motoboy.name} retornou à base e está livre.`, 'warning');
                         onUpdateMotoboy(motoboy.id, { status: 'Livre', assignedOrderIds: [], location: PIZZERIA_LOCATION });
                    }
                }
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [motoboys, orders, onUpdateMotoboy, onUpdateOrderStatus, showToast]);

    const handleToggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
    };

    const handleAssignOrders = () => {
        if (selectedOrderIds.length === 0 || !selectedMotoboyId) {
            showToast('Selecione pelo menos um pedido e um motoboy.', 'error');
            return;
        }
        const motoboy = motoboys.find(m => m.id === parseInt(selectedMotoboyId));
        if (!motoboy) return;

        selectedOrderIds.forEach(id => onUpdateOrderStatus(id, 'Saiu para Entrega'));
        onUpdateMotoboy(motoboy.id, { status: 'Em Entrega', assignedOrderIds: selectedOrderIds });
        showToast(`${selectedOrderIds.length} pedido(s) atribuído(s) a ${motoboy.name}.`, 'success');
        setSelectedOrderIds([]);
        setSelectedMotoboyId('');
    };

    const handleNavigate = (order: Order) => {
        if (order.address) {
            const destination = encodeURIComponent(order.address);
            const url = `https://www.google.com/maps/dir/?api=1&origin=${PIZZERIA_ADDRESS_URL}&destination=${destination}&travelmode=motorcycle`;
            window.open(url, '_blank');
        }
    };
    
    const handleNavigateOptimizedRoute = (assignedOrders: Order[]) => {
        if(assignedOrders.length === 0) return;
        
        const validOrders = assignedOrders.filter(o => o.address);
        if(validOrders.length === 0) return;

        const destination = encodeURIComponent(validOrders[validOrders.length - 1].address!);
        const waypoints = validOrders.slice(0, -1).map(o => encodeURIComponent(o.address!)).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${PIZZERIA_ADDRESS_URL}&destination=${destination}&waypoints=${waypoints}&travelmode=motorcycle`;
        window.open(url, '_blank');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-md flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Logística em Tempo Real</h3>
                <div ref={mapRef} className="w-full flex-grow bg-gray-200 rounded-lg min-h-[60vh]"></div>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Motoboys Ativos</h3>
                    <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {motoboys.map(m => {
                             const assignedOrders = m.assignedOrderIds.map(id => orders.find(o => o.id === id)).filter(Boolean) as Order[];
                             return (
                             <li key={m.id} className="p-2 rounded-md border border-gray-200">
                                <div className="flex items-center">
                                    <img src={m.avatarUrl} alt={m.name} className="w-10 h-10 rounded-full mr-3"/>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{m.name}</p>
                                        <div className="flex items-center text-sm"><span className={`w-3 h-3 rounded-full mr-2 bg-green-500`}></span><span className="text-gray-600">{m.status}</span></div>
                                    </div>
                                    {m.status === 'Em Entrega' && assignedOrders.length > 0 && (
                                        <button onClick={() => handleNavigateOptimizedRoute(assignedOrders)} className="text-white bg-blue-500 hover:bg-blue-600 p-2 rounded-full transition-colors flex items-center text-xs" title="Iniciar Rota Otimizada"><Route className="mr-1 w-3 h-3"/> Otimizar</button>
                                    )}
                                </div>
                                {m.assignedOrderIds.length > 0 && (
                                    <div className="mt-2 pl-2 border-l-2 border-gray-200 space-y-1">
                                        <h4 className="text-xs font-bold text-gray-500">ENTREGAS:</h4>
                                        {assignedOrders.map(order => (
                                            <div key={order.id} className="flex items-center justify-between text-sm">
                                                <span>#{order.id} - {order.address}</span>
                                                <button onClick={() => handleNavigate(order)} className="text-blue-500 hover:text-blue-700 p-1" title={`Navegar para #${order.id}`}><MapIcon className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                         );
                        })}
                    </ul>
                </div>
                 <div className="bg-white p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pedidos para Despacho ({pendingOrders.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {pendingOrders.map(o => (
                            <label key={o.id} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer border border-gray-200">
                                <input type="checkbox" checked={selectedOrderIds.includes(o.id)} onChange={() => handleToggleOrderSelection(o.id)} className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
                                <div className="ml-3">
                                    <p className="font-bold text-brand-orange">Pedido #{o.id}</p>
                                    <p className="text-sm text-gray-500">{o.address}</p>
                                </div>
                            </label>
                        ))}
                        {pendingOrders.length === 0 && <p className="text-center text-gray-400 p-4">Nenhum pedido na fila.</p>}
                    </div>
                    {pendingOrders.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="relative">
                                <select
                                    value={selectedMotoboyId}
                                    onChange={e => setSelectedMotoboyId(e.target.value)}
                                    className="appearance-none block w-full p-2 pr-10 bg-gray-50 border border-gray-300 text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition"
                                >
                                    <option value="">Selecione um motoboy...</option>
                                    {availableMotoboys.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <button onClick={handleAssignOrders} disabled={selectedOrderIds.length === 0 || !selectedMotoboyId} className="w-full mt-2 bg-brand-orange text-white px-4 py-2 rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                                Atribuir Pedidos ({selectedOrderIds.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Logistics;