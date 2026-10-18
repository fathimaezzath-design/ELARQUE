import { jsPDF } from "jspdf";

/**
 * Generate and download an editorial luxury ELARQUE PDF invoice.
 * @param {Object} order - Full order object with items, address, prices
 */
export const generateInvoicePDF = (order) => {
  if (!order) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const burgundy = [101, 13, 32]; // #650D20
  const gold = [197, 160, 89]; // #C5A059
  const darkText = [38, 28, 24]; // #261C18
  const mutedText = [120, 110, 105]; // #786E69
  const blushBg = [253, 249, 246]; // #FDF9F6

  // 1. Top Decorative Bar
  doc.setFillColor(...burgundy);
  doc.rect(0, 0, 210, 6, "F");

  // 2. Brand Header
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...burgundy);
  doc.text("E L A R Q U E", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...gold);
  doc.text("HAUTE COUTURE PRIVATE CLIENT SALON & ATELIER", 105, 25, { align: "center" });

  doc.setFontSize(7.5);
  doc.setTextColor(...mutedText);
  doc.text("PARIS • MILAN • DALLAS  |  CLIENT CONCIERGE: +1 (800) 482-3527", 105, 29, { align: "center" });

  // Divider Line
  doc.setDrawColor(223, 194, 141);
  doc.setLineWidth(0.4);
  doc.line(15, 33, 195, 33);

  // 3. Invoice Header Box
  doc.setFillColor(...blushBg);
  doc.roundedRect(15, 36, 180, 24, 2, 2, "F");

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...burgundy);
  doc.text("OFFICIAL COMMISSION INVOICE", 22, 45);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...darkText);
  doc.text(`INVOICE / ORDER REF: #${order.orderNumber || "ELQ-2026-0001"}`, 22, 51);

  const orderDateStr = order.orderDate
    ? new Date(order.orderDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "September 14, 2026";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Date of Issue: ${orderDateStr}`, 22, 56);

  // Right side badges in header box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...burgundy);
  doc.text(`STATUS: ${(order.orderStatus || "CONFIRMED").toUpperCase()}`, 188, 45, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text(`Payment: ${order.paymentMethod || "COD"} (${order.paymentStatus || "Paid"})`, 188, 51, { align: "right" });
  doc.text("Dispatched via White-Glove Courier", 188, 56, { align: "right" });

  // 4. Client & Shipping Dossier
  let currentY = 66;

  doc.setFont("times", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...burgundy);
  doc.text("PATRON BILLING & DISPATCH DOSSIER", 15, currentY);

  currentY += 4;
  doc.setDrawColor(230, 220, 215);
  doc.line(15, currentY, 195, currentY);
  currentY += 6;

  const addr = order.shippingAddress || {};
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...darkText);
  doc.text(`Patron: ${addr.fullName || "Private Client"}`, 15, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedText);

  const streetLine = [addr.house, addr.street].filter(Boolean).join(", ") || "Private Residence";
  const cityLine = `${addr.city || "Salon District"}, ${addr.state || ""} ${addr.pincode ? "- " + addr.pincode : ""}`;
  doc.text(`Delivery Address: ${streetLine}, ${cityLine}`, 15, currentY);

  currentY += 4.5;
  doc.text(`Mobile Liaison: ${addr.phone || "+91 98765 43210"}`, 15, currentY);

  // 5. Items Table
  currentY += 10;
  doc.setFillColor(...burgundy);
  doc.rect(15, currentY, 180, 7.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("#", 18, currentY + 5);
  doc.text("GARMENT & SILHOUETTE DESCRIPTION", 28, currentY + 5);
  doc.text("SPECIFICATIONS", 115, currentY + 5);
  doc.text("QTY", 148, currentY + 5, { align: "center" });
  doc.text("RATE", 168, currentY + 5, { align: "right" });
  doc.text("TOTAL", 190, currentY + 5, { align: "right" });

  currentY += 7.5;

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  items.forEach((item, index) => {
    const isAlt = index % 2 === 1;
    if (isAlt) {
      doc.setFillColor(252, 248, 245);
      doc.rect(15, currentY, 180, 8.5, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...darkText);

    // Index
    doc.text(String(index + 1), 18, currentY + 5.5);

    // Title
    const name = item.productName || "Atelier Silhouette";
    const truncatedName = name.length > 45 ? name.slice(0, 42) + "..." : name;
    doc.setFont("helvetica", "bold");
    doc.text(truncatedName, 28, currentY + 5.5);

    // Specs
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedText);
    const size = item.variant?.size || item.size || "Standard";
    const color = item.variant?.color || item.color || "Atelier Palette";
    doc.text(`Size: ${size} | ${color}`, 115, currentY + 5.5);

    // Qty
    doc.setTextColor(...darkText);
    doc.text(String(item.quantity || 1), 148, currentY + 5.5, { align: "center" });

    // Rate & Total
    const unitPrice = Number(item.price || 0);
    const itemTotal = Number(item.itemTotal || unitPrice * (item.quantity || 1));
    doc.text(`INR ${unitPrice.toLocaleString("en-IN")}`, 168, currentY + 5.5, { align: "right" });
    doc.text(`INR ${itemTotal.toLocaleString("en-IN")}`, 190, currentY + 5.5, { align: "right" });

    currentY += 8.5;
  });

  // Table bottom border
  doc.setDrawColor(220, 205, 195);
  doc.line(15, currentY, 195, currentY);

  // 6. Financial Summary Table
  currentY += 8;
  const summaryX = 125;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...mutedText);
  doc.text("Subtotal:", summaryX, currentY);
  doc.text(`INR ${Number(order.subtotal || order.totalAmount || 0).toLocaleString("en-IN")}`, 190, currentY, {
    align: "right",
  });

  currentY += 5;
  doc.text("White-Glove Atelier Shipping:", summaryX, currentY);
  doc.text(order.shippingCharge ? `INR ${Number(order.shippingCharge).toLocaleString("en-IN")}` : "COMPLIMENTARY", 190, currentY, {
    align: "right",
  });

  if (order.discount && order.discount > 0) {
    currentY += 5;
    doc.setTextColor(101, 13, 32);
    doc.text("Patron Coupon / Salon Privileges:", summaryX, currentY);
    doc.text(`-INR ${Number(order.discount).toLocaleString("en-IN")}`, 190, currentY, { align: "right" });
  }

  currentY += 5;
  doc.setTextColor(...mutedText);
  doc.text("Cedar Box Packaging & Care Kit:", summaryX, currentY);
  doc.text("INCLUDED", 190, currentY, { align: "right" });

  currentY += 6;
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.3);
  doc.line(summaryX - 5, currentY, 195, currentY);
  currentY += 6;

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...burgundy);
  doc.text("TOTAL SETTLED:", summaryX, currentY);
  doc.text(`INR ${Number(order.totalAmount || 0).toLocaleString("en-IN")}`, 190, currentY, { align: "right" });

  // 7. Atelier Seal & Notes
  const notesY = currentY + 18;
  doc.setFillColor(...blushBg);
  doc.roundedRect(15, notesY, 180, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...burgundy);
  doc.text("ELARQUE PROVENANCE & AUTHENTICITY REGISTRY", 22, notesY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...mutedText);
  doc.text(
    "All garments curated under ELARQUE haute couture western tailoring are registered in the Paris Salon Archive.",
    22,
    notesY + 11
  );
  doc.text(
    "Complimentary white-glove alteration and return privileges are protected under 256-Bit TLS client vault protocols.",
    22,
    notesY + 16
  );

  // 8. Bottom Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 140, 135);
  doc.text("© 2026 ELARQUE HAUTE COUTURE. ALL RIGHTS RESERVED.", 105, 287, { align: "center" });

  // Save PDF file
  const filename = `ELARQUE-Invoice-${order.orderNumber || "ORDER"}.pdf`;
  doc.save(filename);
};
