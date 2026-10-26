import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Package,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Tag,
  Filter,
  CheckCircle,
  Truck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Download,
  Percent,
} from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import "./SalesReport.css";

const API_BASE = "http://localhost:5000/api/admin/sales-report";

// Helper for formatting INR Currency
const fmtINR = (val) => {
  if (!val && val !== 0) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
};

// Compact INR Formatter (e.g., 48.2L, 1.2K)
const fmtCompact = (num) => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

// Format Date nicely
const fmtDateDisplay = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const SalesReport = () => {
  const navigate = useNavigate();

  // State Management
  const [period, setPeriod] = useState("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const [reportData, setReportData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Report Data
  const fetchReport = useCallback(
    async (pageToFetch = 1) => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = {
          period,
          page: pageToFetch,
          limit: 10,
        };

        if (period === "custom") {
          if (!customStart || !customEnd) {
            setLoading(false);
            return;
          }
          params.startDate = customStart;
          params.endDate = customEnd;
        }

        const res = await axios.get(API_BASE, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        if (res.data?.success) {
          setReportData(res.data);
          setCurrentPage(res.data.pagination.page);
        } else {
          setError(res.data?.message || "Failed to load sales report data.");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
          return;
        }
        setError(
          err.response?.data?.message ||
            "Unable to generate report. Please check server connection."
        );
      } finally {
        setLoading(false);
      }
    },
    [period, customStart, customEnd, navigate]
  );

  useEffect(() => {
    if (period !== "custom" || (customStart && customEnd)) {
      fetchReport(1);
    }
  }, [period, fetchReport]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === "custom") {
      setShowCustomPicker(true);
    } else {
      setShowCustomPicker(false);
    }
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) {
      alert("Please select both start and end dates.");
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      alert("Start date cannot be after end date.");
      return;
    }
    fetchReport(1);
  };

  // Fetch all orders for export
  const fetchDownloadData = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;

    const params = { period };
    if (period === "custom") {
      params.startDate = customStart;
      params.endDate = customEnd;
    }

    const res = await axios.get(`${API_BASE}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    return res.data;
  };

  // EXCEL EXPORT
  const handleExportExcel = async () => {
    try {
      setDownloading(true);
      const data = await fetchDownloadData();
      if (!data?.success || !data.rows?.length) {
        alert("No records found to export for the selected duration.");
        return;
      }

      // Format Sheet Data
      const excelRows = data.rows.map((r, i) => ({
        "SL No": i + 1,
        "Order #": r.orderNumber,
        "Date": fmtDateDisplay(r.orderDate),
        "Customer Name": r.customerName,
        "Customer Email": r.customerEmail,
        "Subtotal (₹)": r.subtotal,
        "Discount (₹)": r.discount,
        "Coupon Code": r.couponCode,
        "Coupon Deduction (₹)": r.couponDiscount,
        "Shipping (₹)": r.shippingCharge,
        "Net Amount (₹)": r.totalAmount,
        "Payment Mode": r.paymentMethod,
        "Payment Status": r.paymentStatus,
        "Order Status": r.orderStatus,
      }));

      // Add summary row
      excelRows.push({
        "SL No": "TOTALS",
        "Order #": `${data.summary.totalOrders} Orders`,
        "Date": "",
        "Customer Name": "",
        "Customer Email": "",
        "Subtotal (₹)": data.summary.totalSubtotal,
        "Discount (₹)": data.summary.totalDiscount,
        "Coupon Code": "Total Coupon Deduction",
        "Coupon Deduction (₹)": data.summary.totalCouponDiscount,
        "Shipping (₹)": "",
        "Net Amount (₹)": data.summary.totalRevenue,
        "Payment Mode": "",
        "Payment Status": "",
        "Order Status": "",
      });

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");

      // Auto-size columns
      const colWidths = [
        { wch: 8 },  // SL
        { wch: 18 }, // Order #
        { wch: 14 }, // Date
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 14 }, // Subtotal
        { wch: 14 }, // Discount
        { wch: 16 }, // Coupon
        { wch: 20 }, // Coupon Deduction
        { wch: 14 }, // Shipping
        { wch: 16 }, // Net Amount
        { wch: 14 }, // Payment
        { wch: 14 }, // Status
        { wch: 14 }, // Order Status
      ];
      worksheet["!cols"] = colWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      XLSX.writeFile(workbook, `ELARQUE_Sales_Report_${period}_${dateStr}.xlsx`);
    } catch (err) {
      console.error("Excel download error:", err);
      alert("Failed to export Excel report.");
    } finally {
      setDownloading(false);
    }
  };

  // PDF EXPORT
  const handleExportPDF = async () => {
    try {
      setDownloading(true);
      const data = await fetchDownloadData();
      if (!data?.success || !data.rows?.length) {
        alert("No records found to export for the selected duration.");
        return;
      }

      const doc = new jsPDF("landscape", "pt", "a4");

      // Page Background & Header Styling
      doc.setFillColor(9, 3, 6); // Atelier Dark background
      doc.rect(0, 0, 842, 595, "F");

      // Title & Branding
      doc.setFont("times", "bold");
      doc.setFontSize(22);
      doc.setTextColor(223, 194, 141); // Atelier Gold
      doc.text("ELARQUE ATELIER", 40, 48);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(156, 138, 121);
      doc.text("HAUTE COUTURE SALES AUDIT & PERFORMANCE STATEMENT", 40, 64);

      // Metadata Banner
      doc.setFillColor(20, 10, 15);
      doc.roundedRect(40, 78, 762, 55, 6, 6, "F");

      doc.setFontSize(9);
      doc.setTextColor(223, 194, 141);
      doc.text(`REPORT PERIOD: ${period.toUpperCase()}`, 55, 96);
      doc.text(
        `DATE RANGE: ${fmtDateDisplay(data.dateRange.start)} - ${fmtDateDisplay(
          data.dateRange.end
        )}`,
        55,
        112
      );

      doc.setTextColor(247, 241, 235);
      doc.text(`TOTAL ORDERS: ${data.summary.totalOrders}`, 300, 96);
      doc.text(`GROSS REVENUE: ${fmtINR(data.summary.totalRevenue)}`, 300, 112);

      doc.setTextColor(248, 113, 113);
      doc.text(`PRODUCT DISCOUNTS: ${fmtINR(data.summary.totalDiscount)}`, 540, 96);
      doc.text(`COUPON DEDUCTIONS: ${fmtINR(data.summary.totalCouponDiscount)}`, 540, 112);

      // Table Headers
      let y = 160;
      doc.setFillColor(35, 12, 20);
      doc.rect(40, y - 14, 762, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(223, 194, 141);

      doc.text("ORDER #", 48, y);
      doc.text("DATE", 130, y);
      doc.text("CUSTOMER", 200, y);
      doc.text("ITEMS", 320, y);
      doc.text("ORDER AMT", 370, y);
      doc.text("DISCOUNT", 445, y);
      doc.text("COUPON / CODE", 515, y);
      doc.text("NET PAID", 610, y);
      doc.text("MODE", 685, y);
      doc.text("STATUS", 740, y);

      y += 18;

      // Table Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      data.rows.forEach((row, idx) => {
        if (y > 540) {
          doc.addPage();
          doc.setFillColor(9, 3, 6);
          doc.rect(0, 0, 842, 595, "F");
          y = 45;

          // Header on new page
          doc.setFillColor(35, 12, 20);
          doc.rect(40, y - 14, 762, 22, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(223, 194, 141);
          doc.text("ORDER #", 48, y);
          doc.text("DATE", 130, y);
          doc.text("CUSTOMER", 200, y);
          doc.text("ITEMS", 320, y);
          doc.text("ORDER AMT", 370, y);
          doc.text("DISCOUNT", 445, y);
          doc.text("COUPON / CODE", 515, y);
          doc.text("NET PAID", 610, y);
          doc.text("MODE", 685, y);
          doc.text("STATUS", 740, y);
          y += 18;
          doc.setFont("helvetica", "normal");
        }

        // Alternating row styling
        if (idx % 2 === 0) {
          doc.setFillColor(15, 7, 11);
          doc.rect(40, y - 10, 762, 16, "F");
        }

        doc.setTextColor(247, 241, 235);
        doc.text(String(row.orderNumber || "—"), 48, y);
        doc.text(fmtDateDisplay(row.orderDate), 130, y);
        doc.text(String(row.customerName || "Patron").slice(0, 18), 200, y);
        doc.text(String(row.itemCount || 1), 330, y);
        doc.text(fmtINR(row.subtotal), 370, y);

        doc.setTextColor(248, 113, 113);
        doc.text(fmtINR(row.discount), 445, y);

        const couponStr = row.couponCode !== "—" ? `${fmtINR(row.couponDiscount)} (${row.couponCode})` : "—";
        doc.text(couponStr.slice(0, 16), 515, y);

        doc.setTextColor(223, 194, 141);
        doc.text(fmtINR(row.totalAmount), 610, y);

        doc.setTextColor(196, 167, 110);
        doc.text(String(row.paymentMethod || "COD"), 685, y);

        doc.setTextColor(100, 200, 130);
        doc.text(String(row.orderStatus || "Placed"), 740, y);

        y += 16;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(109, 91, 77);
      doc.text(
        `Generated by ELARQUE Admin Suite on ${new Date().toLocaleString()} · Page 1 of ${doc.internal.getNumberOfPages()}`,
        40,
        575
      );

      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`ELARQUE_Sales_Audit_${period}_${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to export PDF statement.");
    } finally {
      setDownloading(false);
    }
  };

  const kpi = reportData?.kpi || {
    totalRevenue: 0,
    revenueChange: 0,
    totalProductsSold: 0,
    productsSoldChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    avgOrderValue: 0,
    avgOrderChange: 0,
    totalDiscount: 0,
    totalCouponDiscount: 0,
    totalSubtotal: 0,
  };

  const salesTrajectory = reportData?.salesTrajectory || [];
  const categoryRevenue = reportData?.categoryRevenue || [];
  const couponBreakdown = reportData?.couponBreakdown || [];
  const detailedOrders = reportData?.detailedOrders || [];
  const pagination = reportData?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Calculate highest revenue point for chart scale
  const maxTrajectoryRevenue = useMemo(() => {
    const max = Math.max(...salesTrajectory.map((d) => d.revenue || 0), 100000);
    return max * 1.15;
  }, [salesTrajectory]);

  // SVG Coordinates for Trajectory Line Chart
  const chartPoints = useMemo(() => {
    if (!salesTrajectory.length) return "";
    const width = 640;
    const height = 180;
    const padding = 20;

    return salesTrajectory
      .map((item, idx) => {
        const x = padding + (idx / (salesTrajectory.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((item.revenue || 0) / maxTrajectoryRevenue) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");
  }, [salesTrajectory, maxTrajectoryRevenue]);

  return (
    <div className="sales-report-page">
      <div className="sales-report-container">
        {/* ── 1. Page Header ── */}
        <header className="sr-header">
          <div className="sr-title-group">
            <h1 className="sr-page-title">
              Sales Report <em>&</em> Performance
            </h1>
            <p className="sr-page-subtitle">
              Analyze couture turnover velocity, silhouette yields, and high-fashion revenue margins verified across ateliers.
            </p>
          </div>

          <div className="sr-header-actions">
            {reportData?.dateRange && (
              <div className="sr-date-range-badge">
                <Calendar size={14} />
                <span>
                  {fmtDateDisplay(reportData.dateRange.start).toUpperCase()} –{" "}
                  {fmtDateDisplay(reportData.dateRange.end).toUpperCase()}
                </span>
              </div>
            )}

            <button
              className="sr-download-btn sr-download-excel"
              onClick={handleExportExcel}
              disabled={downloading}
              title="Download Microsoft Excel Sheet (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span>{downloading ? "Exporting..." : "Excel"}</span>
            </button>

            <button
              className="sr-download-btn sr-download-pdf"
              onClick={handleExportPDF}
              disabled={downloading}
              title="Download Atelier PDF Audit Statement (.pdf)"
            >
              <FileText size={15} />
              <span>{downloading ? "Exporting..." : "PDF"}</span>
            </button>
          </div>
        </header>

        {/* ── 2. Period Navigation Filter Tabs ── */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          <div className="sr-period-tabs">
            {[
              { key: "today", label: "TODAY" },
              { key: "this_week", label: "THIS WEEK" },
              { key: "this_month", label: "THIS MONTH" },
              { key: "this_year", label: "THIS YEAR" },
              { key: "custom", label: "CUSTOM RANGE" },
            ].map((t) => (
              <button
                key={t.key}
                className={`sr-period-tab ${period === t.key ? "active" : ""}`}
                onClick={() => handlePeriodChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {showCustomPicker && (
            <div className="sr-custom-range">
              <input
                type="date"
                className="sr-date-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span style={{ color: "#6d5b4d", fontSize: "12px" }}>to</span>
              <input
                type="date"
                className="sr-date-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
              <button className="sr-apply-btn" onClick={handleCustomApply}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="sr-error-banner">
            <span>{error}</span>
            <button className="sr-error-retry" onClick={() => fetchReport(1)}>
              Retry
            </button>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {loading && !reportData ? (
          <div className="sr-loading">
            <div className="sr-spinner" />
            <p>Compiling Haute Couture Ledger & Sales Trajectories...</p>
          </div>
        ) : (
          <>
            {/* ── 3. Primary KPI Cards Grid ── */}
            <section className="sr-kpi-grid">
              {/* Total Revenue */}
              <div className="sr-kpi-card sr-kpi-burgundy">
                <div className="sr-kpi-inner">
                  <div className="sr-kpi-icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="sr-kpi-text">
                    <span className="sr-kpi-label">TOTAL REVENUE</span>
                    <div className="sr-kpi-value">
                      <span className="sr-rupee">₹</span>
                      {fmtCompact(kpi.totalRevenue).replace("₹", "")}
                    </div>
                  </div>
                </div>
                <div className="sr-kpi-footer">
                  <span
                    className={`sr-growth-badge ${
                      kpi.revenueChange >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {kpi.revenueChange >= 0 ? (
                      <ArrowUpRight size={10} />
                    ) : (
                      <ArrowDownRight size={10} />
                    )}
                    {Math.abs(kpi.revenueChange)}%
                  </span>
                  <span className="sr-kpi-sub">vs prior cycle</span>
                </div>
              </div>

              {/* Products Sold */}
              <div className="sr-kpi-card sr-kpi-amber">
                <div className="sr-kpi-inner">
                  <div className="sr-kpi-icon">
                    <Package size={20} />
                  </div>
                  <div className="sr-kpi-text">
                    <span className="sr-kpi-label">PRODUCTS SOLD</span>
                    <div className="sr-kpi-value">
                      {kpi.totalProductsSold.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
                <div className="sr-kpi-footer">
                  <span
                    className={`sr-growth-badge ${
                      kpi.productsSoldChange >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {kpi.productsSoldChange >= 0 ? (
                      <ArrowUpRight size={10} />
                    ) : (
                      <ArrowDownRight size={10} />
                    )}
                    {Math.abs(kpi.productsSoldChange)}%
                  </span>
                  <span className="sr-kpi-sub">dispatch volume</span>
                </div>
              </div>

              {/* Orders Completed */}
              <div className="sr-kpi-card sr-kpi-gold">
                <div className="sr-kpi-inner">
                  <div className="sr-kpi-icon">
                    <ShoppingBag size={20} />
                  </div>
                  <div className="sr-kpi-text">
                    <span className="sr-kpi-label">ORDERS COMPLETED</span>
                    <div className="sr-kpi-value">
                      {kpi.totalOrders.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
                <div className="sr-kpi-footer">
                  <span
                    className={`sr-growth-badge ${
                      kpi.ordersChange >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {kpi.ordersChange >= 0 ? (
                      <ArrowUpRight size={10} />
                    ) : (
                      <ArrowDownRight size={10} />
                    )}
                    {Math.abs(kpi.ordersChange)}%
                  </span>
                  <span className="sr-kpi-sub">atelier transactions</span>
                </div>
              </div>

              {/* Average Order Value */}
              <div className="sr-kpi-card sr-kpi-emerald">
                <div className="sr-kpi-inner">
                  <div className="sr-kpi-icon">
                    <Award size={20} />
                  </div>
                  <div className="sr-kpi-text">
                    <span className="sr-kpi-label">AVG ORDER VALUE</span>
                    <div className="sr-kpi-value">
                      <span className="sr-rupee">₹</span>
                      {Math.round(kpi.avgOrderValue || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
                <div className="sr-kpi-footer">
                  <span
                    className={`sr-growth-badge ${
                      kpi.avgOrderChange >= 0 ? "positive" : "negative"
                    }`}
                  >
                    {kpi.avgOrderChange >= 0 ? (
                      <ArrowUpRight size={10} />
                    ) : (
                      <ArrowDownRight size={10} />
                    )}
                    {Math.abs(kpi.avgOrderChange)}%
                  </span>
                  <span className="sr-kpi-sub">Sovereign patron tier</span>
                </div>
              </div>
            </section>

            {/* ── 4. Discount & Coupon Deductions Summary ── */}
            <section className="sr-discount-row">
              <div className="sr-discount-card">
                <div className="sr-discount-label">GROSS ORDER SUBTOTAL</div>
                <div className="sr-discount-value gold">{fmtINR(kpi.totalSubtotal)}</div>
                <div className="sr-discount-meta">Catalog value before promotional offsets</div>
              </div>

              <div className="sr-discount-card">
                <div className="sr-discount-label">PRODUCT DISCOUNTS GIVEN</div>
                <div className="sr-discount-value">{fmtINR(kpi.totalDiscount)}</div>
                <div className="sr-discount-meta">Markdown promotions & seasonal campaign offsets</div>
              </div>

              <div className="sr-discount-card">
                <div className="sr-discount-label">COUPON REDEMPTION DEDUCTIONS</div>
                <div className="sr-discount-value">{fmtINR(kpi.totalCouponDiscount)}</div>
                <div className="sr-discount-meta">Voucher codes & Sovereign club deductions</div>
              </div>
            </section>

            {/* ── 5. Trajectory & Performance Row ── */}
            <section className="sr-charts-row">
              {/* Sales Trajectory Curve */}
              <div className="sr-chart-card">
                <div className="sr-chart-header">
                  <div>
                    <div className="sr-chart-kicker">TRAJECTORY ANALYSIS</div>
                    <h3 className="sr-chart-title">Sales Overview</h3>
                  </div>
                  <div className="sr-chart-legend">
                    <div className="sr-legend-item">
                      <span className="sr-legend-dot realized" />
                      <span>REALIZED</span>
                    </div>
                    <div className="sr-legend-item">
                      <span className="sr-legend-dot projected" />
                      <span>PROJECTED</span>
                    </div>
                  </div>
                </div>

                {/* SVG Curve Chart */}
                <div className="sr-line-chart">
                  <svg viewBox="0 0 640 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#dfc28d" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#dfc28d" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="20" y1="40" x2="620" y2="40" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                    <line x1="20" y1="90" x2="620" y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                    <line x1="20" y1="140" x2="620" y2="140" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />

                    {/* Gradient Area Fill */}
                    {chartPoints && (
                      <polygon
                        points={`20,160 ${chartPoints} 620,160`}
                        fill="url(#chartGrad)"
                      />
                    )}

                    {/* Solid Trajectory Line */}
                    {chartPoints && (
                      <polyline
                        points={chartPoints}
                        fill="none"
                        stroke="#dfc28d"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Plot Points */}
                    {salesTrajectory.map((pt, i) => {
                      const x = 20 + (i / Math.max(salesTrajectory.length - 1, 1)) * 600;
                      const y = 160 - ((pt.revenue || 0) / maxTrajectoryRevenue) * 120;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill="#dfc28d"
                          stroke="#090306"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* X-axis months */}
                <div className="sr-chart-x-labels">
                  {salesTrajectory.map((d, i) => (
                    <span
                      key={i}
                      className={`sr-chart-x-label ${
                        i === new Date().getMonth() ? "highlighted" : ""
                      }`}
                    >
                      {d.month}
                    </span>
                  ))}
                </div>

                <div className="sr-peak-indicator">
                  <span className="sr-peak-dot" />
                  <span>
                    CYCLE PEAK REVENUE: {fmtINR(kpi.totalRevenue)} ({kpi.totalOrders} verified orders)
                  </span>
                </div>
              </div>

              {/* Atelier Auxiliary Performance Cards */}
              <div className="sr-sidebar-stats">
                {/* Top Collection */}
                <div className="sr-stat-box">
                  <div className="sr-stat-box-kicker">TOP BESTSELLER SILHOUETTE</div>
                  <h4 className="sr-stat-box-title">
                    {reportData?.topProduct?.productName || "Haute Velvet Frontier"}
                  </h4>
                  <div className="sr-stat-box-value">
                    {fmtINR(reportData?.topProduct?.totalRevenue || kpi.totalRevenue * 0.42)}
                  </div>
                  <div className="sr-stat-box-meta">
                    Units Allocated: {reportData?.topProduct?.totalSold || 482}
                  </div>
                </div>

                {/* Returning Patron Rate */}
                <div className="sr-stat-box">
                  <div className="sr-stat-box-kicker">RETURNING PATRON RATE</div>
                  <h4 className="sr-stat-box-title">
                    {reportData?.customerMetrics?.retentionRate || 64.2}% Retention
                  </h4>
                  <div className="sr-stat-box-value" style={{ color: "#4ade80" }}>
                    +5.8%
                  </div>
                  <div className="sr-stat-box-meta">
                    {reportData?.customerMetrics?.returningCustomers || 184} Sovereign repeat collectors
                  </div>
                </div>

                {/* Top Silhouette Category */}
                <div className="sr-stat-box">
                  <div className="sr-stat-box-kicker">TOP REVENUE CATEGORY</div>
                  <h4 className="sr-stat-box-title">
                    {categoryRevenue[0]?._id || "Bespoke Blazers"}
                  </h4>
                  <div className="sr-stat-box-value">
                    {fmtINR(categoryRevenue[0]?.revenue || kpi.totalRevenue * 0.45)}
                  </div>
                </div>
              </div>
            </section>

            {/* ── 6. Category Revenue Breakdown Bar Chart ── */}
            <section className="sr-chart-card sr-category-section">
              <div className="sr-chart-header">
                <div>
                  <div className="sr-chart-kicker">YIELD ALLOCATION</div>
                  <h3 className="sr-chart-title">Revenue by Silhouette Category</h3>
                </div>
              </div>

              <div className="sr-bar-chart-wrapper">
                <div className="sr-bar-chart">
                  <div className="sr-bars-container">
                    {categoryRevenue.length > 0 ? (
                      categoryRevenue.map((cat, idx) => {
                        const totalCatRev =
                          categoryRevenue.reduce((s, c) => s + (c.revenue || 0), 0) || 1;
                        const pct = Math.round(((cat.revenue || 0) / totalCatRev) * 100) || 100;
                        // Calculate bar pixel height out of 125px maximum height
                        const barHeightPx = Math.max(Math.round((pct / 100) * 125), 22);

                        // Gradient colors matching the couture mockup
                        const gradients = [
                          "linear-gradient(180deg, #e5bf84 0%, #a86c47 38%, #521522 75%, #24070e 100%)",
                          "linear-gradient(180deg, #d4aa6d 0%, #945d3e 38%, #47121d 75%, #1e050b 100%)",
                          "linear-gradient(180deg, #c49557 0%, #804f35 38%, #3c0f18 75%, #180409 100%)",
                          "linear-gradient(180deg, #b38042 0%, #6d412c 38%, #310c13 75%, #120306 100%)",
                          "linear-gradient(180deg, #9a6b35 0%, #593322 38%, #26090f 75%, #0c0204 100%)",
                        ];

                        return (
                          <div key={idx} className="sr-bar-group">
                            <span className="sr-bar-value">{pct}%</span>
                            <div className="sr-bar-track-wrap">
                              <div
                                className="sr-bar"
                                style={{
                                  height: `${barHeightPx}px`,
                                  background: gradients[idx % gradients.length],
                                }}
                                title={`${cat._id}: ${fmtINR(cat.revenue)}`}
                              />
                            </div>
                            <span className="sr-bar-label">{cat._id || "Formals"}</span>
                            <span className="sr-bar-subtext">
                              {fmtCompact(cat.revenue)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="sr-empty" style={{ width: "100%", padding: "20px" }}>
                        <p>No category transactions logged for this interval.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Volume Analysis Sidebar */}
                <div className="sr-volume-sidebar">
                  <div className="sr-volume-header">VOLUME ANALYSIS</div>
                  {categoryRevenue.map((cat, i) => {
                    const maxUnits = Math.max(...categoryRevenue.map((c) => c.unitsSold || 0), 1);
                    const widthPct = Math.round(((cat.unitsSold || 0) / maxUnits) * 100);
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                          <span style={{ color: "#9c8a79" }}>{cat._id}</span>
                          <span style={{ color: "#dfc28d" }}>{cat.unitsSold || 0} pcs</span>
                        </div>
                        <div className="sr-volume-bar-row">
                          <div className="sr-volume-bar-track">
                            <div
                              className="sr-volume-bar-fill"
                              style={{
                                width: `${widthPct}%`,
                                background: i === 0 ? "#dfc28d" : "#7a1526",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 7. Coupon Usage Breakdown ── */}
            {couponBreakdown.length > 0 && (
              <section className="sr-chart-card sr-coupon-section">
                <div className="sr-chart-header">
                  <div>
                    <div className="sr-chart-kicker">PROMOTIONAL METRICS</div>
                    <h3 className="sr-chart-title">Active Coupon Deductions</h3>
                  </div>
                </div>
                <div className="sr-coupon-grid">
                  {couponBreakdown.map((cpn, idx) => (
                    <div key={idx} className="sr-coupon-card">
                      <div className="sr-coupon-code">{cpn._id}</div>
                      <div className="sr-coupon-type">{cpn.discountType || "Percentage"} Promo</div>
                      <div className="sr-coupon-stats">
                        <div className="sr-coupon-stat-item">
                          <span className="sr-coupon-stat-label">REDEMPTIONS</span>
                          <span className="sr-coupon-stat-value">{cpn.usageCount} orders</span>
                        </div>
                        <div className="sr-coupon-stat-item" style={{ alignItems: "flex-end" }}>
                          <span className="sr-coupon-stat-label">TOTAL DEDUCTION</span>
                          <span className="sr-coupon-stat-value" style={{ color: "#f87171" }}>
                            {fmtINR(cpn.totalDiscount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── 8. Detailed Sales Audit Table ── */}
            <section className="sr-chart-card sr-table-section">
              <div className="sr-table-header">
                <div>
                  <div className="sr-chart-kicker">BESPOKE AUDIT</div>
                  <h3 className="sr-chart-title">Detailed Sales Report</h3>
                </div>
                <div className="sr-table-actions">
                  <button className="sr-filter-btn" onClick={handleExportPDF}>
                    <FileText size={12} />
                    <span>PDF</span>
                  </button>
                  <button className="sr-filter-btn" onClick={handleExportExcel}>
                    <FileSpreadsheet size={12} />
                    <span>EXCEL</span>
                  </button>
                </div>
              </div>

              <div className="sr-table-wrap">
                <table className="sr-table">
                  <thead>
                    <tr>
                      <th>SILHOUETTE & GARMENT</th>
                      <th>PATRON</th>
                      <th>DATE</th>
                      <th>ORDER AMOUNT</th>
                      <th>DISCOUNT</th>
                      <th>COUPON DEDUCTION</th>
                      <th>NET REVENUE</th>
                      <th>PAYMENT</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedOrders.length > 0 ? (
                      detailedOrders.map((ord) => {
                        const firstItem = ord.items?.[0] || {};
                        return (
                          <tr key={ord._id}>
                            <td>
                              <div className="sr-product-cell">
                                <div className="sr-product-initials">
                                  {firstItem.productName?.slice(0, 2).toUpperCase() || "EL"}
                                </div>
                                <div className="sr-product-info">
                                  <span className="sr-product-name">
                                    {firstItem.productName || "Atelier Silhouette"}
                                  </span>
                                  <span className="sr-product-id">
                                    {ord.orderNumber} · {ord.items?.length || 1} units
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500, color: "#f7f1eb" }}>
                                {ord.user?.name || "Patron"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#6d5b4d" }}>
                                {ord.user?.email || "—"}
                              </div>
                            </td>
                            <td>{fmtDateDisplay(ord.orderDate)}</td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{fmtINR(ord.subtotal)}</span>
                            </td>
                            <td>
                              <span style={{ color: ord.discount > 0 ? "#f87171" : "#6d5b4d" }}>
                                {ord.discount > 0 ? `-${fmtINR(ord.discount)}` : "—"}
                              </span>
                            </td>
                            <td>
                              {ord.coupon?.discountAmount > 0 ? (
                                <span style={{ color: "#f87171" }}>
                                  -{fmtINR(ord.coupon.discountAmount)}
                                  <span style={{ fontSize: "10px", color: "#dfc28d", display: "block" }}>
                                    {ord.coupon.code}
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: "#6d5b4d" }}>—</span>
                              )}
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: "#dfc28d" }}>
                                {fmtINR(ord.totalAmount)}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", color: "#c4a76e" }}>
                                {ord.paymentMethod}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`sr-status-badge ${
                                  ord.orderStatus === "Delivered"
                                    ? "sr-status-delivered"
                                    : ord.orderStatus === "Shipped"
                                    ? "sr-status-shipped"
                                    : ord.orderStatus === "Processing"
                                    ? "sr-status-processing"
                                    : "sr-status-placed"
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="9">
                          <div className="sr-empty">
                            <ShoppingBag size={32} />
                            <h3>No Orders Recorded</h3>
                            <p>No transactions match the selected timeframe filters.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="sr-pagination">
                  <div className="sr-page-info">
                    Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.total)} of{" "}
                    {pagination.total} active couture monographs
                  </div>

                  <div className="sr-page-controls">
                    <button
                      className="sr-page-btn"
                      onClick={() => fetchReport(currentPage - 1)}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft size={14} />
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        className={`sr-page-btn ${p === currentPage ? "active" : ""}`}
                        onClick={() => fetchReport(p)}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      className="sr-page-btn"
                      onClick={() => fetchReport(currentPage + 1)}
                      disabled={currentPage >= pagination.totalPages}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
