/* eslint-disable react-refresh/only-export-components */
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
} from 'lucide-react';

export const STATUS_META = {
  pending: {
    label: 'Pending',
    customerLabel: 'Order received',
    icon: Clock,
    tone: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
    description: 'We have your order and will confirm it shortly.',
  },
  confirmed: {
    label: 'Confirmed',
    customerLabel: 'Confirmed',
    icon: CheckCircle2,
    tone: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    description: 'Your order is confirmed and queued for packing.',
  },
  processing: {
    label: 'Processing',
    customerLabel: 'Being packed',
    icon: Package,
    tone: 'bg-indigo-100 text-indigo-700',
    dot: 'bg-indigo-500',
    description: 'We are packing your items.',
  },
  shipped: {
    label: 'Shipped',
    customerLabel: 'On the way',
    icon: Truck,
    tone: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    description: 'Your parcel has left our warehouse.',
  },
  delivered: {
    label: 'Delivered',
    customerLabel: 'Delivered',
    icon: Home,
    tone: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    description: 'Your order has arrived.',
  },
  cancelled: {
    label: 'Cancelled',
    customerLabel: 'Cancelled',
    icon: XCircle,
    tone: 'bg-red-100 text-red-700',
    dot: 'bg-red-500',
    description: 'This order was cancelled.',
  },
};

// The happy path, used to draw the progress timeline
export const FLOW = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

function OrderStatus({ status, size = 'md', customer = false }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const Icon = meta.icon;

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded whitespace-nowrap ${
        meta.tone
      } ${sizes[size]}`}
    >
      <Icon size={size === 'lg' ? 15 : 13} />
      {customer ? meta.customerLabel : meta.label}
    </span>
  );
}

export default OrderStatus;