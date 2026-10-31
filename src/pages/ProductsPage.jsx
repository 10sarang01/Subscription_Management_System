import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import ProductDetailView from './products/ProductDetailView';
import ProductsList from './products/ProductsList';

export default function ProductsPage() {
  const { products, catalogLoading, catalogError, refreshCatalog } = useSubscription();
  const [selectedProductId, setSelectedProductId] = useState(null);

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {catalogLoading && <p role="status">Loading products and plans…</p>}
      {catalogError && <div role="alert" className="neu-flat-sm" style={{ padding: '16px', color: 'var(--error-text)' }}>{catalogError} <button className="neu-btn" onClick={refreshCatalog} style={{ padding: '6px 12px', marginLeft: '12px' }}>Retry</button></div>}
      {!catalogLoading && !catalogError && (selectedProduct ? (
        <ProductDetailView
          product={selectedProduct}
          onBack={() => setSelectedProductId(null)}
        />
      ) : (
        <ProductsList onSelectProduct={(p) => setSelectedProductId(p.id)} />
      ))}
    </div>
  );
}
