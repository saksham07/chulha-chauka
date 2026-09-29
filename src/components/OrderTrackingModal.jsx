import React, { useEffect, useState } from 'react';
import {
  Bike,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  ShoppingBag,
  X,
  XCircle,
} from 'lucide-react';
import api from '../services/api';

const STATUS_STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Cooking', icon: ChefHat },
  { key: 'OUT_FOR_DELIVERY', label: 'On Way', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', icon: ShoppingBag },
];

export default function OrderTrackingModal({ orderId, onClose, onBackToHistory }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await api.getOrder(orderId);
      setOrder(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order tracking data:', err);
      setError(err.message || 'Could not load order tracking details.');
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 8 seconds for live kitchen updates
    const interval = setInterval(() => {
      fetchOrder();
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const updated = await api.cancelOrder(orderId);
      setOrder(updated);
    } catch (err) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  // Compute active step index:
  // PENDING = 0, CONFIRMED = 0, PREPARING = 1, OUT_FOR_DELIVERY = 2, DELIVERED = 3
  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'OUT_FOR_DELIVERY':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return 0;
    }
  };

  const isCancelled = order?.status === 'CANCELLED';
  const currentStep = order ? getStepIndex(order.status) : 0;
  const progressPercent = isCancelled ? 0 : Math.min(100, (currentStep / (STATUS_STEPS.length - 1)) * 100);

  const formatTime = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
             d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="order-tracker-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tracker-head">
          <div className="tracker-head-info">
            {onBackToHistory && (
              <button className="back-btn" onClick={onBackToHistory} title="Back to orders">
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h2>Order #CC-{orderId}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                {!isCancelled && <span className="live-pill">LIVE TRACKING</span>}
                {order?.createdAt && <span className="muted" style={{ fontSize: 11 }}>{formatTime(order.createdAt)}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => fetchOrder(true)}
              title="Refresh status"
              disabled={refreshing}
            >
              <RefreshCw size={17} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            </button>
            <button className="icon-btn" onClick={onClose} aria-label="Close tracking">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="tracker-body">
          {loading && !order ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p>Fetching real-time order status...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#c62828' }}>
              <p>{error}</p>
              <button className="primary-btn" onClick={() => fetchOrder(true)} style={{ marginTop: 12 }}>
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              {isCancelled ? (
                <div className="tracker-status-hero" style={{ background: '#ffebee', borderColor: '#ffcdd2' }}>
                  <div className="status-hero-icon" style={{ background: '#d32f2f' }}>
                    <XCircle size={32} />
                  </div>
                  <h3 style={{ color: '#c62828' }}>Order Cancelled</h3>
                  <p>This order has been cancelled. Any online payment will be refunded to your source account.</p>
                </div>
              ) : (
                <div className="tracker-status-hero">
                  <div className="status-hero-icon pulse">
                    {order.status === 'DELIVERED' ? (
                      <Check size={32} strokeWidth={2.5} />
                    ) : order.status === 'OUT_FOR_DELIVERY' ? (
                      <Bike size={32} />
                    ) : order.status === 'PREPARING' ? (
                      <ChefHat size={32} />
                    ) : (
                      <Clock size={32} />
                    )}
                  </div>
                  <h3>
                    {order.status === 'DELIVERED' && 'Order Delivered! 🎉'}
                    {order.status === 'OUT_FOR_DELIVERY' && 'Rider is Out for Delivery! 🛵'}
                    {order.status === 'PREPARING' && 'Kitchen is Cooking Fresh! 🍳'}
                    {(order.status === 'CONFIRMED' || order.status === 'PENDING') && 'Order Confirmed & Received! ⏳'}
                  </h3>
                  <p>
                    {order.status === 'DELIVERED' && 'Thank you for ordering with Chulha Chauka! Hope you loved your meal.'}
                    {order.status === 'OUT_FOR_DELIVERY' && 'Your food is piping hot and heading straight to your address.'}
                    {order.status === 'PREPARING' && 'Our chefs in Saharsa are preparing your homestyle dishes with love.'}
                    {(order.status === 'CONFIRMED' || order.status === 'PENDING') && 'Your order is verified. Kitchen will begin preparation shortly.'}
                  </p>
                  {order.status !== 'DELIVERED' && (
                    <div className="tracker-eta">
                      <Clock size={14} /> Estimated Arrival: <b>30–45 mins</b>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Stepper (if not cancelled) */}
              {!isCancelled && (
                <div className="tracker-stepper">
                  <div
                    className="tracker-stepper-progress"
                    style={{ width: `calc(${progressPercent}% * 0.82)` }}
                  />
                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx < currentStep;
                    const isActive = idx === currentStep;
                    const IconComp = step.icon;
                    return (
                      <div
                        key={step.key}
                        className={`track-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                      >
                        <div className="track-step-dot">
                          {isDone ? <Check size={16} strokeWidth={3} /> : <IconComp size={16} />}
                        </div>
                        <span className="track-step-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Address Details */}
              <div className="tracker-section-card">
                <h4><MapPin size={16} color="var(--orange)" /> Delivery Details</h4>
                <div className="tracker-address-text">
                  <b>{order.deliveryAddress?.name}</b> · {order.deliveryAddress?.phone}<br />
                  {order.deliveryAddress?.line1}<br />
                  Saharsa, Bihar - {order.deliveryAddress?.pincode}
                </div>
                {order.specialNote && (
                  <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--muted)', fontStyle: 'italic' }}>
                    Note: "{order.specialNote}"
                  </div>
                )}
              </div>

              {/* Order Items & Summary */}
              <div className="tracker-section-card">
                <h4><ShoppingBag size={16} color="var(--orange)" /> Items in this Order</h4>
                <div className="order-card-items">
                  {order.items?.map((item, i) => (
                    <div className="order-item-row" key={i}>
                      <div className="qty-name">
                        <span className="item-qty-tag">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </div>
                      <b>₹{item.lineTotal || (item.price * item.quantity)}</b>
                    </div>
                  ))}
                </div>
                <div className="order-card-meta">
                  <div className="order-pay-tag">
                    Paid via <b>{order.paymentMethod || 'ONLINE'}</b>
                  </div>
                  <div className="order-total-sum">Total: ₹{order.total}</div>
                </div>
              </div>

              {/* Help & Kitchen Support Strip */}
              <div className="tracker-support-strip">
                <a
                  className="support-action-btn call"
                  href="tel:+917488023447"
                  title="Call Cloud Kitchen"
                >
                  <Phone size={15} /> Call Kitchen (+91 74880 23447)
                </a>
                <a
                  className="support-action-btn whatsapp"
                  href={`https://wa.me/917488023447?text=Hi%20Chulha%20Chauka,%20I%20need%20an%20update%20on%20my%20order%20%23CC-${orderId}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Chat on WhatsApp"
                >
                  💬 WhatsApp
                </a>
              </div>

              {/* Cancel Button (if order is still PENDING or CONFIRMED) */}
              {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                <button
                  className="cancel-order-btn"
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{ width: '100%', marginTop: -4 }}
                >
                  {cancelling ? 'Cancelling order...' : 'Cancel Order'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
