import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';
import { Order } from '@/lib/db/models/order';
import type { OrderDTO, OrderRowDTO, OrderStatus } from '@/types/dto';

export class InvalidTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`An order cannot move from ${from} to ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Spec §7.4. delivered/cancelled/payment_failed are terminal, and a no-op
 * transition is refused so the history never fills with duplicates.
 */
const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending: ['paid', 'cancelled', 'payment_failed'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  payment_failed: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date().toISOString();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toOrderDTO(order: any): OrderDTO {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    email: order.email,
    userId: order.userId ? String(order.userId) : null,
    status: order.status as OrderStatus,
    items: order.items.map((item: any) => ({
      title: item.title,
      size: item.size,
      color: item.color,
      sku: item.sku,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      imagePublicId: item.imagePublicId ?? '',
    })),
    shippingAddress: {
      name: order.shippingAddress.name,
      line1: order.shippingAddress.line1,
      line2: order.shippingAddress.line2 ?? '',
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country,
      phone: order.shippingAddress.phone ?? '',
    },
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    itemCount: order.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    trackingNumber: order.trackingNumber ?? '',
    statusHistory: (order.statusHistory ?? []).map((event: any) => ({
      status: event.status as OrderStatus,
      actor: event.actor ?? 'system',
      at: toIso(event.at),
      note: event.note ?? '',
    })),
    createdAt: toIso(order.createdAt),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function toRow(dto: OrderDTO): OrderRowDTO {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    email: dto.email,
    status: dto.status,
    totalCents: dto.totalCents,
    itemCount: dto.itemCount,
    createdAt: dto.createdAt,
  };
}

export async function listOrders(status?: OrderStatus): Promise<OrderRowDTO[]> {
  await connectToDatabase();

  const query = status ? { status } : {};
  const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

  return orders.map((order) => toRow(toOrderDTO(order)));
}

export async function getOrderById(id: string): Promise<OrderDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  const order = await Order.findById(id).lean();
  return order ? toOrderDTO(order) : null;
}

export async function transitionOrder(input: {
  id: string;
  to: OrderStatus;
  actor: string;
  note?: string;
  trackingNumber?: string;
}): Promise<OrderDTO> {
  if (!Types.ObjectId.isValid(input.id)) throw new Error(`Invalid id: ${input.id}`);

  await connectToDatabase();

  const order = await Order.findById(input.id);
  if (!order) throw new Error(`No order with id ${input.id}`);

  const from = order.status as OrderStatus;
  if (!canTransition(from, input.to)) throw new InvalidTransitionError(from, input.to);

  order.status = input.to;
  if (input.trackingNumber) order.trackingNumber = input.trackingNumber;
  order.statusHistory.push({
    status: input.to,
    actor: input.actor,
    at: new Date(),
    note: input.note ?? '',
  });

  await order.save();

  // TODO(Phase 5): when `to === 'shipped'`, fire the shipping-confirmation
  // email via Resend. Email infrastructure lands with checkout.
  return toOrderDTO(order.toObject());
}

export async function listOrdersForUser(userId: string): Promise<OrderRowDTO[]> {
  if (!Types.ObjectId.isValid(userId)) return [];

  await connectToDatabase();

  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return orders.map((order) => toRow(toOrderDTO(order)));
}
