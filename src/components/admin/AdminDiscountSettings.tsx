import { useState, useEffect } from 'react';
import { Percent, Tag, Save, X, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { callAdminData } from '@/lib/adminData';
import { toast } from 'sonner';

interface FlatDiscountSettings {
  enabled: boolean;
  percentage: number;
  banner_text: string;
}

interface DeliverySettings {
  free_delivery_minimum: number;
  delivery_fee: number;
}

const AdminDiscountSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [settings, setSettings] = useState<FlatDiscountSettings>({
    enabled: false,
    percentage: 0,
    banner_text: '',
  });
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>({
    free_delivery_minimum: 1000,
    delivery_fee: 150,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [discountRes, deliveryRes] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', 'flat_discount').maybeSingle(),
        supabase.from('site_settings').select('value').eq('key', 'delivery_settings').maybeSingle(),
      ]);

      if (discountRes.data?.value) {
        const value = discountRes.data.value as unknown as FlatDiscountSettings;
        setSettings({
          enabled: value.enabled || false,
          percentage: value.percentage || 0,
          banner_text: value.banner_text || '',
        });
      }
      if (deliveryRes.data?.value) {
        const v = deliveryRes.data.value as unknown as DeliverySettings;
        setDeliverySettings({
          free_delivery_minimum: v.free_delivery_minimum ?? 1000,
          delivery_fee: v.delivery_fee ?? 150,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelivery = async () => {
    setSavingDelivery(true);
    try {
      const { error } = await callAdminData({
        action: 'update_settings',
        key: 'delivery_settings',
        value: JSON.parse(JSON.stringify(deliverySettings)),
      });
      if (error) throw error;
      toast.success('Delivery settings saved');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save delivery settings');
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await callAdminData({
        action: 'update_settings',
        key: 'flat_discount',
        value: JSON.parse(JSON.stringify(settings))
      });

      if (error) throw error;
      toast.success('Discount settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save discount settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableDiscount = async () => {
    setSaving(true);
    try {
      const disabledSettings = { enabled: false, percentage: 0, banner_text: '' };
      const { error } = await callAdminData({
        action: 'update_settings',
        key: 'flat_discount',
        value: JSON.parse(JSON.stringify(disabledSettings))
      });

      if (error) throw error;
      setSettings(disabledSettings);
      toast.success('Flat discount disabled');
    } catch (error) {
      console.error('Error disabling discount:', error);
      toast.error('Failed to disable discount');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-3xl font-normal text-[#242024]">Discount Settings</h2>
        <p className="text-xs text-[#716b70] mt-0.5">Configure store-wide flat discounts and promotional banners</p>
      </div>

      {/* Flat Discount Card */}
      <Card className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#e8e3e5]/70 bg-[#faf7f5] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f5e6e8] text-[#a35d70]">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl font-normal text-[#242024]">Site-Wide Flat Discount</CardTitle>
              <CardDescription className="text-xs text-[#716b70] mt-0.5">
                Apply an automatic percentage discount to all products across your store
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6 py-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-[#e8e3e5] bg-[#f9f7f6]">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-[#a35d70]" />
              <div>
                <Label className="text-sm font-medium text-[#242024]">Enable Flat Discount</Label>
                <p className="text-xs text-[#716b70]">Display announcement banner and auto-apply discount</p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
            />
          </div>

          {/* Discount Percentage */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
              Discount Percentage (%)
            </Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={settings.percentage}
              onChange={(e) => setSettings({ ...settings, percentage: parseInt(e.target.value) || 0 })}
              className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20 max-w-xs"
              placeholder="e.g. 20"
            />
            <p className="text-xs text-[#9a9298]">Percentage deduction applied at checkout</p>
          </div>

          {/* Banner Text */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
              Banner Text
            </Label>
            <Textarea
              value={settings.banner_text}
              onChange={(e) => setSettings({ ...settings, banner_text: e.target.value })}
              className="rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] placeholder:text-[#b1a8ad] focus-visible:border-[#a35d70] focus-visible:ring-[#a35d70]/20"
              placeholder="e.g. 🎉 MEGA SALE! Flat 20% OFF on all items!"
              rows={2}
            />
            <p className="text-xs text-[#9a9298]">This text will appear in the top banner on the storefront</p>
          </div>

          {/* Preview */}
          {settings.enabled && settings.percentage > 0 && (
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                Banner Preview
              </Label>
              <div className="p-4 bg-[#242024] text-white rounded-xl text-center shadow-inner">
                <p className="font-medium text-sm sm:text-base">
                  {settings.banner_text || `🎉 Flat ${settings.percentage}% OFF on all products!`}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-[#e8e3e5]">
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="h-11 rounded-xl bg-[#242024] hover:bg-[#383238] text-white px-6 font-medium shadow-sm transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {settings.enabled && (
              <Button 
                variant="destructive"
                onClick={handleDisableDiscount}
                disabled={saving}
                className="h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 font-medium transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Disable Discount
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Settings */}
      <Card className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#e8e3e5]/70 bg-[#faf7f5] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#e3f0ea] text-[#186049]">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl font-normal text-[#242024]">Delivery Settings</CardTitle>
              <CardDescription className="text-xs text-[#716b70] mt-0.5">
                Set the minimum order amount for free delivery and the standard delivery fee
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                Free Delivery Above (Rs.)
              </Label>
              <Input
                type="number"
                min="0"
                value={deliverySettings.free_delivery_minimum}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, free_delivery_minimum: parseInt(e.target.value) || 0 })}
                className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] focus-visible:border-[#186049] focus-visible:ring-[#186049]/20"
                placeholder="e.g. 1000"
              />
              <p className="text-xs text-[#9a9298]">Orders above this amount get free delivery</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#716b70]">
                Standard Delivery Fee (Rs.)
              </Label>
              <Input
                type="number"
                min="0"
                value={deliverySettings.delivery_fee}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, delivery_fee: parseInt(e.target.value) || 0 })}
                className="h-11 rounded-xl border-[#d8cfd3] bg-white text-[#3f393e] focus-visible:border-[#186049] focus-visible:ring-[#186049]/20"
                placeholder="e.g. 150"
              />
              <p className="text-xs text-[#9a9298]">Fee charged when order is below the minimum</p>
            </div>
          </div>
          <div className="pt-2 border-t border-[#e8e3e5]">
            <Button
              onClick={handleSaveDelivery}
              disabled={savingDelivery}
              className="h-11 rounded-xl bg-[#186049] hover:bg-[#145240] text-white px-6 font-medium shadow-sm transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {savingDelivery ? 'Saving...' : 'Save Delivery Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Product Discounts Info */}
      <Card className="rounded-2xl border border-[#e8e3e5] bg-[#fffdfc] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#e8e3e5]/70 bg-[#faf7f5] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f5e6e8] text-[#a35d70]">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl font-normal text-[#242024]">Individual Product Discounts</CardTitle>
              <CardDescription className="text-xs text-[#716b70] mt-0.5">
                Set custom discounts on specific products from the Products tab
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="p-4 rounded-xl border border-[#e8e3e5] bg-[#f9f7f6]">
            <p className="text-[#3f393e] text-sm font-medium">
              To add a discount to a specific product:
            </p>
            <ol className="list-decimal list-inside text-[#716b70] text-xs mt-2 space-y-1.5 leading-relaxed">
              <li>Go to the <strong className="text-[#242024]">Products</strong> tab in the side menu</li>
              <li>Click the edit button on any product card or row</li>
              <li>Set the <strong className="text-[#242024]">Original Price</strong> (the price before discount)</li>
              <li>Set the <strong className="text-[#242024]">Discount %</strong> percentage</li>
              <li>The <strong className="text-[#242024]">Price</strong> field will calculate as the final discounted price</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDiscountSettings;
