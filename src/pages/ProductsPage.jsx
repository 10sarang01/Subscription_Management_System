import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import ProductDetailView from './products/ProductDetailView';
import ProductsList from './products/ProductsList';

export default function ProductsPage() {
  const { products } = useSubscription();
  const [selectedProductId, setSelectedProductId] = useState(null);

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onBack={() => setSelectedProductId(null)}
        />
      ) : (
        <ProductsList onSelectProduct={(p) => setSelectedProductId(p.id)} />
      )}
    </div>
  );
}
