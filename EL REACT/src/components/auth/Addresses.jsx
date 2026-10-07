import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Phone,
  User,
  Home,
  X,
  Save,
} from "lucide-react";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../../services/addressService";

const initialFormState = {
  fullName: "",
  phone: "",
  house: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

function Addresses() {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchAddresses = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await getAddresses();
      if (res?.data?.addresses) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.error("GET ADDRESSES ERROR:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await getAddresses();
        if (isMounted && res?.data?.addresses) {
          setAddresses(res.data.addresses);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingId(addr._id);
    setFormData({
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      house: addr.house || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else {
      const clean = formData.phone.replace(/\s|\+91/g, "").trim();
      if (!/^[0-9]{10}$/.test(clean)) {
        newErrors.phone = "Enter a valid 10-digit phone number";
      }
    }
    if (!formData.house.trim()) newErrors.house = "House / Flat details are required";
    if (!formData.street.trim()) newErrors.street = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit pincode";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setActionLoading(true);
      const cleanPhone = formData.phone.replace(/\s|\+91/g, "").trim();
      const payload = {
        fullName: formData.fullName.trim(),
        phone: cleanPhone,
        house: formData.house.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
      };

      if (editingId) {
        await updateAddress(editingId, payload);
      } else {
        await addAddress(payload);
      }

      handleCloseModal();
      await fetchAddresses();
    } catch (err) {
      console.error("SAVE ADDRESS ERROR:", err);
      alert(err.response?.data?.message || "Failed to save address");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setActionLoading(true);
      await setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error("SET DEFAULT ADDRESS ERROR:", err);
      alert(err.response?.data?.message || "Failed to set default address");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setActionLoading(true);
      await deleteAddress(id);
      setDeleteConfirmId(null);
      await fetchAddresses();
    } catch (err) {
      console.error("DELETE ADDRESS ERROR:", err);
      alert(err.response?.data?.message || "Failed to delete address");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>

      <div className="addresses-page">
        {/* Header */}
        <div className="addresses-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft size={16} />
            <span>Back to Profile</span>
          </button>

          <div className="header-title-row">
            <div>
              <h1>Saved Addresses</h1>
              <p>Manage your luxury delivery destinations</p>
            </div>

            <button
              type="button"
              className="add-address-btn"
              onClick={handleOpenAddModal}
            >
              <Plus size={18} />
              <span>Add New Address</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="addresses-content">
          {loading ? (
            <div className="addresses-loading">
              <div className="addresses-spinner" />
              <p>Loading your saved addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="addresses-empty">
              <div className="empty-icon-box">
                <MapPin size={36} />
              </div>
              <h2>No Saved Addresses</h2>
              <p>You haven't added any delivery addresses yet.</p>
              <button
                type="button"
                className="add-address-btn"
                onClick={handleOpenAddModal}
              >
                <Plus size={18} />
                <span>Add First Address</span>
              </button>
            </div>
          ) : (
            <div className="address-grid">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className={`address-card ${addr.isDefault ? "is-default" : ""}`}
                >
                  {addr.isDefault && (
                    <div className="default-badge">
                      <CheckCircle2 size={13} />
                      <span>Default Address</span>
                    </div>
                  )}

                  <div className="card-recipient">
                    <User size={16} className="card-icon" />
                    <h3>{addr.fullName}</h3>
                  </div>

                  <div className="card-phone">
                    <Phone size={14} className="card-icon" />
                    <span>+91 {addr.phone}</span>
                  </div>

                  <div className="card-location">
                    <Home size={14} className="card-icon" />
                    <p>
                      {addr.house}, {addr.street}
                      <br />
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>

                  <div className="card-actions">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        className="set-default-btn"
                        onClick={() => handleSetDefault(addr._id)}
                        disabled={actionLoading}
                      >
                        Set as Default
                      </button>
                    )}

                    <div className="action-icons">
                      <button
                        type="button"
                        className="icon-action-btn edit-btn"
                        onClick={() => handleOpenEditModal(addr)}
                        title="Edit Address"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-action-btn delete-btn"
                        onClick={() => setDeleteConfirmId(addr._id)}
                        title="Delete Address"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseModal}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group full-width">
                <label>Recipient Name</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Fathima Swaliha"
                  value={formData.fullName}
                  onChange={handleChange}
                />
                {errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>

              <div className="form-group full-width">
                <label>Phone Number (10 Digits)</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group full-width">
                <label>House / Flat / Building No.</label>
                <input
                  type="text"
                  name="house"
                  placeholder="e.g. Villa 42, Green Valley"
                  value={formData.house}
                  onChange={handleChange}
                />
                {errors.house && <span className="error-text">{errors.house}</span>}
              </div>

              <div className="form-group full-width">
                <label>Street / Locality</label>
                <input
                  type="text"
                  name="street"
                  placeholder="e.g. Grand Avenue Road"
                  value={formData.street}
                  onChange={handleChange}
                />
                {errors.street && <span className="error-text">{errors.street}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Kochi"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  {errors.city && <span className="error-text">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    placeholder="e.g. Kerala"
                    value={formData.state}
                    onChange={handleChange}
                  />
                  {errors.state && <span className="error-text">{errors.state}</span>}
                </div>
              </div>

              <div className="form-group full-width">
                <label>Pincode (6 Digits)</label>
                <input
                  type="text"
                  name="pincode"
                  placeholder="e.g. 682001"
                  value={formData.pincode}
                  onChange={handleChange}
                  maxLength={6}
                />
                {errors.pincode && <span className="error-text">{errors.pincode}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={actionLoading}
                >
                  <Save size={16} />
                  <span>{actionLoading ? "Saving..." : "Save Address"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="modal-card confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <Trash2 size={28} />
            </div>
            <h2>Delete Address?</h2>
            <p>
              Are you sure you want to remove this address from your saved
              addresses list?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setDeleteConfirmId(null)}
                disabled={actionLoading}
              >
                Keep Address
              </button>
              <button
                type="button"
                className="modal-delete-btn"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete Address"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = `
  .addresses-page {
    min-height: 100vh;
    background: #faf6f1;
    padding: 40px 7%;
    color: #2d1b1f;
    font-family: 'Poppins', sans-serif;
  }

  .addresses-header {
    max-width: 1100px;
    margin: 0 auto 35px;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: #6b1f2a;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s ease;
  }

  .back-btn:hover {
    opacity: 0.75;
  }

  .header-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 18px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-title-row h1 {
    margin: 0 0 6px;
    font-family: "Cormorant Garamond", serif;
    font-size: 40px;
    font-weight: 600;
    color: #4a0f19;
    letter-spacing: -0.5px;
  }

  .header-title-row p {
    margin: 0;
    color: #777;
    font-size: 14px;
  }

  .add-address-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: #6b1f2a;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 12px rgba(107, 31, 42, 0.18);
  }

  .add-address-btn:hover {
    background: #4a0f19;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(107, 31, 42, 0.25);
  }

  .addresses-content {
    max-width: 1100px;
    margin: 0 auto;
  }

  .addresses-loading {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6b1f2a;
    gap: 16px;
  }

  .addresses-spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #eee;
    border-top: 3px solid #6b1f2a;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .addresses-empty {
    background: #ffffff;
    border: 1px solid #e8dfd5;
    border-radius: 14px;
    padding: 60px 24px;
    text-align: center;
    max-width: 500px;
    margin: 40px auto;
  }

  .empty-icon-box {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #faf6f1;
    color: #6b1f2a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .addresses-empty h2 {
    font-family: "Cormorant Garamond", serif;
    font-size: 26px;
    color: #4a0f19;
    margin: 0 0 8px;
  }

  .addresses-empty p {
    color: #888;
    font-size: 14px;
    margin: 0 0 24px;
  }

  .address-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .address-card {
    background: #ffffff;
    border: 1px solid #e8dfd5;
    border-radius: 14px;
    padding: 24px;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: all 0.25s ease;
  }

  .address-card:hover {
    border-color: #c49e60;
    box-shadow: 0 8px 24px rgba(82, 8, 20, 0.06);
  }

  .address-card.is-default {
    border-color: #6b1f2a;
    background: #fdfbf9;
  }

  .default-badge {
    position: absolute;
    top: 18px;
    right: 18px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: #6b1f2a;
    color: #ffffff;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 12px;
    letter-spacing: 0.3px;
  }

  .card-recipient {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .card-recipient h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #4a0f19;
  }

  .card-phone {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #666;
    font-size: 13px;
    margin-bottom: 14px;
  }

  .card-location {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    color: #444;
    font-size: 13.5px;
    line-height: 1.6;
    margin-bottom: 20px;
    flex: 1;
  }

  .card-location p {
    margin: 0;
  }

  .card-icon {
    color: #6b1f2a;
    flex-shrink: 0;
    margin-top: 3px;
  }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid #f0e8e2;
    gap: 12px;
  }

  .set-default-btn {
    background: transparent;
    border: 1px solid #d4c6bc;
    color: #6b1f2a;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .set-default-btn:hover {
    background: #6b1f2a;
    color: #ffffff;
    border-color: #6b1f2a;
  }

  .action-icons {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .icon-action-btn {
    width: 34px;
    height: 34px;
    border-radius: 6px;
    border: 1px solid #e8dfd5;
    background: #faf6f1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .icon-action-btn.edit-btn {
    color: #4a0f19;
  }

  .icon-action-btn.edit-btn:hover {
    background: #6b1f2a;
    color: #ffffff;
    border-color: #6b1f2a;
  }

  .icon-action-btn.delete-btn {
    color: #a82937;
  }

  .icon-action-btn.delete-btn:hover {
    background: #a82937;
    color: #ffffff;
    border-color: #a82937;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(45, 27, 31, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 16px;
    max-width: 540px;
    width: 100%;
    padding: 32px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .modal-header h2 {
    margin: 0;
    font-family: "Cormorant Garamond", serif;
    font-size: 28px;
    color: #4a0f19;
  }

  .modal-close-btn {
    border: none;
    background: transparent;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
  }

  .modal-close-btn:hover {
    color: #222;
  }

  .modal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 6px;
    font-size: 12.5px;
    font-weight: 500;
    color: #4a0f19;
  }

  .form-group input {
    width: 100%;
    height: 44px;
    padding: 0 14px;
    border: 1px solid #dcd3cb;
    border-radius: 8px;
    background: #fdfcfb;
    font-size: 13.5px;
    font-family: inherit;
    color: #2d1b1f;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
  }

  .form-group input:focus {
    border-color: #6b1f2a;
    background: #ffffff;
  }

  .error-text {
    color: #c92a2a;
    font-size: 11.5px;
    margin-top: 4px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
  }

  .modal-cancel-btn {
    padding: 10px 20px;
    border: 1px solid #dcd3cb;
    background: #ffffff;
    color: #555;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
  }

  .modal-cancel-btn:hover {
    background: #faf6f1;
  }

  .modal-submit-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border: none;
    background: #6b1f2a;
    color: #ffffff;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .modal-submit-btn:hover {
    background: #4a0f19;
  }

  .confirm-card {
    max-width: 420px;
    text-align: center;
    padding: 36px 28px;
  }

  .confirm-icon-box {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #ffe3e3;
    color: #c92a2a;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;
  }

  .confirm-card h2 {
    font-family: "Cormorant Garamond", serif;
    font-size: 26px;
    color: #4a0f19;
    margin: 0 0 10px;
  }

  .confirm-card p {
    color: #666;
    font-size: 13.5px;
    line-height: 1.5;
    margin: 0 0 24px;
  }

  .modal-delete-btn {
    padding: 10px 22px;
    border: none;
    background: #c92a2a;
    color: #ffffff;
    border-radius: 8px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }

  .modal-delete-btn:hover {
    background: #a82020;
  }

  @media (max-width: 600px) {
    .addresses-page {
      padding: 24px 5%;
    }
    .form-row {
      grid-template-columns: 1fr;
    }
  }
`;

export default Addresses;
