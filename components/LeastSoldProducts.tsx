import React from 'react';

interface ProductSalesData {
    name: string;
    sales: number;
    totalValue: number;
}

interface LeastSoldProductsProps {
    data: ProductSalesData[];
}

const LeastSoldProducts: React.FC<LeastSoldProductsProps> = ({ data }) => {
    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Produtos Menos Vendidos</h3>
            <ul className="space-y-4">
                {data.map((product, index) => (
                    <li key={product.name} className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold mr-4">
                            {index + 1}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.sales} vendidos</p>
                        </div>
                        <div className="font-bold text-p-d-olive">
                           R$ {product.totalValue.toFixed(2)}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LeastSoldProducts;