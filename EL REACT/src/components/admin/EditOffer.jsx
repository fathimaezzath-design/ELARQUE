import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  Sparkles,
  Tag,
  Layers,
  Calculator,
  Percent,
  Calendar,
  Cloud,
  Save,
  Check,
  Gift,
  DollarSign,
} from "lucide-react";
import "./AddOffer.css";

const API_BASE = "http://localhost:5000/api/admin/offers";

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

const EditOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [offerType, setOfferType] = useState("percentage");
  const [targetClass, setTargetClass] = useState("category");
  const [discountCalculation, setDiscountCalculation] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Targets
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Referral config
  const [referrerReward, setReferrerReward] = useState("200");
  const [refereeReward, setRefereeReward] = useState("100");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load targets & offer data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [targetsRes, offerRes] = await Promise.all([
          axios.get(`${API_BASE}/targets`, { headers: adminHeader() }),
          axios.get(`${API_BASE}/${id}`, { headers: adminHeader() }),
        ]);

        if (targetsRes.data?.success) {
          setAvailableProducts(targetsRes.data.products || []);
          setAvailableCategories(targetsRes.data.categories || []);
        }

        if (offerRes.data?.success && offerRes.data.offer) {
          const o = offerRes.data.offer;
          setTitle(o.title || "");
          setOfferType(o.offerType || "percentage");
          setTargetClass(o.targetClass || "category");
          setDiscountCalculation(o.discountCalculation || "percentage");
          setDiscountValue(o.discountValue !== undefined ? o.discountValue : "");
          if (o.startDate) setStartDate(new Date(o.startDate).toISOString().slice(0, 10));
          if (o.endDate) setEndDate(new Date(o.endDate).toISOString().slice(0, 10));
          setIsActive(Boolean(o.isActive));

          if (Array.isArray(o.targetCategories)) {
            setSelectedCategories(o.targetCategories.map((c) => c._id || c));
          }
          if (Array.isArray(o.targetProducts)) {
            setSelectedProducts(o.targetProducts.map((p) => p._id || p));
          }
          if (o.referralConfig) {
            setReferrerReward(o.referralConfig.referrerAmount || "200");
            setRefereeReward(o.referralConfig.refereeAmount || "100");
          }
        }
      } catch (err) {
        setError("Failed to load offer details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const toggleCategorySelection = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((i) => i !== catId) : [...prev, catId]
    );
  };

  const toggleProductSelection = (prodId) => {
    setSelectedProducts((prev) =>
      prev.includes(prodId) ? prev.filter((i) => i !== prodId) : [...prev, prodId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide an offer title.");
      return;
    }

    if (!discountValue || Number(discountValue) <= 0) {
      setError("Please enter a valid discount value greater than 0.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both activation start and expiration dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Activation start date cannot be later than expiration date.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        offerType,
        targetClass,
        discountCalculation,
        discountValue: Number(discountValue),
        startDate,
        endDate,
        isActive,
        targetCategories: targetClass === "category" ? selectedCategories : [],
        targetProducts: targetClass === "product" ? selectedProducts : [],
        referralConfig:
          targetClass === "referral"
            ? {
                referrerAmount: Number(referrerReward) || 200,
                refereeAmount: Number(refereeReward) || 100,
              }
            : undefined,
      };

      const res = await axios.put(`${API_BASE}/${id}`, payload, {
        headers: adminHeader(),
      });

      if (res.data?.success) {
        navigate("/admin/offers");
      } else {
        setError(res.data?.message || "Failed to update offer.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save offer changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="el-ao-root">
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#dfc28d" }}>
          Loading offer details...
        </div>
      </div>
    );
  }

  return (
    <div className="el-ao-root">
      <div className="el-ao-container">
        {/* Header */}
        <header className="el-ao-header">
          <div className="el-ao-title-group">
            <h1>Edit Promotional Offer</h1>
            <p className="el-ao-title-desc">
              Adjust bespoke promotional protocols, seasonal allowances, and client privileges across international salon nodes.
            </p>
          </div>

          <Link to="/admin/offers" className="el-ao-btn-back">
            <Cloud size={14} />
            <span>Back to Offers</span>
          </Link>
        </header>

        {error && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: "10px",
              color: "#f87171",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <div className="el-ao-card">
          <form className="el-ao-form" onSubmit={handleSubmit}>
            <div className="el-ao-grid">
              <div className="el-ao-field">
                <label className="el-ao-label">
                  OFFER TITLE <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Sparkles size={16} className="el-ao-input-icon" />
                  <input
                    type="text"
                    className="el-ao-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">
                  OFFER TYPE <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Tag size={16} className="el-ao-input-icon" />
                  <select
                    className="el-ao-select"
                    value={offerType}
                    onChange={(e) => {
                      setOfferType(e.target.value);
                      setDiscountCalculation(e.target.value);
                    }}
                  >
                    <option value="percentage">Percentage Concession (%)</option>
                    <option value="flat">Flat Concession (₹)</option>
                  </select>
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">
                  SELECT TARGET CLASS <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Layers size={16} className="el-ao-input-icon" />
                  <select
                    className="el-ao-select"
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                  >
                    <option value="category">Category Offer</option>
                    <option value="product">Product-Specific Offer</option>
                    <option value="referral">Referral Offer</option>
                  </select>
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">
                  DISCOUNT CALCULATION <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Calculator size={16} className="el-ao-input-icon" />
                  <select
                    className="el-ao-select"
                    value={discountCalculation}
                    onChange={(e) => setDiscountCalculation(e.target.value)}
                  >
                    <option value="percentage">Percentage Off Total Acquisition</option>
                    <option value="flat">Direct Flat Price Deduction</option>
                  </select>
                </div>
              </div>

              {targetClass === "category" && (
                <div className="el-ao-field full">
                  <label className="el-ao-label">
                    SELECT ATELIER CATEGORIES <span className="el-ao-req">*</span>
                  </label>
                  <div className="el-ao-target-list">
                    {availableCategories.map((c) => {
                      const isSel = selectedCategories.includes(c._id);
                      return (
                        <div
                          key={c._id}
                          className={`el-ao-target-pill ${isSel ? "selected" : ""}`}
                          onClick={() => toggleCategorySelection(c._id)}
                        >
                          {isSel && <Check size={12} />}
                          <span>{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetClass === "product" && (
                <div className="el-ao-field full">
                  <label className="el-ao-label">
                    SELECT TARGETED GARMENTS <span className="el-ao-req">*</span>
                  </label>
                  <div className="el-ao-target-list">
                    {availableProducts.map((p) => {
                      const isSel = selectedProducts.includes(p._id);
                      return (
                        <div
                          key={p._id}
                          className={`el-ao-target-pill ${isSel ? "selected" : ""}`}
                          onClick={() => toggleProductSelection(p._id)}
                        >
                          {isSel && <Check size={12} />}
                          <span>{p.name} (₹{p.price})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {targetClass === "referral" && (
                <>
                  <div className="el-ao-field">
                    <label className="el-ao-label">
                      REFERRER REWARD (₹) <span className="el-ao-req">*</span>
                    </label>
                    <div className="el-ao-input-wrap">
                      <Gift size={16} className="el-ao-input-icon" />
                      <input
                        type="number"
                        className="el-ao-input"
                        value={referrerReward}
                        onChange={(e) => setReferrerReward(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="el-ao-field">
                    <label className="el-ao-label">
                      REFEREE WELCOME BONUS (₹) <span className="el-ao-req">*</span>
                    </label>
                    <div className="el-ao-input-wrap">
                      <DollarSign size={16} className="el-ao-input-icon" />
                      <input
                        type="number"
                        className="el-ao-input"
                        value={refereeReward}
                        onChange={(e) => setRefereeReward(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="el-ao-field">
                <label className="el-ao-label">
                  DISCOUNT VALUE <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Percent size={16} className="el-ao-input-icon" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={offerType === "percentage" ? "100" : undefined}
                    className="el-ao-input"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    required
                  />
                  <span className="el-ao-concession-badge">
                    {offerType === "percentage" ? "% OFF" : "₹ FLAT"}
                  </span>
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">
                  ACTIVATION / START DATE <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Calendar size={16} className="el-ao-input-icon" />
                  <input
                    type="date"
                    className="el-ao-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">
                  EXPIRATION / END DATE <span className="el-ao-req">*</span>
                </label>
                <div className="el-ao-input-wrap">
                  <Calendar size={16} className="el-ao-input-icon" />
                  <input
                    type="date"
                    className="el-ao-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="el-ao-field">
                <label className="el-ao-label">PROTOCOL STATUS & DISPATCH</label>
                <div className="el-ao-status-box">
                  <span className="el-ao-status-text">
                    {isActive ? "Active Protocol" : "Draft Mode"}
                  </span>
                  <label className="el-ao-toggle-switch">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    <span className="el-ao-slider" />
                  </label>
                </div>
              </div>
            </div>

            <div className="el-ao-actions">
              <button
                type="button"
                className="el-ao-btn-cancel"
                onClick={() => navigate("/admin/offers")}
              >
                CANCEL
              </button>

              <button
                type="submit"
                className="el-ao-btn-publish"
                disabled={submitting}
              >
                <Save size={14} />
                <span>{submitting ? "Updating..." : "Update Offer"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditOffer;
