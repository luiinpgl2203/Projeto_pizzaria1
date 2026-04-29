import React, { useEffect, useRef, useState } from 'react';
import { Order } from '../types';

// Global declaration for window.google
declare global {
    interface Window {
        google: any;
    }
}

// Estilo de mapa escuro para combinar com a paleta de cores da pizzaria
const mapStyles = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }],
    },
    {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }],
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }],
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }],
    },
    {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }],
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }],
    },
    {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }],
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }],
    },
    {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }],
    },
];

const GOOGLE_MAPS_API_KEY = 'AIzaSyCe62lLPdUab6H_T28htTp6uz12d2o9HA0';

// Helper to dynamically load the script
const loadGoogleMapsScript = (callback: () => void) => {
    const scriptId = 'google-maps-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
        script.id = scriptId;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        script.onload = () => {
            if (callback) callback();
        };
        script.onerror = () => {
            console.error("Google Maps script failed to load.");
        };
    } else {
        // If script is already there, check if google maps is loaded. If not, it might be loading, so add a listener.
        if (window.google && window.google.maps) {
            callback();
        } else {
             existingScript.addEventListener('load', () => callback());
        }
    }
};

// FIX: Define props interface for the DeliveryMap component.
interface DeliveryMapProps {
    orders: Order[];
}

const DeliveryMap: React.FC<DeliveryMapProps> = ({ orders }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const ordersWithCoords = orders.filter(o => o.coordinates && o.coordinates.lat && o.coordinates.lng);
    
    useEffect(() => {
        if (GOOGLE_MAPS_API_KEY) {
            loadGoogleMapsScript(() => {
                setIsMapReady(true);
            });
        }
    }, []); // Run only once on mount
    
    useEffect(() => {
        if (!isMapReady || !mapRef.current || !window.google || !window.google.maps) {
            return;
        }

        const centerPoint = { lat: -23.5505, lng: -46.6333 };

        const map = new window.google.maps.Map(mapRef.current, {
            center: centerPoint,
            zoom: 12,
            styles: mapStyles,
            mapTypeControl: false,
            streetViewControl: false,
        });

        const heatMapData = ordersWithCoords.map(order => 
            new window.google.maps.LatLng(order.coordinates!.lat, order.coordinates!.lng)
        );

        if(heatMapData.length > 0) {
            const heatmap = new window.google.maps.visualization.HeatmapLayer({
                data: heatMapData
            });

            // Configuração do gradiente de calor para combinar com as cores da pizzaria
            heatmap.set('gradient', [
                'rgba(162, 255, 0, 0)',   // brand-lime (transparent)
                'rgba(162, 255, 0, 1)',   // brand-lime
                'rgba(255, 115, 0, 1)',  // brand-orange
                'rgba(255, 0, 20, 1)'     // brand-red
            ]);
            
            heatmap.set('radius', 20);
            heatmap.set('opacity', 0.8);
            heatmap.setMap(map);
        }

    }, [ordersWithCoords, isMapReady]); // Re-run when map is ready or orders change
    
    if (!GOOGLE_MAPS_API_KEY) {
        return (
             <div className="bg-red-100 border-l-4 border-brand-red text-red-800 p-4 rounded-md shadow-md" role="alert">
                <p className="font-bold">Configuração Necessária</p>
                <p>A chave da API do Google Maps não foi encontrada. Por favor, configure a variável de ambiente `GOOGLE_MAPS_API_KEY` para exibir o mapa de entregas.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Mapa de Calor de Entregas</h3>
            <p className="text-gray-600 mb-6">Navegue pelo mapa e visualize as áreas com maior concentração de pedidos para otimizar suas rotas de entrega.</p>
            <div 
                ref={mapRef} 
                className="w-full h-[60vh] bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-200"
                aria-label="Mapa de calor de entregas"
            >
                {!isMapReady && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Carregando mapa...
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryMap;