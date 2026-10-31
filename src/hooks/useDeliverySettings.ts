import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeliverySettings {
  free_delivery_minimum: number;
  delivery_fee: number;
}

const DEFAULTS: DeliverySettings = {
  free_delivery_minimum: 1000,
  delivery_fee: 150,
};

export const useDeliverySettings = () => {
  return useQuery<DeliverySettings>({
    queryKey: ['site_settings', 'delivery_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'delivery_settings')
        .maybeSingle();

      if (error || !data?.value) return DEFAULTS;
      const v = data.value as Partial<DeliverySettings>;
      return {
        free_delivery_minimum: v.free_delivery_minimum ?? DEFAULTS.free_delivery_minimum,
        delivery_fee: v.delivery_fee ?? DEFAULTS.delivery_fee,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
};
