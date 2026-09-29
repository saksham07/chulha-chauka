import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Bike, Check, ChevronLeft, Clock, Heart, Leaf,
  LogOut, MapPin, Menu as MenuIcon, Minus, Package, Plus, Search,
  ShoppingBag, Sparkles, Star, User as UserIcon, X,
} from 'lucide-react';
import './styles.css';
import api from './services/api';
import OrderHistoryModal from './components/OrderHistoryModal';
import OrderTrackingModal from './components/OrderTrackingModal';

import logo from './assets/logo.png';
import heroFood from './assets/food/hero-food.png';
import matarPaneer from './assets/food/matar-paneer.png';
import friedRicePaneer from './assets/food/fried-rice-paneer.png';
import thali from './assets/food/thali.png';
import shahiPaneer from './assets/food/shahi-paneer.png';
import cheeseMaggie from './assets/food/cheese-maggie.png';
import dalTadka from './assets/food/dal-tadka.jpg';
import gheeRoti from './assets/food/ghee-roti.jpg';
import pooriSabji from './assets/food/poori-sabji.jpg';
import kadhiChawal from './assets/food/kadhi-chawal.jpg';
import paneerChilli from './assets/food/paneer-chilli.jpg';
import kadhaiPaneer from './assets/food/kadhai-paneer.jpg';
import alooParatha from './assets/food/aloo-paratha.jpg';
import vegPulao from './assets/food/veg-pulao.jpg';
import desiPasta from './assets/food/desi-pasta.jpg';
import masalaPoha from './assets/food/masala-poha.jpg';
import shahiKheer from './assets/food/shahi-kheer.jpg';
import meethiSewai from './assets/food/meethi-sewai.jpg';
import aaluBhujiaParatha from './assets/food/aalu-bhujia-paratha.jpg';

/* ─── Image mapping helper ────────────────────────────────────────────────── */

const imageMap = {
  'matar-paneer': matarPaneer,
  'fried-rice-paneer': friedRicePaneer,
  'thali': thali,
  'shahi-paneer': shahiPaneer,
  'cheese-maggie': cheeseMaggie,
  'dal-tadka': dalTadka,
  'ghee-roti': gheeRoti,
  'poori-sabji': pooriSabji,
  'kadhi-chawal': kadhiChawal,
  'paneer-chilli': paneerChilli,
  'kadhai-paneer': kadhaiPaneer,
  'aloo-paratha': alooParatha,
  'veg-pulao': vegPulao,
  'desi-pasta': desiPasta,
  'masala-poha': masalaPoha,
  'shahi-kheer': shahiKheer,
  'meethi-sewai': meethiSewai,
  'aalu-bhujia': aaluBhujiaParatha,
  'hero-food': heroFood,
};

function resolveFoodImage(item) {
  if (!item) return thali;

  // External custom URL uploaded via admin (http/https)
  const rawImg = item.imageUrl || item.image;
  if (typeof rawImg === 'string' && (rawImg.startsWith('http://') || rawImg.startsWith('https://'))) {
    return rawImg;
  }

  // 1. Match by dish name FIRST so each specific dish gets its authentic photo
  if (item.name) {
    const n = item.name.toLowerCase().trim();

    // Desserts
    if (n.includes('kheer')) return shahiKheer;
    if (n.includes('sewai')) return meethiSewai;

    // Snacks
    if (n.includes('poha')) return masalaPoha;
    if (n.includes('pasta')) return desiPasta;
    if (n.includes('cheese maggie')) return cheeseMaggie;
    if (n.includes('maggie')) return cheeseMaggie;

    // Dal
    if (n.includes('dal') || n.includes('tadka')) return dalTadka;

    // Meals & Bihari Specials
    if (n.includes('aalu bhujia') || n.includes('bhujia')) return aaluBhujiaParatha;
    if (n.includes('poori') || n.includes('puri')) return pooriSabji;
    if (n.includes('kadhi')) return kadhiChawal;

    // Indo-Chinese & Starters
    if (n.includes('fried rice')) return friedRicePaneer;
    if (n.includes('chilli')) return paneerChilli;

    // Rice
    if (n.includes('pulao')) return vegPulao;
    if (n.includes('jeera rice')) return vegPulao;
    if (n.includes('rice') && !n.includes('paneer')) return vegPulao;

    // Bread
    if (n.includes('ghee roti') || n.includes('roti')) return gheeRoti;
    if (n.includes('paratha')) return alooParatha;

    // Curries
    if (n.includes('kadhai paneer')) return kadhaiPaneer;
    if (n.includes('matar paneer')) return matarPaneer;
    if (n.includes('shahi paneer') || n.includes('paneer bhurji')) return shahiPaneer;
    if (n.includes('paneer')) return shahiPaneer;

    // Thali & Combos
    if (n.includes('thali')) return thali;
    if (n.includes('combo')) return heroFood;
  }

  // 2. Fallback to imageMap by URL keyword
  const url = (rawImg || '').toLowerCase();
  for (const [key, img] of Object.entries(imageMap)) {
    if (url.includes(key)) return img;
  }

  return thali;
}

/* ─── App ─────────────────────────────────────────────────────────────────── */

function App() {
  const [categories,     setCategories]     = useState([]);
  const [menu,           setMenu]           = useState([]);
  const [menuLoading,    setMenuLoading]    = useState(true);
  const [deliveryConfig, setDeliveryConfig] = useState({ deliveryFeeRupees: 30, estimatedMinutes: 40 });

  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [cart,           setCart]           = useState({});
  const [cartOpen,       setCartOpen]       = useState(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [checkoutOpen,   setCheckoutOpen]   = useState(false);
  const [authModalOpen,  setAuthModalOpen]  = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [activeSection,  setActiveSection]  = useState('home');

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cc_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  /* ── Listen for 401/403 auth errors to reset auth state cleanly ── */
  useEffect(() => {
    api.onAuthError = () => {
      setCurrentUser(null);
    };
  }, []);

  /* ── Load dynamic data from Backend API ── */
  useEffect(() => {
    async function loadData() {
      try {
        const [catsRes, configRes, itemsRes] = await Promise.all([
          api.getCategories().catch(() => []),
          api.getDeliveryConfig().catch(() => null),
          api.getMenuItems().catch(() => ({ items: [] })),
        ]);

        if (Array.isArray(catsRes) && catsRes.length > 0) {
          setCategories(catsRes);
        } else {
          setCategories([
            { id: 1, name: 'Combos', icon: '🍱' },
            { id: 2, name: 'Thali', icon: '🥘' },
            { id: 3, name: 'Meals', icon: '🍛' },
            { id: 4, name: 'Starter', icon: '🧆' },
            { id: 5, name: 'Main Course', icon: '🍲' },
            { id: 6, name: 'Bread', icon: '🫓' },
            { id: 7, name: 'Rice', icon: '🍚' },
            { id: 8, name: 'Snacks', icon: '🍜' },
            { id: 9, name: 'Desserts', icon: '🍮' },
          ]);
        }

        if (configRes) {
          setDeliveryConfig(configRes);
        }

        const rawItems = itemsRes.items || itemsRes || [];
        setMenu(rawItems);
      } catch (err) {
        console.error('Failed to load menu from API:', err);
      } finally {
        setMenuLoading(false);
      }
    }
    loadData();
  }, []);

  /* ── Sync cart with server if logged in ── */
  useEffect(() => {
    if (!currentUser || !api.token) return;
    api.getCart().then(res => {
      if (res && res.items && res.items.length > 0) {
        const map = {};
        res.items.forEach(ci => {
          map[ci.menuItemId] = {
            id: ci.menuItemId,
            name: ci.name,
            desc: ci.description,
            price: ci.price,
            qty: ci.quantity,
            imageUrl: ci.imageUrl,
          };
        });
        setCart(map);
      }
    }).catch(err => {
      console.debug('Could not load user cart:', err);
    });
  }, [currentUser]);

  /* ── Scroll-spy: highlight whichever section is in the viewport ── */
  const sectionIds = ['home', 'menu', 'about', 'reviews', 'contact'];
  useEffect(() => {
    const observers = [];
    const ratios = {};
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          ratios[id] = entry.intersectionRatio;
          const best = Object.entries(ratios).sort((a, b) => b[1] - a[1])[0];
          if (best && best[1] > 0) setActiveSection(best[0]);
        },
        { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Filter menu items ── */
  const visibleItems = useMemo(() => {
    // If user is searching, search across ALL items regardless of category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return menu.filter(x =>
        (x.name && x.name.toLowerCase().includes(q)) ||
        (x.desc && x.desc.toLowerCase().includes(q)) ||
        (x.description && x.description.toLowerCase().includes(q))
      );
    }
    // No category selected → show category landing (no items)
    if (!activeCategory) return [];
    // "All" shows everything
    if (activeCategory === 'All') return menu;
    // Filter by specific category
    return menu.filter(x => {
      const cName = typeof x.category === 'object' ? x.category?.name : x.category;
      return cName === activeCategory;
    });
  }, [menu, activeCategory, searchQuery]);

  /* ── Per-category item counts for category tiles ── */
  const categoryItemCounts = useMemo(() => {
    const counts = {};
    menu.forEach(item => {
      const cName = typeof item.category === 'object' ? item.category?.name : item.category;
      if (cName) counts[cName] = (counts[cName] || 0) + 1;
    });
    return counts;
  }, [menu]);

  const cartItems  = Object.values(cart);
  const itemCount  = cartItems.reduce((s, x) => s + x.qty, 0);
  const subtotal   = cartItems.reduce((s, x) => s + x.price * x.qty, 0);
  const deliveryFee = subtotal > 0 ? (deliveryConfig.deliveryFeeRupees || 30) : 0;
  const total      = subtotal > 0 ? subtotal + deliveryFee : 0;

  const add = (item) => {
    setCart(prev => {
      const currentQty = prev[item.id]?.qty || 0;
      return { ...prev, [item.id]: { ...item, qty: currentQty + 1 } };
    });
    if (currentUser && api.token) {
      api.addToCart(item.id, 1).catch(err => console.debug('Sync cart add error', err));
    }
  };

  const decrement = (id) => {
    setCart(prev => {
      const next = { ...prev };
      if (!next[id]) return next;
      if (next[id].qty <= 1) delete next[id];
      else next[id] = { ...next[id], qty: next[id].qty - 1 };
      return next;
    });
    if (currentUser && api.token) {
      const nextQty = (cart[id]?.qty || 1) - 1;
      if (nextQty <= 0) {
        api.removeFromCart(id).catch(err => console.debug('Sync cart remove error', err));
      } else {
        api.updateCartItem(id, nextQty).catch(err => console.debug('Sync cart update error', err));
      }
    }
  };

  const clearCart = () => {
    setCart({});
    if (currentUser && api.token) {
      api.request('/cart', { method: 'DELETE' }).catch(() => {});
    }
  };

  const goMenu = () => {
    setMenuOpen(false);
    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openCheckout = () => {
    if (!currentUser || !api.token) {
      setAuthModalOpen(true);
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleAuthSuccess = async (user) => {
    setCurrentUser(user);
    setAuthModalOpen(false);
    const items = Object.values(cart);
    if (items.length > 0) {
      for (const item of items) {
        await api.updateCartItem(item.id, item.qty).catch(() => {});
      }
      setCartOpen(false);
      setCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    api.logout();
    localStorage.removeItem('cc_user');
    setCurrentUser(null);
    setCart({});
  };

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="nav-inner">
          <a className="brand" href="#home" aria-label="Chulha Chauka home">
            <img src={logo} alt="Chulha Chauka" />
          </a>
          <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a className={activeSection === 'home'    ? 'active' : ''} href="#home"    onClick={() => setMenuOpen(false)}>Home</a>
            <a className={activeSection === 'menu'    ? 'active' : ''} href="#menu"    onClick={() => setMenuOpen(false)}>Menu</a>
            <a className={activeSection === 'about'   ? 'active' : ''} href="#about"   onClick={() => setMenuOpen(false)}>About Us</a>
            <a className={activeSection === 'reviews' ? 'active' : ''} href="#reviews" onClick={() => setMenuOpen(false)}>Reviews</a>
            <a className={activeSection === 'contact' ? 'active' : ''} href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            {currentUser && (
              <a
                href="#orders"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setOrdersModalOpen(true);
                }}
                style={{ color: 'var(--orange2)' }}
              >
                📋 My Orders
              </a>
            )}
          </nav>
          <div className="nav-actions">
            {/* User Auth Info */}
            {currentUser ? (
              <div className="user-nav-group">
                <button
                  className="orders-nav-btn"
                  onClick={() => setOrdersModalOpen(true)}
                  title="My Orders & Tracking"
                >
                  <Clock size={15} />
                  <span>My Orders</span>
                </button>
                <div className="user-badge">
                  <UserIcon size={15} />
                  <span>Hi, <b>{currentUser.name?.split(' ')[0]}</b></span>
                  <button className="logout-btn" onClick={handleLogout} title="Log out">
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button className="login-btn" onClick={() => setAuthModalOpen(true)}>
                <UserIcon size={15} />
                <span>Login</span>
              </button>
            )}

            <button
              className="cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <ShoppingBag size={21} />
              {itemCount > 0 && <span>{itemCount}</span>}
            </button>
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero" id="home">
          <div className="hero-copy">
            <div className="eyebrow">SAHARSA'S OWN CLOUD KITCHEN</div>
            <h1>
              <span className="h1-line">Chulha</span>
              <span className="h1-line">Chauka<i>✦</i></span>
            </h1>
            <div className="tagline">Ghar jaisa swaad, har niwala apnapan.</div>
            <p>
              Freshly prepared homestyle food, made with simple ingredients
              and lots of care — now serving Saharsa.
            </p>
            <div className="hero-buttons">
              <button className="primary-btn" onClick={goMenu}>
                Explore Menu <ArrowRight size={18} />
              </button>
              <a href="#about" className="secondary-btn">Our Story</a>
            </div>
            <div className="trust-row">
              <span><Check /> 100% Pure Veg</span>
              <span><Check /> Desi Ghee & Fresh Spices</span>
              <span><Check /> Fast Delivery</span>
            </div>
          </div>
          <div className="hero-image-wrap">
            <img src={heroFood} alt="Chulha Chauka homestyle spread" className="hero-image" />
            <div className="veg-badge">
              <b>100%</b>
              <span>Pure Veg</span>
            </div>
          </div>
        </section>

        {/* ── Full Menu Section ── */}
        <section className="section" id="menu">
          <div className="section-head">
            <div>
              <h2><Sparkles size={24} /> Our Menu</h2>
              <p>Authentic homestyle dishes cooked fresh upon order · {deliveryConfig.estimatedMinutes || 40} min delivery</p>
            </div>
            {(activeCategory || searchQuery) && (
              <button onClick={() => { setActiveCategory(null); setSearchQuery(''); }}>
                ← All Categories
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search dishes (e.g. paneer, thali, maggie, roti)..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) setActiveCategory('All');
              }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setActiveCategory(null); }} className="icon-btn" aria-label="Clear search">
                <X size={16} />
              </button>
            )}
          </div>

          {/* ── Category Landing View (no category selected, no search) ── */}
          {!activeCategory && !searchQuery && !menuLoading && (
            <div className="category-landing">
              {categories.map(c => (
                <button
                  key={c.id || c.name}
                  className="cat-tile"
                  onClick={() => setActiveCategory(c.name)}
                >
                  <span className="cat-tile-icon">{c.icon || '🍛'}</span>
                  <div className="cat-tile-info">
                    <b>{c.name}</b>
                    <small>{categoryItemCounts[c.name] || 0} items</small>
                  </div>
                  <ArrowRight size={16} className="cat-tile-arrow" />
                </button>
              ))}
            </div>
          )}

          {/* ── Category pill strip (shown when viewing items) ── */}
          {(activeCategory || searchQuery) && (
            <div className="category-pills">
              <button
                className={`cat-pill ${activeCategory === 'All' ? 'active' : ''}`}
                onClick={() => setActiveCategory('All')}
              >
                All
              </button>
              {categories.map(c => (
                <button
                  key={c.id || c.name}
                  className={`cat-pill ${activeCategory === c.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.name)}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Food grid with Live Backend Data */}
          {menuLoading ? (
            <div className="api-loading">
              <div className="spinner"></div>
              <span>Loading delicious dishes...</span>
            </div>
          ) : (activeCategory || searchQuery) && visibleItems.length === 0 ? (
            <div className="no-results">
              <p>No dishes found matching your selection.</p>
              <button onClick={() => { setActiveCategory(null); setSearchQuery(''); }}>
                ← Back to Categories
              </button>
            </div>
          ) : visibleItems.length > 0 && (
            <div className="food-grid">
              {visibleItems.map(item => (
                <FoodCard
                  key={item.id}
                  item={item}
                  cart={cart}
                  add={add}
                  decrement={decrement}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Promise strip (About Us) ── */}
        <section className="promise" id="about">
          <div>
            <div className="promise-icon">🌿</div>
            <h3>Pure Vegetarian</h3>
            <p>100% vegetarian kitchen with spotless hygiene standards.</p>
          </div>
          <div>
            <div className="promise-icon">✨</div>
            <h3>Ghar Ka Swaad</h3>
            <p>Simple spices, honest recipes — food that never feels heavy.</p>
          </div>
          <div>
            <div className="promise-icon">🥘</div>
            <h3>Freshly Made</h3>
            <p>Every order cooked fresh on order, hot and ready to enjoy.</p>
          </div>
          <div>
            <div className="promise-icon">🛵</div>
            <h3>Fast Delivery</h3>
            <p>Delivered promptly anywhere in Saharsa within {deliveryConfig.estimatedMinutes || 40} minutes.</p>
          </div>
        </section>

        {/* ── Reviews ── */}
        <section className="section reviews" id="reviews">
          <div className="section-head">
            <div>
              <h2><Heart size={24} /> What Saharsa Loves About Us</h2>
              <p>Honest words from families and food lovers in town</p>
            </div>
          </div>
          <div className="review-grid">
            <article>
              <div className="stars">★★★★★</div>
              <p>"The special thali reminded me of mom's cooking. Soft rotis, perfectly spiced dal, and hot matar paneer. Best in Saharsa!"</p>
              <b>— Priya Sharma, Saharsa</b>
            </article>
            <article>
              <div className="stars">★★★★★</div>
              <p>"Super fast delivery and the food was steaming hot. The Shahi Paneer combo is our family's weekly Sunday lunch now."</p>
              <b>— Amit Kumar, Naya Bazar</b>
            </article>
            <article>
              <div className="stars">★★★★★</div>
              <p>"Pure desi taste with real ghee! It feels so light on the stomach. Truly ghar jaisa khana."</p>
              <b>— Ritu Jha, D.B. Road</b>
            </article>
          </div>
        </section>

        {/* ── Contact strip ── */}
        <section className="contact-strip" id="contact">
          <div>
            <h2>Hungry? Let's Cook for You.</h2>
            <p>Order fresh homestyle food right now. Hot delivery across Saharsa.</p>
          </div>
          <button onClick={goMenu}>Order Now <ArrowRight /></button>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer>
        <div className="footer-brand">
          <img src={logo} alt="Chulha Chauka" />
          <p>Ghar jaisa swaad, apno jaisi rasoi.</p>
        </div>
        <div>
          <b>Quick Links</b>
          <a href="#menu">Menu</a>
          <a href="#about">About Us</a>
          <a href="#reviews">Reviews</a>
        </div>
        <div>
          <b>Serving</b>
          <span>Saharsa, Bihar</span>
          <span>100% Pure Veg</span>
          <span>Online & COD Payment</span>
        </div>
        <div>
          <b>Made with warmth</b>
          <span>Freshly prepared to order.</span>
          <span>© 2026 Chulha Chauka</span>
        </div>
      </footer>

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-head">
              <div>
                <h2>Your Cart</h2>
                <p>{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setCartOpen(false)} aria-label="Close cart"><X /></button>
            </div>

            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <div>🛒</div>
                <h3>Your cart is empty</h3>
                <p>Add something delicious from the menu.</p>
                <button className="primary-btn" onClick={() => { setCartOpen(false); goMenu(); }}>
                  Explore Menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div className="cart-item" key={item.id}>
                      <img src={resolveFoodImage(item)} alt="" />
                      <div className="cart-item-info">
                        <b>{item.name}</b>
                        <span>₹{item.price}</span>
                        <div className="qty">
                          <button onClick={() => decrement(item.id)} aria-label="Decrease"><Minus size={14} /></button>
                          <span>{item.qty}</span>
                          <button onClick={() => add(item)} aria-label="Increase"><Plus size={14} /></button>
                        </div>
                      </div>
                      <div className="cart-item-subtotal">₹{item.price * item.qty}</div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <div><span>Subtotal</span><b>₹{subtotal}</b></div>
                  <div><span>Delivery</span><b>₹{deliveryFee}</b></div>
                  <div className="total"><span>Total</span><b>₹{total}</b></div>
                  <button className="checkout-btn" onClick={openCheckout}>
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>
                  <small>🔒 Secure payment (UPI / Cash / Cards)</small>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ── Checkout Modal with Real Backend & Razorpay Integration ── */}
      {checkoutOpen && (
        <CheckoutModal
          cartItems={cartItems}
          subtotal={subtotal}
          total={total}
          deliveryFee={deliveryFee}
          estimatedMinutes={deliveryConfig.estimatedMinutes || 40}
          currentUser={currentUser}
          onNeedAuth={() => setAuthModalOpen(true)}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => { clearCart(); setCheckoutOpen(false); }}
          onBack={() => { setCheckoutOpen(false); setCartOpen(true); }}
          onTrackOrder={(orderId) => setTrackingOrderId(orderId)}
        />
      )}

      {/* ── Login / Register Modal ── */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* ── Order History Modal ── */}
      {ordersModalOpen && (
        <OrderHistoryModal
          currentUser={currentUser}
          onClose={() => setOrdersModalOpen(false)}
          onTrackOrder={(orderId) => {
            setOrdersModalOpen(false);
            setTrackingOrderId(orderId);
          }}
          onReorder={(items) => {
            if (!items || items.length === 0) return;
            items.forEach(it => {
              if (it.menuItemId) {
                const found = menu.find(m => m.id === it.menuItemId);
                if (found) add(found);
              }
            });
            setOrdersModalOpen(false);
            setCartOpen(true);
          }}
        />
      )}

      {/* ── Live Order Tracking Modal ── */}
      {trackingOrderId && (
        <OrderTrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
          onBackToHistory={() => {
            setTrackingOrderId(null);
            setOrdersModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

/* ─── FoodCard ────────────────────────────────────────────────────────────── */

function FoodCard({ item, cart, add, decrement }) {
  const qty = cart[item.id]?.qty || 0;
  const isBestseller = item.best || item.isBestseller;
  const price = item.price || (item.pricePaise ? item.pricePaise / 100 : 0);
  const description = item.desc || item.description;

  return (
    <article className="food-card">
      <div className="food-image">
        <img src={resolveFoodImage(item)} alt={item.name} />
        {isBestseller && <span className="best-badge">Bestseller</span>}
        <span className="veg-dot">●</span>
      </div>
      <div className="food-body">
        <h3>{item.name}</h3>
        <p>{description}</p>
        <div className="food-bottom">
          <strong>₹{price}</strong>
          {qty === 0 ? (
            <button onClick={() => add({ ...item, price })} className="add-btn">
              Add <Plus size={15} />
            </button>
          ) : (
            <div className="qty-control">
              <button onClick={() => decrement(item.id)} aria-label="Decrease"><Minus size={14} /></button>
              <span>{qty}</span>
              <button onClick={() => add({ ...item, price })} aria-label="Increase"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/* ─── CheckoutModal ───────────────────────────────────────────────────────── */

const STEPS = ['Delivery', 'Review', 'Payment'];

function CheckoutModal({
  cartItems, subtotal, total, deliveryFee, estimatedMinutes,
  currentUser, onNeedAuth, onClose, onSuccess, onBack, onTrackOrder
}) {
  const [step, setStep]         = useState(0);
  const [ordered, setOrdered]   = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    address: '',
    pincode: '',
    note: '',
  });

  const [payMethod, setPayMethod] = useState('upi');
  const [errors, setErrors]       = useState({});

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateDelivery = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (step === 0 && !validateDelivery()) return;
    setStep(s => s + 1);
  };

  const placeOrder = async () => {
    setLoading(true);
    setApiError('');

    try {
      if (!api.token) {
        onNeedAuth();
        throw new Error('Please log in or register before placing your order.');
      }

      // Ensure all items in the current cart are synchronized with the server cart
      for (const item of cartItems) {
        await api.updateCartItem(item.id, item.qty).catch(() => {});
      }

      const orderData = await api.placeOrder(
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          line1: form.address.trim(),
          pincode: form.pincode.trim(),
        },
        payMethod.toUpperCase(),
        form.note.trim()
      );

      // Handle Razorpay Online Flow
      const isMockRazorpay = !orderData.razorpayKeyId || orderData.razorpayOrderId?.startsWith('order_mock_');

      if (payMethod !== 'cod' && orderData.razorpayOrderId && !isMockRazorpay && window.Razorpay) {
        const options = {
          key: orderData.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Thy9moEFSctyzu',
          amount: orderData.totalPaise,
          currency: 'INR',
          name: 'Chulha Chauka',
          description: `Order #${orderData.orderId} · 100% Pure Veg`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response) {
            try {
              setLoading(true);
              await api.verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );
              setPlacedOrder(orderData);
              setOrdered(true);
            } catch (vErr) {
              setApiError('Payment verification failed. Please contact support or retry.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: form.name,
            contact: form.phone,
          },
          config: payMethod === 'upi' ? {
            display: {
              blocks: {
                upi: {
                  name: 'Pay via UPI',
                  instruments: [{ method: 'upi' }],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: true,
              },
            },
          } : undefined,
          modal: {
            ondismiss: function () {
              setLoading(false);
              setApiError('UPI payment was cancelled or closed. You can retry or switch to Cash on Delivery.');
            },
          },
          theme: { color: '#e65b16' },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setLoading(false);
          setApiError(resp.error?.description || 'UPI payment was declined or failed.');
        });
        rzp.open();
      } else {
        // COD or immediate confirmed order
        setPlacedOrder(orderData);
        setOrdered(true);
      }
    } catch (err) {
      setApiError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (ordered) {
    return (
      <div className="overlay checkout-overlay" onClick={onClose}>
        <div className="checkout-modal" onClick={e => e.stopPropagation()}>
          <div className="order-success">
            <div className="success-icon"><Check size={38} strokeWidth={3} /></div>
            <h2>Order Placed! 🎉</h2>
            <p>
              Order <b>#CC-{placedOrder?.orderId || 1}</b> confirmed! Thank you, <b>{form.name}</b>.<br />
              Your hot homestyle meal is being prepared with love.
            </p>
            <p className="order-eta">🛵 Estimated delivery: <b>{estimatedMinutes - 5}–{estimatedMinutes + 10} minutes</b></p>
            <p className="order-note muted">
              Payment method: <b>{payMethod.toUpperCase()}</b> · Confirmation sent to <b>{form.phone}</b>.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18, width: '100%', flexWrap: 'wrap' }}>
              <button
                className="primary-btn"
                style={{ flex: 1, minWidth: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={() => {
                  const oid = placedOrder?.orderId;
                  onSuccess();
                  if (oid && onTrackOrder) onTrackOrder(oid);
                }}
              >
                <Bike size={18} /> Track Order Live
              </button>
              <button className="ghost-btn" style={{ flex: 1, minWidth: 120 }} onClick={onSuccess}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-head">
          <button className="back-btn" onClick={step === 0 ? onBack : () => setStep(s => s - 1)} aria-label="Back">
            <ChevronLeft size={20} />
          </button>
          <h2>Checkout</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {/* Step indicator */}
        <div className="step-bar">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`step-item ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="step-dot">
                  {i < step ? <Check size={14} strokeWidth={2.5} /> : i + 1}
                </div>
                <span className="step-label">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-connector ${i < step ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="checkout-body">
          {apiError && (
            <div className="payment-error-box">
              <div className="payment-error-text">⚠️ {apiError}</div>
              {step === 2 && (
                <div className="payment-error-actions">
                  <button type="button" onClick={placeOrder} className="retry-btn">
                    🔄 Retry Payment
                  </button>
                  {payMethod !== 'cod' && (
                    <button type="button" onClick={() => { setPayMethod('cod'); setApiError(''); }} className="switch-cod-btn">
                      💵 Switch to Cash on Delivery
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 0: Delivery details ── */}
          {step === 0 && (
            <div className="checkout-step">
              <h3>Delivery Details</h3>
              <Field label="Full Name" error={errors.name}>
                <input
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                />
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                />
              </Field>
              <Field label="Delivery Address" error={errors.address}>
                <textarea
                  placeholder="House / Flat no., Apartment, Street, Landmark in Saharsa"
                  value={form.address}
                  onChange={e => setField('address', e.target.value)}
                  rows={3}
                />
              </Field>
              <Field label="Pincode" error={errors.pincode}>
                <input
                  placeholder="6-digit delivery pincode (e.g. 852201)"
                  maxLength={6}
                  value={form.pincode}
                  onChange={e => setField('pincode', e.target.value)}
                />
              </Field>
              <Field label="Special Instructions (optional)">
                <input
                  placeholder="e.g. Ring the doorbell, less spicy, extra chutney"
                  value={form.note}
                  onChange={e => setField('note', e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* ── Step 1: Review order ── */}
          {step === 1 && (
            <div className="checkout-step">
              <h3>Review Your Order</h3>
              <div className="review-items">
                {cartItems.map(item => (
                  <div className="review-item" key={item.id}>
                    <span className="review-item-name">{item.name}</span>
                    <span className="review-item-qty">× {item.qty}</span>
                    <span className="review-item-price">₹{item.price * item.qty}</span>
                  </div>
                ))}
              </div>
              <div className="review-totals">
                <div><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                <div className="review-grand"><span>Total</span><b>₹{total}</b></div>
              </div>
              <div className="delivery-to">
                <MapPin size={15} />
                <div>
                  <b>{form.name}</b> · {form.phone}
                  <p>{form.address}, {form.pincode}</p>
                  {form.note && <p className="muted">Note: {form.note}</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Payment ── */}
          {step === 2 && (
            <div className="checkout-step">
              <h3>Payment Method</h3>
              <div className="pay-options">
                {[
                  {
                    id: 'upi',
                    label: 'UPI (Google Pay, PhonePe, Paytm, QR)',
                    badge: 'Recommended ⚡',
                    subtext: 'Instant UPI PIN payment or Scan QR Code',
                    icon: '⚡',
                    tags: ['GPay', 'PhonePe', 'Paytm', 'BHIM', 'CRED'],
                  },
                  {
                    id: 'card',
                    label: 'Debit / Credit Card & Netbanking',
                    subtext: 'Visa, Mastercard, RuPay & all major banks',
                    icon: '💳',
                  },
                  {
                    id: 'cod',
                    label: 'Cash on Delivery',
                    subtext: `Pay ₹${total} in cash when food arrives at your door`,
                    icon: '💵',
                  },
                ].map(opt => (
                  <label key={opt.id} className={`pay-option ${payMethod === opt.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="pay"
                      value={opt.id}
                      checked={payMethod === opt.id}
                      onChange={() => { setPayMethod(opt.id); setApiError(''); }}
                    />
                    <span className="pay-icon">{opt.icon}</span>
                    <div className="pay-info">
                      <div className="pay-label-row">
                        <b>{opt.label}</b>
                        {opt.badge && <span className="pay-badge">{opt.badge}</span>}
                      </div>
                      <small>{opt.subtext}</small>
                      {opt.tags && (
                        <div className="pay-tags">
                          {opt.tags.map(t => <span key={t} className="pay-tag">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {payMethod === 'upi' && (
                <div className="upi-note">
                  <p><b>⚡ Fast & Direct:</b> Opens your UPI App (Google Pay, PhonePe, Paytm) on mobile, or shows a dynamic QR code to scan from your phone.</p>
                </div>
              )}
              {payMethod === 'card' && (
                <div className="upi-note">
                  <p>🔒 100% secure card & netbanking checkout powered by <b>Razorpay</b>.</p>
                </div>
              )}
              {payMethod === 'cod' && (
                <div className="upi-note">
                  <p>💵 Pay ₹{total} in cash upon delivery. Please keep exact change ready.</p>
                </div>
              )}

              <div className="order-amount-box">
                <span>Total Amount to Pay</span>
                <b>₹{total}</b>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="checkout-footer">
          {step < 2 ? (
            <button className="checkout-btn" onClick={nextStep}>
              {step === 0 ? 'Continue to Review' : 'Continue to Payment'}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="checkout-btn place-order-btn"
              onClick={placeOrder}
              disabled={loading}
            >
              {loading ? 'Processing Order...' : `✅ Confirm & Place Order · ₹${total}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── AuthModal (Login & Registration) ────────────────────────────────────── */

function AuthModal({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (isRegister && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await api.register(name.trim(), phone.trim(), password);
      } else {
        res = await api.login(phone.trim(), password);
      }
      if (res && res.user) {
        localStorage.setItem('cc_user', JSON.stringify(res.user));
        onSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay checkout-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <div className="auth-head">
          <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(''); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(''); }}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="field-error" style={{ marginBottom: 12, padding: '8px 12px', background: '#ffebee', borderRadius: 8 }}>
              <div>⚠️ {error}</div>
              {!isRegister && error.includes('Invalid phone or password') && (
                <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
                  New here?{' '}
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#e65b16', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    onClick={() => { setIsRegister(true); setError(''); }}
                  >
                    Switch to Register & create account
                  </button>
                </div>
              )}
            </div>
          )}

          {isRegister && (
            <Field label="Full Name">
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </Field>
          )}

          <Field label="10-digit Mobile Number">
            <input
              type="tel"
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              placeholder="Enter your password (min 6 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </Field>

          <button className="auth-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isRegister ? 'Sign Up' : 'Log In')}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Field helper ────────────────────────────────────────────────────────── */

function Field({ label, error, children }) {
  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

/* ─── Mount ───────────────────────────────────────────────────────────────── */

createRoot(document.getElementById('root')).render(<App />);
