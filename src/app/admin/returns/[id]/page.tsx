'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  InboxIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ReturnDetail {
  id: string;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  reason: string;
  refundAmount: number;
  adminNotes?: string;
  orderTotal?: number;
  orderPaymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  receivedAt?: string;
  refundedAt?: string;
  items: Array<{
    id: string;
    productId: string;
    productName?: string;
    quantity: number;
    price?: number;
    reason?: string;
    condition?: string;
  }>;
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

const statusLabels: Record<string, string> = {
  pending: 'Väntande',
  approved: 'Godkänd',
  rejected: 'Avslagen',
  received: 'Mottagen',
  refunded: 'Återbetald',
  cancelled: 'Avbruten',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  approved: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  received: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  refunded: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-[#343c39] dark:text-[#8A9A8A] dark:border-[#4a5552]',
};

const conditionLabels: Record<string, string> = {
  unopened: 'Oöppnad',
  opened: 'Öppnad',
  damaged: 'Skadad',
  defective: 'Defekt',
};

const conditionColors: Record<string, string> = {
  unopened: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  opened: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  damaged: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  defective: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

export default function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [returnData, setReturnData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  const fetchReturn = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch(`/api/admin/returns/${id}`);
      const data = await response.json();
      if (data.success) {
        setReturnData(data.data);
        setAdminNotes(data.data.adminNotes || '');
      } else {
        toast.error('Kunde inte ladda retur');
        setError(true);
      }
    } catch (err) {
      console.error('Failed to fetch return:', err);
      toast.error('Kunde inte ladda retur');
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReturn();
  }, [fetchReturn]);

  const handleAction = async (action: string, extraData?: Record<string, string>) => {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { action, ...extraData };
      if (adminNotes && action !== 'reject') {
        body.adminNotes = adminNotes;
      }

      const response = await fetch(`/api/admin/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setReturnData(data.data);
        setAdminNotes(data.data.adminNotes || '');
        setShowRejectModal(false);
        setShowRefundConfirm(false);

        const messages: Record<string, string> = {
          approve: 'Retur godkänd',
          reject: 'Retur avslagen',
          receive: 'Markerad som mottagen',
          refund: 'Återbetalning bearbetad',
          'mark-refunded': 'Markerad som återbetald',
        };
        toast.success(messages[action] || 'Uppdaterad');
      } else {
        toast.error(data.error || 'Åtgärden misslyckades');
      }
    } catch {
      toast.error('Något gick fel');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-forest-600 dark:text-[#C5D4C5]">Kunde inte ladda retur</p>
        <button
          onClick={fetchReturn}
          className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors"
        >
          Försök igen
        </button>
      </div>
    );
  }

  if (!returnData) {
    return (
      <div className="text-center py-12">
        <p className="text-forest-600 dark:text-[#C5D4C5]">Retur hittades inte</p>
        <Link href="/admin/returns" className="text-sage-700 dark:text-sage-400 hover:underline mt-2 inline-block">
          Tillbaka till returer
        </Link>
      </div>
    );
  }

  const itemsSubtotal = returnData.items.reduce(
    (sum, item) => sum + (item.price || 0) * item.quantity,
    0
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/returns"
          className="p-2 rounded-lg hover:bg-cream-100 dark:hover:bg-[#2a3330] transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-forest-700 dark:text-[#C5D4C5]" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-forest-800 dark:text-[#E8EDE8]">
              Retur #{returnData.id.substring(0, 8)}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                statusColors[returnData.status] || 'bg-gray-100 text-gray-800 dark:bg-[#343c39] dark:text-[#8A9A8A]'
              }`}
            >
              {statusLabels[returnData.status] || returnData.status}
            </span>
          </div>
          <div className="flex gap-4 mt-1 text-sm text-forest-600 dark:text-[#8A9A8A]">
            <span>Skapad: {new Date(returnData.createdAt).toLocaleDateString('sv-SE')}</span>
            {returnData.approvedAt && (
              <span>Godkänd: {new Date(returnData.approvedAt).toLocaleDateString('sv-SE')}</span>
            )}
            {returnData.receivedAt && (
              <span>Mottagen: {new Date(returnData.receivedAt).toLocaleDateString('sv-SE')}</span>
            )}
            {returnData.refundedAt && (
              <span>Återbetald: {new Date(returnData.refundedAt).toLocaleDateString('sv-SE')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Orderinformation</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">Order-ID</span>
            <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">
              <Link href={`/admin/orders/${returnData.orderId}`} className="text-sage-700 dark:text-sage-400 hover:underline">
                #{returnData.orderId.substring(0, 8)}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">Kund</span>
            <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.customerName || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">E-post</span>
            <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.customerEmail || 'N/A'}</p>
          </div>
          <div>
            <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">Betalningsmetod</span>
            <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.orderPaymentMethod || 'N/A'}</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-sm text-forest-600 dark:text-[#8A9A8A]">Returorsak</span>
          <p className="font-medium text-forest-800 dark:text-[#E8EDE8]">{returnData.reason}</p>
        </div>
      </div>

      {/* Return Items */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft overflow-hidden border border-transparent dark:border-[#3f4946]">
        <div className="p-6 border-b border-cream-200 dark:border-[#3f4946]">
          <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8]">Returartiklar</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-50 dark:bg-[#1a1f1e] border-b border-cream-200 dark:border-[#3f4946]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">
                  Produkt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">
                  Antal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">
                  Pris
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">
                  Skick
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-forest-600 dark:text-[#8A9A8A] uppercase">
                  Orsak
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200 dark:divide-[#3f4946]">
              {returnData.items.map((item) => (
                <tr key={item.id} className="hover:bg-cream-50 dark:hover:bg-[#2a3330]">
                  <td className="px-6 py-4 text-forest-800 dark:text-[#E8EDE8] font-medium">
                    {item.productName || item.productId.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-forest-700 dark:text-[#C5D4C5]">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-forest-700 dark:text-[#C5D4C5]">
                    {item.price ? formatPrice(item.price * item.quantity) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {item.condition && (
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${conditionColors[item.condition] || 'bg-gray-100 text-gray-800 dark:bg-[#343c39] dark:text-[#8A9A8A]'}`}>
                        {conditionLabels[item.condition] || item.condition}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-forest-600 dark:text-[#8A9A8A]">
                    {item.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refund Summary */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Återbetalningssammanfattning</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-forest-700 dark:text-[#C5D4C5]">
            <span>Artiklar delsumma</span>
            <span>{formatPrice(itemsSubtotal)}</span>
          </div>
          <div className="flex justify-between text-forest-800 dark:text-[#E8EDE8] font-bold text-lg border-t border-cream-200 dark:border-[#3f4946] pt-2">
            <span>Total återbetalning</span>
            <span>{formatPrice(returnData.refundAmount)}</span>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Adminanteckningar</h2>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Interna anteckningar..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white dark:bg-[#242a28] rounded-2xl shadow-soft p-6 border border-transparent dark:border-[#3f4946]">
        <h2 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Åtgärder</h2>

        {returnData.status === 'pending' && (
          <div className="flex gap-3">
            <button
              onClick={() => handleAction('approve')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-colors disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Godkänn
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5" />
              Avslå
            </button>
          </div>
        )}

        {returnData.status === 'approved' && (
          <button
            onClick={() => handleAction('receive')}
            disabled={actionLoading}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <InboxIcon className="h-5 w-5" />
            Markera som mottagen
          </button>
        )}

        {returnData.status === 'received' && (
          ['stripe', 'card'].includes(returnData.orderPaymentMethod || 'stripe') ? (
            <button
              onClick={() => setShowRefundConfirm(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <BanknotesIcon className="h-5 w-5" />
              Bearbeta återbetalning
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-forest-600 dark:text-[#8A9A8A]">
                Betalningsmetod: <span className="font-medium">{returnData.orderPaymentMethod || 'okänd'}</span> — automatisk återbetalning stöds ej. Bearbeta manuellt via {returnData.orderPaymentMethod || 'betalningsleverantörens'}-portalen och markera sedan som återbetald.
              </p>
              <button
                onClick={() => handleAction('mark-refunded')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <BanknotesIcon className="h-5 w-5" />
                Markera som återbetald
              </button>
            </div>
          )
        )}

        {['rejected', 'refunded', 'cancelled'].includes(returnData.status) && (
          <p className="text-forest-600 dark:text-[#8A9A8A]">
            Denna retur är {statusLabels[returnData.status]?.toLowerCase() || returnData.status}. Inga ytterligare åtgärder tillgängliga.
          </p>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#242a28] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Avslå retur</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ange orsak för avslag..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] bg-white dark:bg-[#2a3330] text-forest-800 dark:text-[#E8EDE8] placeholder-forest-400 dark:placeholder-[#6B7B6B] focus:border-sage-600 focus:outline-none transition-colors resize-none mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleAction('reject', { reason: rejectReason })}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Avslå
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Confirmation Modal */}
      {showRefundConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#242a28] rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-forest-800 dark:text-[#E8EDE8] mb-4">Bekräfta återbetalning</h3>
            <p className="text-forest-700 dark:text-[#C5D4C5] mb-2">
              Är du säker på att du vill bearbeta en återbetalning på{' '}
              <span className="font-bold">{formatPrice(returnData.refundAmount)}</span>?
            </p>
            <p className="text-sm text-forest-600 dark:text-[#8A9A8A] mb-4">
              Återbetalningen sker via {returnData.orderPaymentMethod || 'Stripe'}.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRefundConfirm(false)}
                className="px-4 py-2 rounded-xl border-2 border-cream-300 dark:border-[#3f4946] text-forest-700 dark:text-[#C5D4C5] hover:bg-cream-50 dark:hover:bg-[#2a3330] transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => handleAction('refund')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Bearbetar...' : 'Bekräfta återbetalning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
