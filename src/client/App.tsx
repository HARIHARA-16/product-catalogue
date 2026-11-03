import { useEffect, useRef, useState } from 'react';
import {
  createBrowserRouter, RouterProvider, Outlet, Link, NavLink, Form,
  useLoaderData, useLocation, useNavigation, useRouteError, useSearchParams,
} from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Grid2X2, LoaderCircle, Mail, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CatalogueResult, Product } from '../shared/contracts';
import { api } from './api';
import { categoryName, ErrorState, money, ProductGrid, ProductImage, Rating } from './components';
import { EnquiryDialog } from './EnquiryDialog';

function Brand() {
  return <Link to="/" className="brand" aria-label="Form and Field home"><Grid2X2 size={26} strokeWidth={1.4} /><span>Form <i>&</i> Field<span className="brand-dot">.</span></span></Link>;
}

function Layout() {
  const { categories } = useLoaderData() as CatalogueResult;
  const navigation = useNavigation();
  const location = useLocation();
  const [params] = useSearchParams();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [location.pathname, location.search]);

  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <div className="topline"><span>THOUGHTFULLY SELECTED FOR EVERYDAY LIVING</span><span>THE COLLECTION <span className="topline-mark">/</span> EST. 2026</span></div>
    <header className="site-header">
      <div className="header-main container">
        <Brand />
        <Form action="/search" className="search-form" role="search" key={params.get('q') ?? ''}>
          <Search size={18} aria-hidden="true" />
          <input name="q" type="search" aria-label="Search products" placeholder="Search products by name or category" defaultValue={params.get('q') ?? ''} maxLength={200} required />
          <button type="submit" className="icon-button search-submit" aria-label="Search" title="Search"><ArrowRight size={19} /></button>
        </Form>
        <span className="header-note">Considered pieces for everyday living</span>
      </div>
      <nav className="category-nav container" aria-label="Product categories">
        <NavLink to="/" end>All products</NavLink>
        {categories.map((category) => <NavLink key={category} to={`/category/${encodeURIComponent(category)}`}>{categoryName(category)}</NavLink>)}
        <span className="nav-caption"><span className="status-dot" />THE COLLECTION</span>
      </nav>
    </header>
    {navigation.state !== 'idle' && <div className="loading-bar" role="status"><LoaderCircle className="spin" size={16} />Loading products...</div>}
    <main id="main" className="container"><Outlet /></main>
    <footer className="site-footer container"><Brand /><p>Thoughtful products for everyday living.</p><span>Form & Field / 2026</span></footer>
  </>;
}

function CataloguePage() {
  const data = useLoaderData() as CatalogueResult;
  const location = useLocation();
  const [params] = useSearchParams();
  const isSearch = location.pathname === '/search';
  const isCategory = location.pathname.startsWith('/category/');
  const category = isCategory ? decodeURIComponent(location.pathname.slice('/category/'.length)) : '';
  const term = params.get('q')?.trim() ?? '';
  const [sort, setSort] = useState('original');
  const featuredIds = new Set(data.featured.map((product) => product.id));
  const remaining = data.products.filter((product) => !featuredIds.has(product.id));
  const sorted = [...remaining].sort((first, second) => {
    if (sort === 'price-low') return first.price - second.price;
    if (sort === 'price-high') return second.price - first.price;
    if (sort === 'rating') return second.rating.rate - first.rating.rate;
    return 0;
  });
  const title = isSearch ? 'Search results' : isCategory ? categoryName(category) : 'The collection';

  useEffect(() => { document.title = `${title} | Form & Field`; }, [title]);

  return <>
    <section className="collection-heading">
      <div><div className="eyebrow"><span className="tiny-line" />{isSearch ? 'A closer look' : isCategory ? 'A different perspective' : 'Form & Field / The everyday edit'}</div>
        <h1>{title}<span className="accent-dot">.</span></h1>
        <p>{isSearch ? <>Products matching <strong>"{term}"</strong></> : isCategory ? `Explore our ${categoryName(category).toLowerCase()} selection.` : 'Explore a considered selection of products for everyday living.'}</p>
      </div>
      <span className="collection-counter"><span>{String(data.products.length).padStart(2, '0')}</span>{isSearch ? 'MATCHING PRODUCTS' : 'PRODUCTS IN THE COLLECTION'}</span>
    </section>

    {data.featured.length > 0 && <section className="featured-section" aria-labelledby="featured-title">
      <div className="section-heading"><h2 id="featured-title">{isCategory ? 'Top-rated products' : 'Featured products'}<span className="small-badge">{String(data.featured.length).padStart(2, '0')}</span></h2><span className="section-caption">{isCategory ? 'HIGHEST RATED IN THIS CATEGORY' : 'OUR EDITORIAL SELECTION'}</span></div>
      <ProductGrid products={data.featured} featured />
    </section>}

    <section className="all-products" aria-labelledby="products-title">
      <div className="section-heading products-toolbar"><h2 id="products-title">{isSearch ? 'Matching products' : isCategory ? `More in ${categoryName(category)}` : 'Explore the collection'}<span className="result-count">{remaining.length}</span></h2>
        {remaining.length > 1 && <label className="sort-control"><SlidersHorizontal size={15} /><span className="sr-only">Sort products</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="original">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Highest rated</option></select></label>}
      </div>
      {sorted.length ? <ProductGrid products={sorted} /> : <div className="empty-state">
        <Search size={32} strokeWidth={1.2} />
        <h2>{isSearch ? 'No products found.' : 'You have viewed all products in this collection.'}</h2>
        {isSearch && <><p>We couldn’t find products matching "{term}". Try another search.</p><Link to="/" className="text-link">Clear search <X size={15} /></Link></>}
      </div>}
    </section>
    {!isSearch && <div className="collection-end"><span className="tiny-line" /><p>Thoughtful choices for everyday living.</p><ArrowUpRight size={20} /></div>}
  </>;
}

function ProductPage() {
  const product = useLoaderData() as Product;
  const [enquiring, setEnquiring] = useState(false);
  const enquiryTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { document.title = `${product.title} | Form & Field`; }, [product.title]);

  return <>
    <div className="breadcrumbs"><Link to="/">All products</Link><span>/</span><Link to={`/category/${encodeURIComponent(product.category)}`}>{categoryName(product.category)}</Link><span>/</span><span>Product {String(product.id).padStart(2, '0')}</span></div>
    <section className="product-detail">
      <div className="detail-image"><span className="detail-object-number">PRODUCT / {String(product.id).padStart(2, '0')}</span><ProductImage product={product} eager /></div>
      <div className="detail-content">
        <Link className="eyebrow text-link" to={`/category/${encodeURIComponent(product.category)}`}>{categoryName(product.category)}<ArrowUpRight size={14} /></Link>
        <h1>{product.title}</h1>
        <Rating product={product} />
        <p className="detail-price">{money(product.price)} <span>USD</span></p>
        <div className="detail-description"><h2>Product details</h2><p>{product.description}</p></div>
        <button ref={enquiryTrigger} className="button primary full-width" onClick={() => setEnquiring(true)}><Mail size={18} />Enquire about this product<ArrowUpRight size={18} /></button>
        <Link className="back-link" to={`/category/${encodeURIComponent(product.category)}`}><ArrowLeft size={16} />Back to {categoryName(product.category).toLowerCase()}</Link>
      </div>
    </section>
    {enquiring && <EnquiryDialog product={product} onClose={() => {
      setEnquiring(false);
      enquiryTrigger.current?.focus();
    }} />}
  </>;
}

function RouteError() {
  const error = useRouteError();
  return <ErrorState message={error instanceof Error ? error.message : 'This page could not be loaded.'} />;
}

function RootError() {
  return <div className="container"><header className="error-header"><Brand /></header><RouteError /></div>;
}

const router = createBrowserRouter([{
  path: '/',
  element: <Layout />,
  loader: () => api.catalogue(),
  hydrateFallbackElement: <div className="initial-loading"><LoaderCircle className="spin" />Loading collection...</div>,
  errorElement: <RootError />,
  children: [
    { index: true, loader: () => api.catalogue(), element: <CataloguePage />, errorElement: <RouteError /> },
    { path: 'category/:category', loader: ({ params }) => api.catalogue({ category: params.category }), element: <CataloguePage />, errorElement: <RouteError /> },
    { path: 'search', loader: ({ request }) => api.catalogue({ q: new URL(request.url).searchParams.get('q')?.trim() || '' }), element: <CataloguePage />, errorElement: <RouteError /> },
    { path: 'products/:id', loader: ({ params }) => api.product(params.id!), element: <ProductPage />, errorElement: <RouteError /> },
    { path: '*', element: <ErrorState message="This page does not exist." /> },
  ],
}]);

export function App() {
  return <RouterProvider router={router} />;
}