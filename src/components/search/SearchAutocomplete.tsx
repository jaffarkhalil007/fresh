import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';

interface SearchAutocompleteProps {
  className?: string;
  onClose?: () => void;
  showClearButton?: boolean;
}

const SearchAutocomplete = ({ className, onClose, showClearButton = true }: SearchAutocompleteProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: products = [] } = useProducts();

  const filteredProducts = query.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            p.description?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    setIsOpen(filteredProducts.length > 0);
    setSelectedIndex(-1);
  }, [query, filteredProducts.length]);

  const handleSelect = (productId: string) => {
    navigate(`/product/${productId}`);
    setQuery('');
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
        handleSelect(filteredProducts[selectedIndex].id);
      } else if (query.trim()) {
        navigate(`/products?search=${encodeURIComponent(query)}`);
        setQuery('');
        setIsOpen(false);
        onClose?.();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search for household, kitchen, clothing..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(filteredProducts.length > 0)}
          className="pl-10 pr-10 h-10 w-full bg-muted border border-hairline focus-visible:ring-[#186049] focus-visible:border-[#186049] rounded-pill text-ink placeholder:text-ink-muted"
        />
        {query && showClearButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-ink-muted hover:text-ink"
            onClick={() => setQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-background border border-hairline rounded-lg shadow-dropdown overflow-hidden z-50"
          >
            <ul className="py-2">
              {filteredProducts.map((product, index) => (
                <li key={product.id}>
                  <button
                    onClick={() => handleSelect(product.id)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      index === selectedIndex ? 'bg-canvas-warm' : 'hover:bg-canvas-warm'
                    }`}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-10 h-10 rounded-sm object-contain bg-canvas-warm"
                      />
                    ) : (
                       <div className="w-10 h-10 rounded-sm bg-canvas-warm flex items-center justify-center"><Search className="h-4 w-4 text-ink-muted" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink truncate">{product.name}</p>
                      <p className="text-xs text-ink-muted capitalize">{product.category}</p>
                    </div>
                    <span className="text-[#186049] font-bold text-sm">₨ {product.price}</span>
                  </button>
                </li>
              ))}
              {query.trim() && (
                <li className="border-t border-hairline mt-2 pt-2">
                  <button
                    onClick={() => {
                      navigate(`/products?search=${encodeURIComponent(query)}`);
                      setQuery('');
                      setIsOpen(false);
                      onClose?.();
                    }}
                    className="w-full px-4 py-2 text-left text-[#186049] hover:bg-canvas-warm transition-colors text-sm"
                  >
                    Search for "{query}"...
                  </button>
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchAutocomplete;
