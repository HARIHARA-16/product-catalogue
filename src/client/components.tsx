import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ImageOff, Star, RotateCcw } from 'lucide-react';
import type { Product } from '../shared/contracts';

export const categoryName = (category: string) => ({
  "men's clothing": 'Menswear',
  "women's clothing": 'Womenswear',
  jewelery: 'Jewellery',
  electronics: 'Electronics',
}[category] ?? category);

export const money = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

export function ProductImage({ product, eager = false }: { product: Product; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <div className="image-fallback" role="img" aria-label={`${product.title}: image unavailable`}><ImageOff size={28} /><span>Image unavailable</span></div>
    : <img src={product.image} alt={product.title} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}

export function Rating({ product }: { product: Product }) {
  return <span className="rating"><Star size={13} aria-hidden="true" /><span>{product.rating.rate.toFixed(1)}</span><span className="rating-count">({product.rating.count})</span></span>;
}

export function ProductGrid({ products, featured = false }: { products: Product[]; featured?: boolean }) {
  return <div className={`product-grid${featured ? ' featured-grid' : ''}`}>
    {products.map((product, index) => <article className="product-card" key={product.id}>
      <Link to={`/products/${product.id}`} className="product-link">
        <div className="product-image">
          {featured && <span className="pick-label">{String(index + 1).padStart(2, '0')} / FEATURED</span>}
          <ProductImage product={product} eager={featured} />
          <span className="product-open" aria-hidden="true"><ArrowUpRight size={18} /></span>
        </div>
        <div className="product-meta"><span>{categoryName(product.category)}</span><Rating product={product} /></div>
        <h3>{product.title}</h3>
        <div className="product-price">{money(product.price)} <span>USD</span></div>
      </Link>
    </article>)}
  </div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <section className="empty-state" role="alert">
    <span className="eyebrow">Unable to load this page</span>
    <h1>Something went wrong.</h1>
    <p>{message}</p>
    <button className="button primary" onClick={retry ?? (() => window.location.reload())}><RotateCcw size={16} />Try again</button>
    <Link to="/" className="text-link">Return to all products</Link>
  </section>;
}