import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Plus, Pencil, Trash2, Search, UploadCloud, Image as ImageIcon, Loader2, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { callAdminData } from '@/lib/adminData';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { useAllCategories } from '@/hooks/useCategories';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount_percentage: number | null;
  delivery_fee: number | null;
  category: string;
  categories?: string[] | null;
  image_url: string | null;
  image_urls: string[] | null;
  stock_quantity: number;
  unit: string | null;
  is_top_selling: boolean | null;
  is_exclusive: boolean | null;
  is_promotional: boolean | null;
  is_active: boolean | null;
  specifications?: Record<string, string> | null;
}

interface SpecRow { key: string; value: string; }

interface VariantRow {
  id: string;
  name: string;
  price: string;
  image_url: string;
  stock_quantity: string;
  description: string;
  original_price: string;
  discount_percentage: string;
  specs: SpecRow[];
  uploading?: boolean;
}

const initialFormData = {
  name: '',
  description: '',
  price: '',
  original_price: '',
  discount_percentage: '',
  delivery_fee: '',
  category: '',
  categories: [] as string[],
  image_urls: [] as string[],
  stock_quantity: '',
  unit: '1 piece',
  is_top_selling: false,
  is_exclusive: false,
  is_promotional: false,
  is_active: true,
};

const AdminProducts = () => {
  const { getToken } = useAuth();
  const { data: categories = [] } = useAllCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [quickUploadProductId, setQuickUploadProductId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(
        `Failed to load products: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${Math.random()}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      setFormData((prev) => ({ ...prev, image_urls: [...prev.image_urls, ...uploadedUrls] }));
      toast.success(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded`);
    } catch (error: any) {
      console.error('Upload Error:', error);
      toast.error(
        `Image upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleVariantImageUpload = async (variantId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setVariantRows(prev => prev.map(v => v.id === variantId ? { ...v, uploading: true } : v));
    try {
      const ext = file.name.split('.').pop();
      const path = `variants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setVariantRows(prev => prev.map(v => v.id === variantId ? { ...v, image_url: data.publicUrl, uploading: false } : v));
      toast.success('Variant image uploaded');
    } catch {
      toast.error('Failed to upload variant image');
      setVariantRows(prev => prev.map(v => v.id === variantId ? { ...v, uploading: false } : v));
    }
  };

  const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickUploadProductId) return;

    const toastId = toast.loading('Uploading and linking image...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('products')
        .update({
          image_url: data.publicUrl,
          // Quick upload replaces the main picture and keeps the other pictures.
          image_urls: [data.publicUrl, ...(products.find((p) => p.id === quickUploadProductId)?.image_urls ?? []).slice(1)],
        })
        .eq('id', quickUploadProductId);

      if (updateError) throw updateError;
      
      toast.success('Image added successfully!', { id: toastId });
      fetchProducts(); // Refresh list to show new image
    } catch (error: any) {
      console.error('Quick Upload Error:', error);
      toast.error(
        `Image upload failed: ${error instanceof Error ? error.message : String(error)}`,
        { id: toastId }
      );
    } finally {
      setQuickUploadProductId(null);
      if (quickUploadRef.current) quickUploadRef.current.value = '';
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let newProducts: any[] = [];

      if (file.name.endsWith('.json')) {
        newProducts = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Super robust CSV parser to handle commas AND newlines inside quotes
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentCell = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
          } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && text[i+1] === '\n') i++;
            currentRow.push(currentCell.trim());
            if (currentRow.some(v => v !== '')) rows.push(currentRow);
            currentRow = [];
            currentCell = '';
          } else {
            currentCell += char;
          }
        }
        if (currentCell !== '' || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(v => v !== '')) rows.push(currentRow);
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        
        newProducts = rows.slice(1).map(rowValues => {
          const productRow: any = {};
          headers.forEach((header, index) => {
            let val: any = rowValues[index];
            if (val === 'TRUE' || val === 'true') val = true;
            else if (val === 'FALSE' || val === 'false') val = false;
            else if (!isNaN(Number(val)) && val !== undefined && val !== '') val = Number(val);
            else if (val === 'null' || val === '' || val === undefined) val = null;
            productRow[header] = val;
          });
          return productRow;
        });
      } else {
        throw new Error('Unsupported file format. Please upload .csv or .json');
      }

      if (newProducts.length === 0) {
        toast.error('File is empty or could not be parsed');
        return;
      }

      const { error } = await supabase
        .from('products')
        .insert(newProducts);

      if (error) throw error;
      
      toast.success(`Successfully uploaded ${newProducts.length} products!`);
      fetchProducts();
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to upload products: ' + (error.message || 'Check your file format.'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      const existingCategories = product.categories?.length
        ? product.categories
        : product.category ? [product.category] : [];
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        discount_percentage: product.discount_percentage?.toString() || '',
        delivery_fee: product.delivery_fee?.toString() || '',
        category: product.category,
        categories: existingCategories,
        image_urls: product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [],
        stock_quantity: product.stock_quantity.toString(),
        unit: product.unit || '1 piece',
        is_top_selling: product.is_top_selling || false,
        is_exclusive: product.is_exclusive || false,
        is_promotional: product.is_promotional || false,
        is_active: product.is_active ?? true,
      });
      const existingSpecs = product.specifications
        ? Object.entries(product.specifications).map(([key, value]) => ({ key, value }))
        : [];
      setSpecRows(existingSpecs);
      const existingVariants: VariantRow[] = ((product as any).variants || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        price: String(v.price),
        original_price: v.original_price != null ? String(v.original_price) : '',
        discount_percentage: v.discount_percentage != null ? String(v.discount_percentage) : '',
        specs: v.specifications ? Object.entries(v.specifications).map(([key, value]) => ({ key, value: String(value) })) : [],
        image_url: v.image_url || '',
        stock_quantity: v.stock_quantity != null ? String(v.stock_quantity) : '',
        description: v.description || '',
      }));
      setVariantRows(existingVariants);
    } else {
      setEditingProduct(null);
      setFormData(initialFormData);
      setSpecRows([]);
      setVariantRows([]);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (formData.stock_quantity.trim() === '') {
        toast.error('Enter a stock quantity. Use 0 only when the product is out of stock.');
        return;
      }

      const stockQuantity = Number(formData.stock_quantity);
      if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
        toast.error('Stock quantity must be a whole number greater than or equal to 0');
        return;
      }

      const selectedCategories = formData.categories.length > 0 ? formData.categories : formData.category ? [formData.category] : [];

      // Build specifications object from rows (skip blank keys)
      const specsObj = specRows.reduce<Record<string, string>>((acc, row) => {
        const k = row.key.trim();
        if (k) acc[k] = row.value.trim();
        return acc;
      }, {});

      const validVariants = variantRows
        .filter(v => v.name.trim() && v.price.trim())
        .map(v => {
          const specsObj = v.specs.reduce<Record<string, string>>((acc, row) => {
            const k = row.key.trim();
            if (k) acc[k] = row.value.trim();
            return acc;
          }, {});
          return {
            id: v.id,
            name: v.name.trim(),
            price: parseFloat(v.price),
            image_url: v.image_url || null,
            stock_quantity: v.stock_quantity.trim() ? parseInt(v.stock_quantity) : null,
            description: v.description.trim() || null,
            original_price: v.original_price.trim() ? parseFloat(v.original_price) : null,
            discount_percentage: v.discount_percentage.trim() ? parseFloat(v.discount_percentage) : null,
            specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
          };
        });

      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        discount_percentage: formData.discount_percentage ? parseInt(formData.discount_percentage) : null,
        delivery_fee: formData.delivery_fee ? parseInt(formData.delivery_fee) : null,
        // Primary category = first selected; categories = all selected
        category: selectedCategories[0] || formData.category,
        categories: selectedCategories,
        image_url: formData.image_urls[0] || null,
        image_urls: formData.image_urls,
        stock_quantity: stockQuantity,
        unit: formData.unit,
        specifications: Object.keys(specsObj).length > 0 ? specsObj : null,
        variants: validVariants.length > 0 ? validVariants : null,
        is_top_selling: formData.is_top_selling,
        is_exclusive: formData.is_exclusive,
        is_promotional: formData.is_promotional,
        is_active: formData.is_active,
      };

      if (editingProduct) {
          const { error } = await callAdminData({
            action: 'update_product',
            productId: editingProduct.id,
            productData,
          });

          if (error) throw error;
          toast.success('Product updated successfully');
        } else {
          const { error } = await callAdminData({
            action: 'create_product',
            productData,
          });
        if (error) throw error;
        toast.success('Product created successfully');
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await callAdminData({ action: 'delete_product', productId: id });

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you absolutely sure you want to DELETE ALL products? This action cannot be undone.')) return;

    // Optional double confirmation for safety
    if (!confirm('Final warning: Delete ALL products?')) return;

    try {
      const toastId = toast.loading('Deleting all products...');
      const { error } = await callAdminData({ action: 'delete_all_products' });

      if (error) throw error;
      toast.success('All products deleted successfully', { id: toastId });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast.error('Failed to delete products');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden input for quick row image uploads */}
      <input 
        type="file" 
        ref={quickUploadRef} 
        onChange={handleQuickImageUpload} 
        accept="image/*"
        className="hidden" 
      />

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Products</h2>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
            accept=".csv,.json"
            className="hidden" 
          />
          <Button 
            className="bg-red-600 hover:bg-red-700 text-foreground"
            onClick={handleDeleteAll}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Bulk Upload (.csv)
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-foreground w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-[#e8e3e5] bg-[#fffdfc] p-0 text-[#3f393e] shadow-2xl">
              <DialogHeader className="border-b border-[#e8e3e5] bg-[#f4f0ed] px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">
                  {editingProduct ? 'Catalog management' : 'Add to catalog'}
                </p>
                <DialogTitle className="mt-1 font-serif text-3xl font-normal text-[#242024]">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 px-6 py-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Fresh Organic Milk"
                      className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                      Categories * <span className="normal-case font-normal text-[#9a9298]">(select one or more)</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-11 w-full items-center justify-between rounded-xl border border-[#d8cfd3] bg-white px-3 text-sm text-[#3f393e] focus:outline-none focus:ring-2 focus:ring-[#a35d70]/20"
                        >
                          <span className={formData.categories.length === 0 ? 'text-[#b1a8ad]' : ''}>
                            {formData.categories.length === 0
                              ? 'Select categories'
                              : formData.categories.map(slug => categories.find(c => c.slug === slug)?.name || slug).join(', ')}
                          </span>
                          <ChevronDown className="h-4 w-4 text-[#9a9298]" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 space-y-2 max-h-60 overflow-y-auto">
                        {categories.map((cat) => {
                          const checked = formData.categories.includes(cat.slug);
                          return (
                            <div key={cat.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`cat-${cat.id}`}
                                checked={checked}
                                onCheckedChange={(val) => {
                                  const updated = val
                                    ? [...formData.categories, cat.slug]
                                    : formData.categories.filter((s) => s !== cat.slug);
                                  setFormData({
                                    ...formData,
                                    categories: updated,
                                    category: updated[0] || '',
                                  });
                                }}
                              />
                              <label htmlFor={`cat-${cat.id}`} className="text-sm text-[#3f393e] cursor-pointer">
                                {cat.name}
                              </label>
                            </div>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                    {formData.categories.length > 1 && (
                      <p className="text-[10px] text-[#9a9298]">Primary category: <strong>{categories.find(c => c.slug === formData.categories[0])?.name || formData.categories[0]}</strong></p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add a short description customers will see..."
                    className="min-h-28 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                  />
                </div>

                <div className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] p-4">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">Pricing</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#716b70]">Price (Rs.) *</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#716b70]">Original Price</Label>
                    <Input
                      type="number"
                      value={formData.original_price}
                      onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#716b70]">Discount %</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#716b70]">Delivery Fee (Rs.)</Label>
                    <Input
                      type="number"
                      value={formData.delivery_fee}
                      onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">Stock Quantity *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">Unit</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                      placeholder="e.g., 1 piece, Set of 6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">Product image</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#716b70] file:mr-3 file:rounded-lg file:border-0 file:bg-[#f4dfe3] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#8f4f60]"
                        disabled={isUploadingImage}
                      />
                      {isUploadingImage && <Loader2 className="mt-2 h-6 w-6 animate-spin text-[#a35d70]" />}
                    </div>
                    <p className="text-[10px] text-[#9a9298]">Select one or more pictures. The first one is the main picture.</p>
                    {formData.image_urls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {formData.image_urls.map((url, index) => (
                          <div key={url} className="relative">
                            <img src={url} alt={`Product image ${index + 1}`} className="h-20 w-20 rounded-xl border border-[#e8e3e5] object-cover shadow-sm" />
                            {index === 0 && (
                              <span className="absolute left-1 top-1 bg-[#a35d70] px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">Main</span>
                            )}
                            <button
                              type="button"
                              aria-label="Remove image"
                              onClick={() => setFormData({ ...formData, image_urls: formData.image_urls.filter((_, i) => i !== index) })}
                              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#242024] text-[11px] leading-none text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants */}
                <div className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">Product Variants</p>
                      <p className="mt-0.5 text-[10px] text-[#9a9298]">e.g. 3 Lens, 12 Lens — each variant has its own name, price and image</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVariantRows(prev => [...prev, { id: `v_${Date.now()}`, name: '', price: '', image_url: '', stock_quantity: '', description: '', original_price: '', discount_percentage: '', specs: [] }])}
                      className="flex items-center gap-1 rounded-lg bg-[#f4dfe3] px-3 py-1.5 text-[11px] font-semibold text-[#8f4f60] transition-colors hover:bg-[#f0cfd5]"
                    >
                      <Plus className="h-3 w-3" />
                      Add Variant
                    </button>
                  </div>
                  {variantRows.length === 0 && (
                    <p className="text-[11px] text-[#b1a8ad]">No variants. Leave empty if this product has no variants (single option).</p>
                  )}
                  <div className="space-y-3">
                    {variantRows.map((row, i) => (
                      <div key={row.id} className="rounded-xl border border-[#e8e3e5] bg-[#f9f7f6] p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          {/* Variant image */}
                          <label className="relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-[#d8cfd3] bg-white transition-colors hover:border-[#a35d70]">
                            {row.uploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-[#a35d70]" />
                            ) : row.image_url ? (
                              <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-[#c4b8be]" />
                            )}
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleVariantImageUpload(row.id, e)} disabled={row.uploading} />
                          </label>
                          <Input
                            value={row.name}
                            onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, name: e.target.value } : v))}
                            placeholder="Variant name (e.g. 3 Lens)"
                            className="h-9 flex-1 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70]"
                          />
                          <Input
                            type="number"
                            value={row.price}
                            onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, price: e.target.value } : v))}
                            placeholder="Price (Rs.)"
                            className="h-9 w-28 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70]"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={row.stock_quantity}
                            onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, stock_quantity: e.target.value } : v))}
                            placeholder="Stock"
                            className="h-9 w-20 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70]"
                          />
                          <button
                            type="button"
                            onClick={() => setVariantRows(prev => prev.filter((_, idx) => idx !== i))}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e8e3e5] text-[#9a9298] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <Input
                          value={row.description}
                          onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, description: e.target.value } : v))}
                          placeholder="Variant description (optional)"
                          className="h-9 w-full rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] text-xs"
                        />
                        {/* Original price & discount */}
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={row.original_price}
                            onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, original_price: e.target.value } : v))}
                            placeholder="Original price (for strikethrough)"
                            className="h-9 flex-1 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] text-xs"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={row.discount_percentage}
                            onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, discount_percentage: e.target.value } : v))}
                            placeholder="Discount % badge"
                            className="h-9 w-32 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] text-xs"
                          />
                        </div>
                        {/* Variant-level specs */}
                        <div className="space-y-1.5 rounded-lg border border-[#e8e3e5] bg-white p-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9a9298]">Specifications</span>
                            <button
                              type="button"
                              onClick={() => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, specs: [...v.specs, { key: '', value: '' }] } : v))}
                              className="text-[10px] font-semibold text-[#186049] hover:underline"
                            >+ Add</button>
                          </div>
                          {row.specs.map((spec, si) => (
                            <div key={si} className="flex gap-1.5">
                              <Input
                                value={spec.key}
                                onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, specs: v.specs.map((s, sj) => sj === si ? { ...s, key: e.target.value } : s) } : v))}
                                placeholder="Key"
                                className="h-7 flex-1 rounded-lg border-[#d8cfd3] bg-[#f9f7f6] text-[10px] text-[#3f393e] placeholder:text-[#b1a8ad]"
                              />
                              <Input
                                value={spec.value}
                                onChange={e => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, specs: v.specs.map((s, sj) => sj === si ? { ...s, value: e.target.value } : s) } : v))}
                                placeholder="Value"
                                className="h-7 flex-1 rounded-lg border-[#d8cfd3] bg-[#f9f7f6] text-[10px] text-[#3f393e] placeholder:text-[#b1a8ad]"
                              />
                              <button type="button" onClick={() => setVariantRows(prev => prev.map((v, idx) => idx === i ? { ...v, specs: v.specs.filter((_, sj) => sj !== si) } : v))} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9a9298] hover:text-rose-500">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {row.specs.length === 0 && <p className="text-[10px] text-[#c4b8be]">No specs for this variant</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">Specifications</p>
                    <button
                      type="button"
                      onClick={() => setSpecRows(prev => [...prev, { key: '', value: '' }])}
                      className="flex items-center gap-1 rounded-lg bg-[#f4dfe3] px-3 py-1.5 text-[11px] font-semibold text-[#8f4f60] transition-colors hover:bg-[#f0cfd5]"
                    >
                      <Plus className="h-3 w-3" />
                      Add Specification
                    </button>
                  </div>
                  {specRows.length === 0 && (
                    <p className="text-[11px] text-[#b1a8ad]">No specifications yet. Click "Add Specification" to add key-value pairs like Brand, RAM, Color, Warranty…</p>
                  )}
                  <div className="space-y-2">
                    {specRows.map((row, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Input
                          value={row.key}
                          onChange={e => setSpecRows(prev => prev.map((r, idx) => idx === i ? { ...r, key: e.target.value } : r))}
                          placeholder="e.g. Brand"
                          className="h-9 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                        />
                        <Input
                          value={row.value}
                          onChange={e => setSpecRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: e.target.value } : r))}
                          placeholder="e.g. Samsung"
                          className="h-9 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setSpecRows(prev => prev.filter((_, idx) => idx !== i))}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e8e3e5] text-[#9a9298] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-xl border border-[#e8e3e5] bg-[#f4f0ed] p-4">
                    <Label className="text-sm font-medium text-[#4e484d]">Top Selling</Label>
                    <Switch
                      checked={formData.is_top_selling}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_top_selling: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#e8e3e5] bg-[#f4f0ed] p-4">
                    <Label className="text-sm font-medium text-[#4e484d]">Exclusive</Label>
                    <Switch
                      checked={formData.is_exclusive}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_exclusive: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#e8e3e5] bg-[#f4f0ed] p-4">
                    <Label className="text-sm font-medium text-[#4e484d]">Promotional</Label>
                    <Switch
                      checked={formData.is_promotional}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_promotional: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[#e8e3e5] bg-[#f4f0ed] p-4">
                    <Label className="text-sm font-medium text-[#4e484d]">Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[#e8e3e5] pt-5">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl border-[#d8cfd3] text-[#716b70] hover:bg-[#f4f0ed]">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.name || !formData.price || formData.categories.length === 0} className="rounded-xl bg-[#a35d70] px-6 text-white hover:bg-[#8f4f60]">
                    {editingProduct ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Product</TableHead>
                <TableHead className="text-slate-300">Category</TableHead>
                <TableHead className="text-slate-300">Price</TableHead>
                <TableHead className="text-slate-300">Stock</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-slate-700">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover border border-slate-700"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-dashed border-slate-600 cursor-pointer hover:bg-slate-700 hover:border-emerald-500 transition-colors group"
                          onClick={() => {
                            setQuickUploadProductId(product.id);
                            quickUploadRef.current?.click();
                          }}
                          title="Click to add image"
                        >
                          <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.unit || 'Standard'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300 capitalize">
                    {product.categories?.length ? product.categories.join(', ') : product.category}
                  </TableCell>
                  <TableCell className="text-slate-300">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-slate-300">{product.stock_quantity}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {product.is_active ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="border-red-500 text-red-500">Inactive</Badge>
                      )}
                      {product.is_top_selling && (
                        <Badge className="bg-amber-500">Top</Badge>
                      )}
                      {product.is_exclusive && (
                        <Badge className="bg-purple-500">Exclusive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(product)}
                        className="text-slate-400 hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    No products found. Add your first product!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
