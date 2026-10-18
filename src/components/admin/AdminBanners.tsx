import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, ImagePlus } from 'lucide-react';
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
import { useAllBanners, type Banner } from '@/hooks/useBanners';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const emptyForm = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  sort_order: '0',
  is_active: true,
};

const AdminBanners = () => {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading } = useAllBanners();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['banners'] });
  };

  // ── Image Upload ────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success('Banner image uploaded');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Open Dialog ─────────────────────────────────────────────────
  const openDialog = (banner?: Banner) => {
    if (banner) {
      setEditing(banner);
      setForm({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        image_url: banner.image_url,
        link_url: banner.link_url || '',
        sort_order: String(banner.sort_order),
        is_active: banner.is_active,
      });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setIsDialogOpen(true);
  };

  // ── Save ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.image_url.trim()) {
      toast.error('Please upload a banner image');
      return;
    }

    const payload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Banner updated');
      } else {
        const { error } = await supabase.from('banners').insert(payload);
        if (error) throw error;
        toast.success('Banner added');
      }
      setIsDialogOpen(false);
      refresh();
    } catch (err: any) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    }
  };

  // ── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (banner: Banner) => {
    if (!confirm('Delete this banner? This cannot be undone.')) return;
    const { error } = await supabase.from('banners').delete().eq('id', banner.id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      toast.success('Banner deleted');
      refresh();
    }
  };

  // ── Toggle Active ───────────────────────────────────────────────
  const toggleActive = async (banner: Banner) => {
    const { error } = await supabase
      .from('banners')
      .update({ is_active: !banner.is_active, updated_at: new Date().toISOString() })
      .eq('id', banner.id);
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
            Storefront
          </p>
          <h2 className="mt-1 font-serif text-3xl text-[#242024]">Banners</h2>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => openDialog()}
              className="bg-[#a35d70] hover:bg-[#8f4f60] text-white rounded-xl px-5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>

          {/* ── Dialog ── */}
          <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-[#e8e3e5] bg-[#fffdfc] p-0 text-[#3f393e] shadow-2xl">
            <DialogHeader className="border-b border-[#e8e3e5] bg-[#f4f0ed] px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a35d70]">
                {editing ? 'Edit banner' : 'New banner'}
              </p>
              <DialogTitle className="mt-1 font-serif text-2xl font-normal text-[#242024]">
                {editing ? editing.title || 'Banner' : 'Add Banner'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-6">
              {/* Image */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Banner Image *
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt="Banner preview"
                    className="w-full aspect-[16/6] rounded-xl object-cover border border-[#e8e3e5]"
                  />
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-[#d8cfd3] text-[#716b70] hover:bg-[#f4f0ed]"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ImagePlus className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Uploading…' : form.image_url ? 'Replace Image' : 'Upload Image'}
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Title <span className="normal-case font-normal text-[#9a9298]">(optional)</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Fresh picks, better prices"
                  className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                />
              </div>

              {/* Subtitle */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Subtitle <span className="normal-case font-normal text-[#9a9298]">(optional)</span>
                </Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  placeholder="e.g. New season"
                  className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
                />
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                  Link <span className="normal-case font-normal text-[#9a9298]">(optional, e.g. /products)</span>
                </Label>
                <Input
                  value={form.link_url}
                  onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="/products?filter=promotional"
                  className="h-11 rounded-xl border-[#d8cfd3] bg-white font-mono text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
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
                  disabled={uploading || !form.image_url}
                  className="rounded-xl bg-[#a35d70] px-6 text-white hover:bg-[#8f4f60]"
                >
                  {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Banner List ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {banners.map((banner) => (
          <Card
            key={banner.id}
            className={`group relative overflow-hidden border transition-all ${
              banner.is_active
                ? 'border-[#e8e3e5] bg-[#fffdfc]'
                : 'border-dashed border-slate-600 bg-slate-800/40 opacity-60'
            }`}
          >
            <CardContent className="p-3">
              <img
                src={banner.image_url}
                alt={banner.title || 'Banner'}
                className="w-full aspect-[16/6] rounded-lg object-cover bg-[#eee9eb]"
              />

              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-[#3f393e]">
                    {banner.title || 'Untitled banner'}
                  </p>
                  {banner.link_url && (
                    <p className="truncate font-mono text-[9px] text-[#9a9298]">{banner.link_url}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                    #{banner.sort_order}
                  </Badge>
                  {banner.is_active ? (
                    <Badge variant="outline" className="border-green-500 text-green-500 text-[9px] px-1.5 py-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-400 text-red-400 text-[9px] px-1.5 py-0">
                      Hidden
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex gap-1.5">
                <button
                  onClick={() => toggleActive(banner)}
                  title={banner.is_active ? 'Hide banner' : 'Show banner'}
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-[#f4dfe3] hover:text-[#8f4f60] transition-colors"
                >
                  {banner.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => openDialog(banner)}
                  title="Edit"
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-[#f4dfe3] hover:text-[#8f4f60] transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(banner)}
                  title="Delete"
                  className="flex-1 flex items-center justify-center h-7 rounded-lg bg-[#f4f0ed] text-[#716b70] hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        {banners.length === 0 && (
          <div className="col-span-full text-center py-16 text-[#9a9298]">
            <p className="text-4xl mb-3">🖼️</p>
            <p className="font-medium">No banners yet</p>
            <p className="text-sm">Click "Add Banner" to upload your first one. Until then the home page shows product images.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBanners;
