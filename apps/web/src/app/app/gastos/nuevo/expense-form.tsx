'use client';

import { useRef, useState, useTransition } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@flowfinance/ui';
import { createExpenseAction, editExpenseAction } from '@/lib/expenses/actions';
import { classifyExpenseCategory } from '@/lib/expenses/classify';
import { scanReceiptAction } from '@/lib/expenses/ocr';
import { compressImageFile } from '@/lib/attachments/compress-image';

interface CategoryOption {
  id: string;
  name: string;
  groupName: string;
}

interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

interface CardOption {
  id: string;
  label: string;
  currency: string;
}

interface CurrencyOption {
  code: string;
}

export interface ExpenseInitialValues {
  id: string;
  merchant_name: string;
  description: string;
  amount: string;
  currency: string;
  transaction_date: string;
  category_id: string;
  payment_method: 'account' | 'card';
  account_id?: string;
  card_id?: string;
  receipt_url?: string;
}

export function ExpenseForm({
  categories,
  accounts,
  cards,
  currencies,
  error,
  initialValues,
}: {
  categories: CategoryOption[];
  accounts: AccountOption[];
  cards: CardOption[];
  currencies: CurrencyOption[];
  error?: string;
  initialValues?: ExpenseInitialValues;
}) {
  const isEditing = !!initialValues;

  const [merchantName, setMerchantName] = useState(initialValues?.merchant_name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [amount, setAmount] = useState(initialValues?.amount ?? '');
  const [currency, setCurrency] = useState(initialValues?.currency ?? 'USD');
  const [transactionDate, setTransactionDate] = useState(
    initialValues?.transaction_date ?? new Date().toISOString().slice(0, 10),
  );
  const [categoryId, setCategoryId] = useState(initialValues?.category_id ?? '');
  const [paymentMethod, setPaymentMethod] = useState<'account' | 'card'>(
    initialValues?.payment_method ?? 'account',
  );
  const [suggestion, setSuggestion] = useState<{ name: string; confidence: number } | null>(null);
  const [isClassifying, startClassifying] = useTransition();

  const [receiptPath, setReceiptPath] = useState(initialValues?.receipt_url ?? '');
  const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState('');
  const [isScanning, startScanning] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSuggestCategory() {
    const amountNum = Number(amount);
    if (!amountNum || (!merchantName && !description)) return;

    startClassifying(async () => {
      const result = await classifyExpenseCategory({
        merchant_name: merchantName || undefined,
        description: description || undefined,
        amount: amountNum,
        currency,
      });
      if (result) {
        setCategoryId(result.category_id);
        setSuggestion({ name: result.category_name, confidence: result.confidence });
      }
    });
  }

  function handleScanReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrError('');
    setOcrConfidence(null);

    startScanning(async () => {
      const compressed = await compressImageFile(file);
      const fd = new FormData();
      fd.append('receipt', compressed);

      const result = await scanReceiptAction(fd);
      if (!result.ok) {
        setOcrError(result.error);
        return;
      }

      const { data, receiptPath: path } = result;
      setReceiptPath(path);
      setOcrConfidence(data.confidence);
      if (data.merchant.name) setMerchantName(data.merchant.name);
      if (data.total > 0) setAmount(data.total.toFixed(2));
      if (data.currency) setCurrency(data.currency);
      if (data.date) setTransactionDate(data.date);
    });
  }

  const grouped = categories.reduce<Record<string, CategoryOption[]>>((acc, c) => {
    (acc[c.groupName] ??= []).push(c);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar gasto' : 'Nuevo gasto'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Corrige los datos de este gasto'
            : 'Registra un gasto — FINN puede leer tu recibo y sugerir la categoría'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="rounded-md border border-ff-red/30 bg-ff-red/10 px-4 py-3 text-sm text-ff-red">
            {error}
          </p>
        )}

        <div className="space-y-2 rounded-md border border-border bg-card p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanReceipt}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
          >
            {isScanning ? 'Leyendo recibo...' : '📷 Escanear recibo'}
          </Button>
          {ocrConfidence !== null && (
            <p className="text-xs text-ff-green">
              ✓ Recibo leído ({Math.round(ocrConfidence * 100)}% confianza) — revisa los campos antes de
              guardar
            </p>
          )}
          {ocrError && <p className="text-xs text-ff-red">{ocrError}</p>}
        </div>

        <form action={isEditing ? editExpenseAction : createExpenseAction} className="space-y-4">
          {isEditing && <input type="hidden" name="expense_id" value={initialValues.id} />}
          <input type="hidden" name="payment_method" value={paymentMethod} />
          <input type="hidden" name="receipt_url" value={receiptPath || ''} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Moneda</Label>
              <select
                id="currency"
                name="currency"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="merchant_name">Comercio</Label>
            <Input
              id="merchant_name"
              name="merchant_name"
              placeholder="Super Selectos, Starbucks..."
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="¿En qué gastaste?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggestCategory}
              disabled={isClassifying || (!merchantName && !description) || !amount}
            >
              {isClassifying ? 'Consultando FINN...' : '✨ Sugerir categoría con IA'}
            </Button>
            {suggestion && (
              <p className="text-xs text-muted-foreground">
                FINN sugiere: <span className="text-ff-green">{suggestion.name}</span> (
                {Math.round(suggestion.confidence * 100)}% confianza)
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoría</Label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Sin categoría</option>
              {Object.entries(grouped).map(([group, cats]) => (
                <optgroup key={group} label={group}>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Método de pago</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('account')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
                  paymentMethod === 'account'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Cuenta
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                disabled={cards.length === 0}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  paymentMethod === 'card'
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground'
                }`}
              >
                Tarjeta de crédito
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {paymentMethod === 'account' ? (
              <div className="space-y-1.5">
                <Label htmlFor="account_id">Cuenta</Label>
                <select
                  id="account_id"
                  name="account_id"
                  required={paymentMethod === 'account'}
                  defaultValue={initialValues?.account_id}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="card_id">Tarjeta</Label>
                <select
                  id="card_id"
                  name="card_id"
                  required={paymentMethod === 'card'}
                  defaultValue={initialValues?.card_id}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="transaction_date">Fecha</Label>
              <Input
                id="transaction_date"
                name="transaction_date"
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          {paymentMethod === 'account' && accounts.length === 0 && (
            <p className="text-xs text-ff-red">
              No tienes cuentas activas. Crea una primero en Cuentas.
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              (paymentMethod === 'account' && accounts.length === 0) ||
              (paymentMethod === 'card' && cards.length === 0)
            }
          >
            {isEditing ? 'Guardar cambios' : 'Guardar gasto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
