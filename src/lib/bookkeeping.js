
import { supabase } from "./supabaseClient";

// Get the authenticated user and their existing business.
export async function getBookkeepingContext() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (businessError) throw businessError;

  if (!business) {
    return { status: "no-business", user };
  }

  return { status: "ready", user, business };
}

// Load bookkeeping records belonging to the authenticated user's business.

export async function getBookkeepingData(businessId, userId) {
  if (!businessId || !userId) {
    throw new Error(
      "A valid business and authenticated user are required."
    );
  }

  // These tables have a user_id column.
  const userScopedTables = [
    ["customers", "bookkeeping_customers"],
    ["products", "bookkeeping_products"],
    ["stockMovements", "bookkeeping_stock_movements"],
    ["invoices", "bookkeeping_invoices"],
    ["orders", "bookkeeping_orders"],
  ];

  // These child tables do not have a user_id column.
  // They are scoped by business_id instead.
  const businessScopedTables = [
    ["invoiceItems", "bookkeeping_invoice_items"],
    ["orderItems", "bookkeeping_order_items"],
  ];

  const results = await Promise.all([
    ...userScopedTables.map(async ([key, table]) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("business_id", businessId)
        .eq("user_id", userId);

      if (error) {
        throw new Error(
          `Could not load ${key}: ${error.message}`
        );
      }

      return [key, data ?? []];
    }),

    ...businessScopedTables.map(async ([key, table]) => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("business_id", businessId);

      if (error) {
        throw new Error(
          `Could not load ${key}: ${error.message}`
        );
      }

      return [key, data ?? []];
    }),
  ]);

  return Object.fromEntries(results);
}

export async function completeSale({
  businessId,
  items,
  customerId = null,
  paymentMethod = "cash",
  amountPaid = null,
  discount = 0,
  notes = null,
}) {
  if (!businessId) {
    throw new Error("No business is selected.");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Add at least one product to the sale.");
  }

  const { data, error } = await supabase.rpc(
    "bookkeeping_complete_sale",
    {
      p_business_id: businessId,
      p_items: items.map((item) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
      })),
      p_customer_id: customerId || null,
      p_payment_method: paymentMethod,
      p_amount_paid: amountPaid === "" ? null : amountPaid,
      p_discount: Number(discount) || 0,
      p_notes: notes || null,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data; // The new order ID
}

export async function createInvoice({
  businessId,
  userId,
  customerId,
  issueDate,
  dueDate,
  discount = 0,
  notes = "",
  items,
}) {
  if (!businessId || !userId) {
    throw new Error("Your business and login are required.");
  }

  if (!items?.length) {
    throw new Error("Add at least one invoice item.");
  }

  const cleanItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const taxRate = Number(item.tax_rate || 0);

    if (
      !item.description?.trim() ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(taxRate) ||
      quantity <= 0 ||
      unitPrice < 0 ||
      taxRate < 0
    ) {
      throw new Error("Check the descriptions, quantities, prices and tax rates.");
    }

    const lineSubtotal = quantity * unitPrice;
    const lineTax = lineSubtotal * (taxRate / 100);

    return {
      description: item.description.trim(),
      quantity,
      unit_price: unitPrice,
      tax_rate: taxRate,
      line_subtotal: Number(lineSubtotal.toFixed(2)),
      line_tax: Number(lineTax.toFixed(2)),
      line_total: Number((lineSubtotal + lineTax).toFixed(2)),
    };
  });

  const subtotal = cleanItems.reduce(
    (sum, item) => sum + item.line_subtotal,
    0
  );

  const taxTotal = cleanItems.reduce(
    (sum, item) => sum + item.line_tax,
    0
  );

  const safeDiscount = Number(discount);

  if (!Number.isFinite(safeDiscount) || safeDiscount < 0 || safeDiscount > subtotal + taxTotal) {
    throw new Error("The discount must be valid and cannot exceed the invoice total.");
  }

  const total = Number((subtotal + taxTotal - safeDiscount).toFixed(2));

  // Generate a readable invoice number.
  const invoiceNumber = `INV-${Date.now()}`;

  const { data: invoice, error: invoiceError } = await supabase
    .from("bookkeeping_invoices")
    .insert({
      business_id: businessId,
      user_id: userId,
      customer_id: customerId || null,
      invoice_number: invoiceNumber,
      issue_date: issueDate,
      due_date: dueDate || null,
      status: "unpaid",
      subtotal: Number(subtotal.toFixed(2)),
      tax_total: Number(taxTotal.toFixed(2)),
      discount: safeDiscount,
      total,
      amount_paid: 0,
      notes: notes.trim() || null,
    })
    .select("id, invoice_number")
    .single();

  if (invoiceError) throw invoiceError;

  const invoiceItems = cleanItems.map((item) => ({
    ...item,
    invoice_id: invoice.id,
    business_id: businessId,
  }));

  const { error: itemsError } = await supabase
    .from("bookkeeping_invoice_items")
    .insert(invoiceItems);

  if (itemsError) {
    // Avoid leaving an invoice without its line items.
    const { error: rollbackError } = await supabase
      .from("bookkeeping_invoices")
      .delete()
      .eq("id", invoice.id)
      .eq("business_id", businessId);

    if (rollbackError) {
      console.error("Invoice cleanup failed:", rollbackError);
    }

    throw itemsError;
  }

  return invoice;
}

export async function getInvoiceItems(invoiceId, businessId) {
  const { data, error } = await supabase
    .from("bookkeeping_invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}

export async function recordInvoicePayment(invoiceId, businessId, paymentAmount) {
  const amount = Number(paymentAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a payment amount greater than zero.");
  }

  const { data: invoice, error: fetchError } = await supabase
    .from("bookkeeping_invoices")
    .select("id, total, amount_paid, status")
    .eq("id", invoiceId)
    .eq("business_id", businessId)
    .single();

  if (fetchError) throw fetchError;

  const remaining = Number(invoice.total) - Number(invoice.amount_paid);

  if (amount > remaining) {
    throw new Error("The payment cannot exceed the outstanding balance.");
  }

  const newAmountPaid = Number(
    (Number(invoice.amount_paid) + amount).toFixed(2)
  );

  const newStatus =
    newAmountPaid >= Number(invoice.total) ? "paid" : "partial";

  const { error: updateError } = await supabase
    .from("bookkeeping_invoices")
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
    })
    .eq("id", invoiceId)
    .eq("business_id", businessId);

  if (updateError) throw updateError;
}


