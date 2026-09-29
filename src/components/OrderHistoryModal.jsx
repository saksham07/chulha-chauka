import React, { useEffect, useState } from 'react';
import {
  Bike,
  Clock,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  X,
} from 'lucide-react';
import api from '../services/api';

export default function OrderHistoryModal({
  currentUser,
  onClose,
  onTrackOrder,
  onReorder,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, DELIVERED, CANCELLED

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch user orders:', err);
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #CC-${orderId}?`)) return;
    try {
      await api.cancelOrder(orderId);
      // Refresh list
      fetchOrders();
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return <span className="status-badge confirmed">⏳ Confirmed</span>;
      case 'PREPARING':
        return <span className="status-badge preparing">🍳 Cooking Fresh</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="status-badge out_for_delivery">🛵 Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="status-badge delivered">✓ Delivered</span>;
      case 'CANCELLED':
        return <span className="status-badge cancelled">✕ Cancelled</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const isOrderActive = (status) =>
    ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(status);

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ACTIVE') return isOrderActive(o.status);
    if (filter === 'DELIVERED') return o.status === 'DELIVERED';
    if (filter === 'CANCELLED') return o.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 90 }}>
      <div className="orders-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="orders-head">
          <h2>
            <Package size={22} color="var(--orange)" /> My Orders & History
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => fetchOrders(true)}
              title="Refresh orders"
              disabled={refreshing}
            >
              <RefreshCw
                size={17}
                style={{
                  animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                }}
              />
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="orders-filter-bar">
          <button
            className={`order-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Orders ({orders.length})
          </button>
          <button
            className={`order-filter-pill ${filter === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Active ({orders.filter((o) => isOrderActive(o.status)).length})
          </button>
          <button
            className={`order-filter-pill ${filter === 'DELIVERED' ? 'active' : ''}`}
            onClick={() => setFilter('DELIVERED')}
          >
            Delivered ({orders.filter((o) => o.status === 'DELIVERED').length})
          </button>
          <button
            className={`order-filter-pill ${filter === 'CANCELLED' ? 'active' : ''}`}
            onClick={() => setFilter('CANCELLED')}
          >
            Cancelled ({orders.filter((o) => o.status === 'CANCELLED').length})
          </button>
        </div>

        {/* Orders List Body */}
        <div className="orders-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--muted)' }}>
              <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <p>Loading your orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--muted)' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🍱</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--brown)', fontSize: 18 }}>
                {filter === 'ALL' ? 'No orders placed yet' : `No ${filter.toLowerCase()} orders`}
              </h3>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                {filter === 'ALL'
                  ? 'Explore our freshly cooked homestyle menu and place your first order!'
                  : 'You have no orders in this category.'}
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const active = isOrderActive(order.status);
              return (
                <div className="order-card" key={order.orderId}>
                  <div className="order-card-head">
                    <div className="order-id-group">
                      <b>Order #CC-{order.orderId}</b>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Items summary */}
                  <div className="order-card-items">
                    {order.items?.map((it, idx) => (
                      <div className="order-item-row" key={idx}>
                        <div className="qty-name">
                          <span className="item-qty-tag">{it.quantity}x</span>
                          <span>{it.name}</span>
                        </div>
                        <b>₹{it.lineTotal || it.price * it.quantity}</b>
                      </div>
                    ))}
                  </div>

                  {/* Meta: Total & Payment */}
                  <div className="order-card-meta">
                    <div className="order-pay-tag">
                      Payment: <b>{order.paymentMethod || 'ONLINE'}</b>
                      {order.deliveryAddress?.line1 && (
                        <span> · {order.deliveryAddress.line1.slice(0, 32)}...</span>
                      )}
                    </div>
                    <div className="order-total-sum">Total: ₹{order.total}</div>
                  </div>

                  {/* Actions */}
                  <div className="order-card-actions">
                    <button
                      className="track-btn"
                      onClick={() => onTrackOrder(order.orderId)}
                    >
                      <Bike size={16} />
                      {active ? 'Track Live Order' : 'View Order Details'}
                    </button>

                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                      <button
                        className="cancel-order-btn"
                        onClick={() => handleCancelOrder(order.orderId)}
                      >
                        Cancel
                      </button>
                    )}

                    {onReorder && (
                      <button
                        className="reorder-btn"
                        onClick={() => onReorder(order.items)}
                        title="Add these items to cart"
                      >
                        <RotateCcw size={14} /> Reorder
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
