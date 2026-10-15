import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAllCategories, type Category } from '@/hooks/useCategories';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const emptyForm = {
  name: '',
  slug: '',
  image_url: '',
  sort_order: '0',
  is_active: true,
};

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const { data: categories = [], isLoading } = useAllCategories();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  // ── Image Upload ────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Open Dialog ─────────────────────────────────────────────────
  const openDialog = (cat?: Category) => {
    if (cat) {
      setEditing(cat);
      setForm({
        name: cat.name,
        slug: cat.slug,
        image_url: cat.image_url || '',
        sort_order: String(cat.sort_order),
        is_active: cat.is_active,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setIsDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({
      ...f,
      name,
      // Auto-fill slug only when creating new
      ...(editing ? {} : { slug: slugify(name) }),
    }));
  };

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      image_url: form.image_url || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        toast.success('Category added');
      }
      setIsDialogOpen(false);
      refresh();
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (cat: Category) => {
    if (!confirm(`Delete "${cat.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      toast.success('Category deleted');
      refresh();
    }
  };

  // ── Toggle Active ───────────────────────────────────────────────
  const toggleActive = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !cat.is_active, updated_at: new Date().toISOString() })
      .eq('id', cat.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      refresh();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-[#a35d70]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">
            Store management
          </p>
          <h2 className="mt-1 font-serif text-3xl text-[#242024]">Categories</h2>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-[#a35d70] hover:bg-[#8f4f60] text-white rounded-xl px-5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>

          {/* ── Dialog ── */}
          <DialogContent className="max-w-lg rounded-2xl border-[#e8e3e5] bg-[#fffdfc] p-0 text-[#3f393e] shadow-2xl">
            <DialogHeader className="border-b border-[#e8e3e5] bg-[#f4f0ed] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">
                {editing ? 'Edit category' : 'New category'}
              </p>
              <DialogTitle className="mt-1 font-serif text-2xl font-normal text-[#242024]">
                {editing ? editing.name : 'Add Category'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Category Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Fresh Vegetables"
                  className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Slug * <span className="normal-case font-normal text-[#9a9298]">(used in URL & product filter)</span>
                </Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="e.g. fresh-vegetables"
                  className="h-11 rounded-xl border-[#d8cfd3] bg-white font-mono text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                />
              </div>

              {/* Image */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Category Image
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border-[#d8cfd3] text-[#716b70] hover:bg-[#f4f0ed]"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {uploading ? 'Uploading…' : 'Upload Image'}
                  </Button>

                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt="preview"
                      className="h-12 w-12 rounded-full object-cover border border-[#e8e3e5]"
                    />
                  )}
                </div>

                {/* Or paste URL */}
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="Or paste image URL…"
                  className="h-10 rounded-xl border-[#d8cfd3] bg-[#f4f0ed] text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                />
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                    Sort Order
                  </Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                    className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex items-center justify-between w-full rounded-xl border border-[#e8e3e5] bg-[#f4f0ed] px-4 py-3">
                    <Label className="text-sm font-medium text-[#4e484d]">Active</Label>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-[#e8e3e5] pt-5">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl border-[#d8cfd3] text-[#716b70] hover:bg-[#f4f0ed]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!form.name || !form.slug}
                  className="rounded-xl bg-[#a35d70] px-6 text-white hover:bg-[#8f4f60]"
                >
                  {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Category Grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {categories.map((cat) => (
          <Card
            key={cat.id}
            className={`group relative overflow-hidden border transition-all ${
              cat.is_active
                ? 'border-[#e8e3e5] bg-[#fffdfc]'
                : 'border-dashed border-slate-600 bg-slate-800/40 opacity-60'
            }`}
          >
            <CardContent className="p-3">
              {/* Image */}
              <div className="mx-auto mb-3 aspect-square w-full max-w-[80px] overflow-hidden rounded-full bg-[#eee9eb]">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-[#c0b5ba]">
                    🏷️
                  </div>
                )}
              </div>

              {/* Name + slug */}
              <p className="text-center text-[11px] font-semibold text-[#3f393e] leading-tight">
                {cat.name}
              </p>
              <p className="mt-0.5 text-center font-mono text-[9px] text-[#9a9298]">
                /{cat.slug}
              </p>

              {/* Badges */}
              <div className="mt-2 flex justify-center gap-1 flex-wrap">
                {cat.is_active ? (
                  <Badge variant="outline" className="border-green-500 text-green-500 text-[9px] px-1.5 py-0">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-400 text-red-400 text-[9px] px-1.5 py-0">
                    Hidden
                  </Badge>
                )}
              </div>

              {/* Action buttons — visible on hover */}
              <div className="mt-3 flex gap-1.5">
                <button
                  onClick={() => toggleActive(cat)}
                  title={cat.is_active ? 'Hide category' : 'Show category'}
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-[#f4dfe3] hover:text-[#8f4f60] transition-colors"
                >
                  {cat.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => openDialog(cat)}
                  title="Edit"
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-[#f4dfe3] hover:text-[#8f4f60] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  title="Delete"
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-16 text-[#9a9298]">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-medium">No categories yet</p>
            <p className="text-sm">Click "Add Category" to create your first one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
