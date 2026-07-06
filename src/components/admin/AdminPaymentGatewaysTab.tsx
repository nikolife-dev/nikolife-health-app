import { useEffect, useState } from 'react';
import funcUrls from '../../../backend/func2url.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import PromoCodesManager from './PromoCodesManager';

const API = funcUrls['payment-settings'];

interface GatewayField {
  key: string;
  label: string;
  secret: boolean;
  filled: boolean;
  value: string;
  masked: string;
}

interface Gateway {
  provider: string;
  title: string;
  status: 'active' | 'soon';
  is_enabled: boolean;
  fields: GatewayField[];
}

const PROVIDER_ICON: Record<string, string> = {
  tribute: 'Send',
  tbank: 'CreditCard',
  sberbank: 'Landmark',
  yoomoney: 'Wallet',
};

export default function AdminPaymentGatewaysTab() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [enabledDraft, setEnabledDraft] = useState<Record<string, boolean>>({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const loadGateways = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      const list: Gateway[] = data.gateways || [];
      setGateways(list);
      const en: Record<string, boolean> = {};
      list.forEach((g) => (en[g.provider] = g.is_enabled));
      setEnabledDraft(en);
      setDrafts({});
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить настройки', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGateways();
  }, []);

  const setFieldValue = (provider: string, key: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), [key]: value },
    }));
  };

  const handleSave = async (gateway: Gateway) => {
    setSavingProvider(gateway.provider);
    try {
      const settings: Record<string, string> = {};
      const draft = drafts[gateway.provider] || {};
      gateway.fields.forEach((f) => {
        if (f.key in draft) {
          settings[f.key] = draft[f.key];
        } else if (!f.secret) {
          settings[f.key] = f.value;
        }
      });

      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: gateway.provider,
          is_enabled: enabledDraft[gateway.provider] ?? gateway.is_enabled,
          settings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Сохранено', description: `Настройки «${gateway.title}» обновлены` });
        setGateways(data.gateways || []);
        setDrafts((prev) => ({ ...prev, [gateway.provider]: {} }));
      } else {
        throw new Error(data.error || 'Ошибка сохранения');
      }
    } catch (e) {
      toast({
        title: 'Ошибка',
        description: e instanceof Error ? e.message : 'Не удалось сохранить',
        variant: 'destructive',
      });
    } finally {
      setSavingProvider(null);
    }
  };

  return (
    <TabsContent value="payments" className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Icon name="Loader2" size={48} className="animate-spin text-[#748c6d]" />
        </div>
      ) : (
        gateways.map((gateway) => {
          const isSoon = gateway.status === 'soon';
          return (
            <Card key={gateway.provider} className="bg-white/80 backdrop-blur border-[#748c6d]/20">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#748c6d]/10 flex items-center justify-center">
                      <Icon name={PROVIDER_ICON[gateway.provider] || 'CreditCard'} size={22} className="text-[#748c6d]" />
                    </div>
                    <div>
                      <CardTitle className="text-[#748c6d] flex items-center gap-2">
                        {gateway.title}
                        {isSoon ? (
                          <Badge variant="secondary" className="text-xs">Скоро</Badge>
                        ) : gateway.is_enabled ? (
                          <Badge className="text-xs bg-green-500/10 text-green-700">Подключён</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs border-[#748c6d]/30">Не настроен</Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>

                  {!isSoon && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`en-${gateway.provider}`} className="text-sm text-[#4a5446]">
                        Активен
                      </Label>
                      <Switch
                        id={`en-${gateway.provider}`}
                        checked={enabledDraft[gateway.provider] ?? gateway.is_enabled}
                        onCheckedChange={(v) =>
                          setEnabledDraft((prev) => ({ ...prev, [gateway.provider]: v }))
                        }
                      />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isSoon ? (
                  <div className="rounded-lg border border-dashed border-[#748c6d]/30 bg-[#748c6d]/5 px-4 py-6 text-center">
                    <Icon name="Clock" size={28} className="mx-auto mb-2 text-[#748c6d]/60" />
                    <p className="text-sm text-[#4a5446]/70">
                      Интеграция «{gateway.title}» скоро будет доступна
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {gateway.fields.map((f) => {
                        const draftVal = drafts[gateway.provider]?.[f.key];
                        return (
                          <div key={f.key} className="space-y-2">
                            <Label className="text-sm text-[#4a5446]">
                              {f.label}
                              {f.filled && f.secret && (
                                <span className="ml-2 text-xs text-green-600">сохранено: {f.masked}</span>
                              )}
                            </Label>
                            <Input
                              type={f.secret ? 'password' : 'text'}
                              value={draftVal ?? (f.secret ? '' : f.value)}
                              placeholder={f.secret && f.filled ? 'Оставьте пустым, чтобы не менять' : f.label}
                              onChange={(e) => setFieldValue(gateway.provider, f.key, e.target.value)}
                              className="h-10"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSave(gateway)}
                        disabled={savingProvider === gateway.provider}
                        className="bg-[#748c6d] hover:bg-[#5a7052]"
                      >
                        {savingProvider === gateway.provider ? (
                          <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Icon name="Save" size={16} className="mr-2" />
                        )}
                        Сохранить
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      <PromoCodesManager />
    </TabsContent>
  );
}