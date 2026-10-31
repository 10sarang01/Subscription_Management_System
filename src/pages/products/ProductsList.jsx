import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit3,
  ChevronRight,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import ProductFormModal from './ProductFormModal';

export default function ProductsList({ onSelectProduct }) {
  const { products, addProduct, updateProduct, getPlansForProduct, currentPersona } = useSubscription();
  const isAdmin = currentPersona.role === 'admin';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleCreateProduct = async (productData) => {
    if (await addProduct(productData)) setShowCreateModal(false);
  };

  const handleUpdateProduct = async (productData) => {
    if (!editingProduct) return;
    if (await updateProduct(editingProduct.id, productData)) setEditingProduct(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="neu-flat" style={{ padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>Products &amp; Plans</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Each product has its own independent billing plans. Click a product to manage its plans and variants.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="neu-btn-primary"
            style={{ padding: '10px 18px', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '7px' }}
          >
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {/* Products Grid / Table */}
      <div className="neu-flat" style={{ padding: '24px 28px' }}>
        {products.length === 0 ? (
          <div className="neu-inset-sm" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '16px' }}>
            <div className="neu-flat-sm" style={{ width: '56px', height: '56px', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Package size={28} />
            </div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>No Products Yet</h4>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '8px auto 20px', lineHeight: 1.5 }}>
              Create your first product, then add subscription plans to it. Each product can have multiple independent plans.
            </p>
            {isAdmin && (
              <button onClick={() => setShowCreateModal(true)} className="neu-btn-primary" style={{ padding: '11px 24px', display: 'flex', alignItems: 'center', gap: '7px', margin: '0 auto' }}>
                <Plus size={16} /> Create First Product
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {products.map(product => {
              const plans = getPlansForProduct(product.id);
              const activePlans = plans.filter(p => p.isActive);
              const margin = product.salesPrice > 0
                ? (((product.salesPrice - product.costPrice) / product.salesPrice) * 100).toFixed(0)
                : 0;

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="neu-flat-sm"
                  style={{
                    padding: '16px 20px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                    border: '1px solid rgba(184,194,204,0.2)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,70,229,0.25)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(184,194,204,0.2)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                >
                  {/* Product info */}
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{product.name}</span>
                      <span className="status-pill status-confirmed" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>{product.type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span>Sales price: <strong style={{ color: 'var(--text-main)' }}>₹{(product.salesPrice || 0).toFixed(2)}</strong></span>
                      <span>Margin: <strong style={{ color: 'var(--success)' }}>{margin}%</strong></span>
                      {product.variants?.length > 0 && (
                        <span>{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>

                  {/* Plan count badge & Edit button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Plans</div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: activePlans.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                        {activePlans.length}
                        <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '3px' }}>active</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                        className="neu-btn"
                        style={{ padding: '7px 11px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}
                        title="Edit Product Details & Variants"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                    )}
                    <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <ProductFormModal
          onSubmit={handleCreateProduct}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onSubmit={handleUpdateProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}
