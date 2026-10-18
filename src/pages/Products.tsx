import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useProducts } from '@/hooks/useProducts';
import { categories } from '@/data/products'; // Keep categories static for now or fetch later
import { Loader2 } from 'lucide-react';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'best-selling';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products = [], isLoading } = useProducts();

  const categoryParam = searchParams.get('category');
  const filterParam = searchParams.get('filter');
  const queryParam = searchParams.get('search');

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );

  // Sync state with URL parameter changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    } else {
      setSelectedCategories([]);
    }
  }, [categoryParam]);

  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [showDiscounted, setShowDiscounted] = useState(false);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (queryParam) {
      const q = queryParam.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }

    // Special filters
    if (filterParam === 'top-selling') {
      filtered = filtered.filter((p) => p.isTopSelling);
    } else if (filterParam === 'exclusive') {
      filtered = filtered.filter((p) => p.isExclusive);
    } else if (filterParam === 'promotional') {
      filtered = filtered.filter((p) => p.isPromotional);
    }

    // Price filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Discounted filter
    if (showDiscounted) {
      filtered = filtered.filter((p) => p.discountPercentage);
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-selling':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedCategories, priceRange, showDiscounted, sortBy, filterParam, queryParam, products]);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange([0, 30000]);
    setShowDiscounted(false);
    setSearchParams({});
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="text-sm">
                {category.icon} {category.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={30000}
          step={500}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-ink-muted">
          <span>₨{priceRange[0]}</span>
          <span>₨{priceRange[1]}</span>
        </div>
      </div>

      {/* Discounted */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <Checkbox
            checked={showDiscounted}
            onCheckedChange={(checked) => setShowDiscounted(checked as boolean)}
          />
          <span className="text-sm">Only discounted items</span>
        </label>
      </div>

      {/* Clear filters */}
      <Button variant="outline" onClick={clearFilters} className="w-full rounded-pill border-hairline text-ink-muted hover:text-ink hover:border-ink">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-[#fffdfc] px-4 pb-24 pt-[50px] md:px-8 md:pb-20 md:pt-24 lg:pt-36">
        <div className="mx-auto max-w-[1440px]">
        {/* <section className="mb-8 border-b border-[#e8e3e5] pb-8 md:mb-10 md:pb-10">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#186049]">The HAMAASH shop</p>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl leading-none text-[#242024] md:text-6xl">
            {filterParam === 'top-selling'
              ? 'Top Selling Products'
              : filterParam === 'exclusive'
              ? 'Exclusive Products'
              : filterParam === 'promotional'
              ? 'Special Offers'
              : categoryParam
              ? categories.find((c) => c.id === categoryParam)?.name || 'Products'
              : queryParam
              ? `Search Results for "${queryParam}"`
              : 'All Products'}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#777077]">Everyday essentials, considered finds, and fresh picks for the way you live.</p>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a9298]">{filteredProducts.length} products</span>
          </div>
        </section> */}

        <div className="w-full">
            {/* Toolbar */}
            <div className="mb-6 flex flex-wrap items-center justify-start gap-3 border-b border-[#e8e3e5] pb-6">
              {/* Active filters */}
              <div className="order-2 flex flex-wrap gap-2">
                {selectedCategories.map((catId) => (
                  <Badge
                    key={catId}
                    className="cursor-pointer bg-primary-subtle text-primary border border-primary/20 rounded-pill text-xs px-3 py-1.5 hover:bg-primary/20"
                    onClick={() => toggleCategory(catId)}
                  >
                    {categories.find((c) => c.id === catId)?.name} ×
                  </Badge>
                ))}
                {showDiscounted && (
                  <Badge
                    className="cursor-pointer bg-primary-subtle text-primary border border-primary/20 rounded-pill text-xs px-3 py-1.5 hover:bg-primary/20"
                    onClick={() => setShowDiscounted(false)}
                  >
                    Discounted ×
                  </Badge>
                )}
              </div>

              <div className="order-1 flex flex-wrap items-center gap-3">
                <Select
                  value={selectedCategories[0] || 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedCategories([]);
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.delete('category');
                      setSearchParams(nextParams);
                    } else {
                      setSelectedCategories([value]);
                      setSearchParams({ category: value });
                    }
                  }}
                >
                  <SelectTrigger className="h-10 w-44 rounded-full border-[#d8cfd3] bg-white text-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-[#186049]" />
                      <SelectValue placeholder="Filter by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mobile filter button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden rounded-pill border-hairline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="border-r-[#e8e3e5] bg-[#fffdfc]">
                    <SheetHeader>
                    <SheetTitle className="font-serif text-3xl font-normal text-[#242024]">Filter by</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-10 w-44 rounded-full border-[#d8cfd3] bg-white text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="best-selling">Best Selling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              {selectedCategories.map((catId) => (
                <Badge key={catId} className="rounded-full border border-[#186049]/40 bg-[#e3f0ea] px-3 py-1.5 text-[10px] font-medium text-[#186049]">
                  {categories.find((c) => c.id === catId)?.name}
                  <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => toggleCategory(catId)} />
                </Badge>
              ))}
            </div>

            {/* Products grid */}
            {isLoading ? (
              <div className="flex justify-center p-16 w-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 xl:grid-cols-5 md:gap-x-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <p className="mb-6 text-lg text-[#777077]">
                  No products found matching your filters
                </p>
                <Button variant="outline" onClick={clearFilters} className="rounded-full border-[#d8cfd3]">
                  Clear Filters
                </Button>
              </div>
            )}
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
