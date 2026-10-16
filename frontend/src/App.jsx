import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, Plus, Minus, X, ArrowRight, ShieldCheck, Truck, RotateCcw, Sparkles } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || '/api';
const money = (n) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(n || 0);

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ customerName: '', email: '', address: '' });
  const [notice, setNotice] = useState('');

const [authOpen, setAuthOpen] = useState(false);
const [authMode, setAuthMode] = useState('login');
const [authUser, setAuthUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem('shopsphere_user') || 'null');
  } catch {
    return null;
  }
});
const [authToken, setAuthToken] = useState(
  () => localStorage.getItem('shopsphere_token') || ''
);
const [authForm, setAuthForm] = useState({
  name: '',
  email: '',
  password: ''
});
const [authError, setAuthError] = useState('');
const [authLoading, setAuthLoading] = useState(false);


  async function loadProducts() {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category !== 'All') params.set('category', category);
      const res = await fetch(`${API}/products?${params}`);
      if (!res.ok) throw new Error('Could not load products');
      const data = await res.json();
      setProducts(data.items || []);
    } catch (e) { setError(`${e.message}. Check that the API and database are running.`); }
    finally { setLoading(false); }
  }
  useEffect(() => { const t = setTimeout(loadProducts, 250); return () => clearTimeout(t); }, [search, category]);

  const categories = ['All', 'Electronics', 'Fashion', 'Home'];
  const cartItems = useMemo(() => Object.entries(cart).map(([id, quantity]) => {
    const product = products.find(p => p.id === Number(id));
    return product ? { ...product, quantity } : null;
  }).filter(Boolean), [cart, products]);
  const count = Object.values(cart).reduce((sum, n) => sum + n, 0);
  const subtotal = cartItems.reduce((sum, p) => sum + p.price * p.quantity, 0);

  function updateCart(id, delta) {
    setCart(old => {
      const next = { ...old };
      const value = (next[id] || 0) + delta;
      if (value <= 0) delete next[id]; else next[id] = Math.min(value, 99);
      return next;
    });
  }

  async function handleAuth(e) {
  e.preventDefault();
  setAuthError('');
  setAuthLoading(true);

  try {
    const isRegister = authMode === 'register';

    const res = await fetch(
      `${API}/auth/${isRegister ? 'register' : 'login'}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isRegister
            ? {
                name: authForm.name.trim(),
                email: authForm.email.trim(),
                password: authForm.password
              }
            : {
                email: authForm.email.trim(),
                password: authForm.password
              }
        )
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || data.message || 'Authentication failed'
      );
    }

    if (isRegister) {
      setAuthMode('login');
      setAuthForm({
        name: '',
        email: authForm.email,
        password: ''
      });
      setAuthError('Registration successful! Please log in.');
      return;
    }

    if (!data.token || !data.user) {
      throw new Error('Login response did not include a token and user.');
    }

    localStorage.setItem('shopsphere_token', data.token);
    localStorage.setItem('shopsphere_user', JSON.stringify(data.user));

    setAuthToken(data.token);
    setAuthUser(data.user);
    setAuthOpen(false);
    setAuthForm({ name: '', email: '', password: '' });
    setNotice(`Welcome to ShopSphere, ${data.user.name}!`);
  } catch (err) {
    setAuthError(err.message);
  } finally {
    setAuthLoading(false);
  }
}

function logout() {
  localStorage.removeItem('shopsphere_token');
  localStorage.removeItem('shopsphere_user');
  setAuthToken('');
  setAuthUser(null);
  setNotice('You have logged out.');
}


  async function checkout(e) {
    e.preventDefault(); setNotice('');
    try {
      
const res = await fetch(`${API}/orders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken}`,
  },
  body: JSON.stringify({
    ...customer,
    items: cartItems.map(p => ({
      productId: p.id,
      quantity: p.quantity,
    })),
  }),
});

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      setNotice(`Order #${data.orderId} placed successfully. Total: ${money(data.total)}. This is a demo checkout; no payment was collected.`);
      setCart({}); setCheckoutOpen(false); setCartOpen(false); setCustomer({ customerName: '', email: '', address: '' });
      loadProducts();
    } catch (e) { setNotice(e.message); }
  }

  return <div className="app">
    <div className="announcement"><Sparkles size={14}/> Welcome to the new season — discover everyday essentials <span>Free delivery over LKR 15,000</span></div>
    <header className="header">
      <a className="brand" href="#"><span className="brand-mark">S</span><span>shop<span className="brand-light">sphere</span><small>THE EVERYDAY STORE</small></span></a>
      <nav><a href="#shop">Shop</a><a href="#benefits">Why ShopSphere</a></nav>
      <div className="header-actions">
        <label className="searchbox"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products"/></label>
        <button className="cart-button" onClick={() => setCartOpen(true)} aria-label="Open cart"><ShoppingBag size={19}/><span>Bag</span><b>{count}</b></button>
      {authUser ? (
  <div className="auth-header">
    <span>Hello, {authUser.name}</span>
    <button className="auth-link" onClick={logout}>Logout</button>
  </div>
) : (
  <button
    className="auth-link"
    onClick={() => {
      setAuthMode('login');
      setAuthError('');
      setAuthOpen(true);
    }}
  >
    Login / Register
  </button>
)}
      
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span/> CURATED FOR YOUR EVERYDAY</div>
          <h1>Good things.<br/><em>Better living.</em></h1>
          <p>Thoughtfully picked essentials for your work, your weekends, and everything in between.</p>
          <a className="primary-button" href="#shop">Explore collection <ArrowRight size={17}/></a>
          <div className="hero-proof"><div className="avatars"><i>J</i><i>M</i><i>A</i></div><span><strong>2,400+</strong> happy customers</span><span className="stars">★★★★★</span></div>
        </div>
        <div className="hero-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
          <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=85" alt="Minimal lifestyle sneakers"/>
          <div className="floating-card"><span className="floating-icon">✦</span><div><strong>Made for everyday</strong><small>Quality you can feel</small></div></div>
          <div className="hero-index">01 <span>/</span> 04</div>
        </div>
        <div className="hero-vertical">FIND YOUR EVERYDAY FAVOURITE</div>
      </section>

      <section className="trust-strip" id="benefits">
        <div><Truck/><span><strong>Reliable delivery</strong><small>Across Sri Lanka</small></span></div>
        <div><ShieldCheck/><span><strong>Secure by design</strong><small>Shop with confidence</small></span></div>
        <div><RotateCcw/><span><strong>Easy support</strong><small>We're here to help</small></span></div>
        <div className="trust-note">A LITTLE BETTER, EVERY DAY.</div>
      </section>

      <section className="catalog" id="shop">
        <div className="section-heading"><div><div className="eyebrow">THE COLLECTION</div><h2>Find your <em>favourites.</em></h2><p>Useful things, chosen with care.</p></div><div className="catalog-count">{products.length} ITEMS <span>↘</span></div></div>
        <div className="filter-row"><div className="category-tabs">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><span className="sort-label">NEW & NOTEWORTHY ↗</span></div>
        {loading ? <div className="state-box">Loading the collection…</div> : error ? <div className="state-box error">{error}<button onClick={loadProducts}>Try again</button></div> : products.length === 0 ? <div className="state-box">No products found. Try another search.</div> :
          <div className="product-grid">{products.map((p, i) => <article className="product-card" key={p.id}>
            <div className={`product-image tone-${i % 4}`}><span className="product-badge">{p.stock > 0 ? (i % 2 ? 'BESTSELLER' : 'EVERYDAY PICK') : 'SOLD OUT'}</span><img src={p.imageUrl} alt={p.name} onError={e => {e.currentTarget.style.display='none';}}/><button className="quick-add" disabled={p.stock < 1} onClick={() => { updateCart(p.id, 1); setNotice(`${p.name} added to your bag`); }}>{p.stock > 0 ? <><Plus size={16}/> Quick add</> : 'Out of stock'}</button></div>
            <div className="product-meta"><span>{p.category}</span><span className="stock">{p.stock} available</span></div><h3>{p.name}</h3><p className="product-description">{p.description}</p><div className="product-bottom"><strong>{money(p.price)}</strong><button onClick={() => { updateCart(p.id, 1); setNotice(`${p.name} added to your bag`); }} disabled={p.stock < 1} aria-label={`Add ${p.name} to cart`}><Plus size={18}/></button></div>
          </article>)}</div>}
      </section>
      <section className="newsletter"><div><div className="eyebrow">GOOD THINGS IN YOUR INBOX</div><h2>A little more <em>inspiration.</em></h2><p>New arrivals, useful finds, and occasional little surprises.</p></div><form onSubmit={e => {e.preventDefault(); setNotice('Thanks for subscribing! Newsletter delivery is not connected in this demo.'); e.currentTarget.reset();}}><input type="email" required placeholder="Your email address"/><button>Join the list <ArrowRight size={16}/></button></form></section>
    </main>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark">S</span><span>shop<span className="brand-light">sphere</span><small>THE EVERYDAY STORE</small></span></a><span>Thoughtful finds for everyday life.</span><span>© 2026 ShopSphere · DevOps learning project</span></footer>
{authOpen && (
  <div
    className="overlay"
    onClick={() => setAuthOpen(false)}
  >
    <div
      className="checkout-modal auth-modal"
      onClick={e => e.stopPropagation()}
    >
      <div className="drawer-head">
        <div>
          <span className="eyebrow">YOUR SHOPSPHERE ACCOUNT</span>
          <h2>
            {authMode === 'login' ? 'Welcome back.' : 'Create account.'}
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={() => setAuthOpen(false)}
          aria-label="Close authentication form"
        >
          <X />
        </button>
      </div>

      <div className="auth-tabs">
        <button
          className={authMode === 'login' ? 'active' : ''}
          onClick={() => {
            setAuthMode('login');
            setAuthError('');
          }}
        >
          Login
        </button>
        <button
          className={authMode === 'register' ? 'active' : ''}
          onClick={() => {
            setAuthMode('register');
            setAuthError('');
          }}
        >
          Register
        </button>
      </div>

      <form className="checkout-form" onSubmit={handleAuth}>
        {authMode === 'register' && (
          <label>
            Full name
            <input
              required
              minLength={2}
              maxLength={100}
              value={authForm.name}
              onChange={e =>
                setAuthForm({ ...authForm, name: e.target.value })
              }
              placeholder="Your name"
            />
          </label>
        )}

        <label>
          Email address
          <input
            type="email"
            required
            value={authForm.email}
            onChange={e =>
              setAuthForm({ ...authForm, email: e.target.value })
            }
            placeholder="you@example.com"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            required
            minLength={8}
            value={authForm.password}
            onChange={e =>
              setAuthForm({ ...authForm, password: e.target.value })
            }
            placeholder="At least 8 characters"
          />
        </label>

        {authError && (
          <p className="auth-message" role="status">{authError}</p>
        )}

        <button
          className="primary-button full"
          type="submit"
          disabled={authLoading}
        >
          {authLoading
            ? 'Please wait...'
            : authMode === 'login'
              ? 'Login to your account'
              : 'Create account'}
          {!authLoading && <ArrowRight size={17} />}
        </button>
      </form>
    </div>
  </div>
)}
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')}><X size={16}/></button></div>}
    {cartOpen && <div className="overlay" onClick={() => setCartOpen(false)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <em>({count})</em></h2></div><button className="icon-button" onClick={() => setCartOpen(false)}><X/></button></div>
      {cartItems.length === 0 ? <div className="empty-cart"><ShoppingBag size={34}/><h3>Your bag is taking a break.</h3><p>Find something lovely in the collection.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Continue shopping <ArrowRight size={16}/></button></div> :
      <><div className="cart-list">{cartItems.map(p => <div className="cart-item" key={p.id}><img src={p.imageUrl} alt=""/><div className="cart-item-info"><strong>{p.name}</strong><span>{money(p.price)}</span><div className="quantity"><button onClick={() => updateCart(p.id, -1)}><Minus size={13}/></button><span>{p.quantity}</span><button onClick={() => updateCart(p.id, 1)} disabled={p.quantity >= p.stock}><Plus size={13}/></button></div></div><button className="remove" onClick={() => setCart(old => {const n={...old}; delete n[p.id]; return n;})}><X size={16}/></button></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><small>Shipping and any applicable taxes are confirmed at checkout.</small><button className="primary-button full" onClick={() => {setCartOpen(false);setCheckoutOpen(true);}}>Continue to checkout <ArrowRight size={17}/></button></div></>}
    </aside></div>}

    {checkoutOpen && <div className="overlay" onClick={() => setCheckoutOpen(false)}><div className="checkout-modal" onClick={e => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">ALMOST YOURS</span><h2>Checkout <em>details.</em></h2></div><button className="icon-button" onClick={() => setCheckoutOpen(false)}><X/></button></div><p className="demo-warning">Demo checkout only — no card details or real payment are collected.</p><form onSubmit={checkout} className="checkout-form"><label>Full name<input required value={customer.customerName} onChange={e => setCustomer({...customer, customerName:e.target.value})} placeholder="Your name"/></label><label>Email address<input required type="email" value={customer.email} onChange={e => setCustomer({...customer, email:e.target.value})} placeholder="you@example.com"/></label><label>Shipping address<textarea required value={customer.address} onChange={e => setCustomer({...customer, address:e.target.value})} placeholder="Street, city, postal code"/></label><div className="checkout-total"><span>Order total</span><strong>{money(subtotal)}</strong></div><button className="primary-button full">Place demo order <ArrowRight size={17}/></button></form></div></div>}
  </div>;
}
export default App;
