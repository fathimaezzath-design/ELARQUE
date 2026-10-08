import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  Layers,
  CheckCircle2,
  XCircle,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import './CategoryManagement.css';

const API_BASE_URL = 'http://localhost:5000/api/admin/categories';
const PAGE_LIMIT = 10;

const CategoryManagement = () => {
  const navigate = useNavigate();

  // Listing state variables
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  // Success message state
  const [successMessage, setSuccessMessage] = useState('');

  // Add Category Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    image: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitError, setFormSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Category Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    image: '',
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editFormSubmitError, setEditFormSubmitError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Category Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Auto-dismiss success notification banner after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch categories when currentPage, debouncedSearch, or retryCount changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      const adminToken = localStorage.getItem('adminToken');

      if (!adminToken) {
        navigate('/admin/login');
        return;
      }

      try {
        const params = {
          page: currentPage,
          limit: PAGE_LIMIT,
        };

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        const response = await axios.get(API_BASE_URL, {
          params,
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (response.data && response.data.success) {
          const fetchedCategories = response.data.categories || [];
          const fetchedTotalPages = response.data.totalPages || 0;
          const fetchedTotal = response.data.totalCategories || 0;

          // Pagination edge case: if current page is beyond totalPages and totalPages > 0
          if (fetchedTotalPages > 0 && currentPage > fetchedTotalPages) {
            setCurrentPage(fetchedTotalPages);
            return;
          }

          setCategories(fetchedCategories);
          setTotalPages(fetchedTotalPages);
          setTotalCategories(fetchedTotal);
          setErrorMessage('');
        } else {
          setErrorMessage('Unable to load categories.');
        }
      } catch (error) {
        // Ignore abort/cancel errors
        if (
          axios.isCancel(error) ||
          error.name === 'CanceledError' ||
          error.code === 'ERR_CANCELED'
        ) {
          return;
        }
        if (!isMounted) return;

        // 401 Unauthorized -> clear ONLY admin credentials and redirect to /admin/login
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          navigate('/admin/login');
          return;
        }

        setErrorMessage('Unable to load categories. Please try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [currentPage, debouncedSearch, retryCount, navigate]);

  // Search input change handler
  const handleSearchChange = (e) => {
    setLoading(true);
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Clear search input: resets query, debounced search, and page
  const handleClearSearch = () => {
    setLoading(true);
    setSearchQuery('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };

  // Page change handler
  const handlePageChange = (newPage) => {
    setLoading(true);
    setCurrentPage(newPage);
  };

  // Retry handler
  const handleRetry = () => {
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  // Open Add Category Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
      image: '',
    });
    setFormErrors({});
    setFormSubmitError('');
    setIsAddModalOpen(true);
  };

  // Close Add Category Modal
  const handleCloseAddModal = () => {
    if (submitting) return;
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      description: '',
      status: 'active',
      image: '',
    });
    setFormErrors({});
    setFormSubmitError('');
  };

  // Add form input change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (formSubmitError) {
      setFormSubmitError('');
    }
  };

  // Submit Add Category form
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();

    // 1. Frontend validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setFormErrors({ name: 'Category name is required.' });
      return;
    }

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    setSubmitting(true);
    setFormSubmitError('');

    try {
      const payload = {
        name: trimmedName,
        description: formData.description.trim(),
        status: formData.status,
        image: formData.image.trim(),
      };

      const response = await axios.post(API_BASE_URL, payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.success) {
        // Close modal, reset form and show success message
        setIsAddModalOpen(false);
        setFormData({
          name: '',
          description: '',
          status: 'active',
          image: '',
        });
        setFormErrors({});
        setFormSubmitError('');
        setSuccessMessage('Category created successfully.');

        // Trigger backend re-fetch
        setLoading(true);
        setRetryCount((prev) => prev + 1);
      } else {
        setFormSubmitError(
          response.data?.message || 'Unable to create category.'
        );
      }
    } catch (error) {
      // 401 Unauthorized -> clear ONLY admin credentials and redirect to /admin/login
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      if (error.response?.status === 409) {
        setFormSubmitError('Category name already exists.');
      } else if (error.response?.status === 400) {
        setFormSubmitError(
          error.response.data?.message || 'Category name is required.'
        );
      } else {
        setFormSubmitError('Unable to create category. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Category Modal
  const handleOpenEditModal = (cat) => {
    setSelectedCategory(cat);
    setEditFormData({
      name: cat.name || '',
      description: cat.description || '',
      status: cat.status || 'active',
      image: cat.image || '',
    });
    setEditFormErrors({});
    setEditFormSubmitError('');
    setIsEditModalOpen(true);
  };

  // Close Edit Category Modal
  const handleCloseEditModal = () => {
    if (editSubmitting) return;
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    setEditFormData({
      name: '',
      description: '',
      status: 'active',
      image: '',
    });
    setEditFormErrors({});
    setEditFormSubmitError('');
  };

  // Edit form input change handler
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) {
      setEditFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (editFormSubmitError) {
      setEditFormSubmitError('');
    }
  };

  // Submit Edit Category form
  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();

    if (!selectedCategory) return;

    // 1. Frontend validation
    const trimmedName = editFormData.name.trim();
    if (!trimmedName) {
      setEditFormErrors({ name: 'Category name is required.' });
      return;
    }

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    setEditSubmitting(true);
    setEditFormSubmitError('');

    try {
      const payload = {
        name: trimmedName,
        description: editFormData.description.trim(),
        status: editFormData.status,
        image: editFormData.image.trim(),
      };

      const response = await axios.patch(
        `${API_BASE_URL}/${selectedCategory.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.success) {
        setIsEditModalOpen(false);
        setSelectedCategory(null);
        setEditFormData({
          name: '',
          description: '',
          status: 'active',
          image: '',
        });
        setEditFormErrors({});
        setEditFormSubmitError('');
        setSuccessMessage('Category updated successfully.');

        // Refresh category listing from backend
        setLoading(true);
        setRetryCount((prev) => prev + 1);
      } else {
        setEditFormSubmitError(
          response.data?.message || 'Unable to update category.'
        );
      }
    } catch (error) {
      // 401 Unauthorized -> clear ONLY admin credentials and redirect to /admin/login
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      if (error.response?.status === 409) {
        setEditFormSubmitError('Category name already exists.');
      } else if (error.response?.status === 404) {
        setEditFormSubmitError('Category not found.');
      } else if (error.response?.status === 400) {
        setEditFormSubmitError(
          error.response.data?.message || 'Category name is required.'
        );
      } else {
        setEditFormSubmitError('Unable to update category. Please try again.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Close Delete Confirmation Modal
  const handleCloseDeleteModal = () => {
    if (deleting) return;
    setIsDeleteModalOpen(false);
    setCategoryToDelete(null);
    setDeleteError('');
  };

  // Confirm Delete Category (Soft delete via PATCH /api/admin/categories/:id/delete)
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/admin/login');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/${categoryToDelete.id}/delete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
        setDeleteError('');
        setSuccessMessage('Category deleted successfully.');

        // Refresh category list from backend
        setLoading(true);
        setRetryCount((prev) => prev + 1);
      } else {
        setDeleteError(response.data?.message || 'Unable to delete category.');
      }
    } catch (error) {
      // 401 Unauthorized -> clear ONLY admin credentials and redirect to /admin/login
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
        return;
      }

      if (error.response?.status === 404) {
        setDeleteError(
          'Category not found. It may already have been deleted.'
        );
      } else if (error.response?.status === 400) {
        setDeleteError(
          error.response.data?.message || 'Unable to delete this category.'
        );
      } else {
        setDeleteError('Unable to delete category. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Summary counts based on loaded page categories
  const activeCountOnPage = categories.filter(
    (c) => c.status === 'active'
  ).length;
  const inactiveCountOnPage = categories.filter(
    (c) => c.status === 'inactive'
  ).length;

  // Pagination bounds calculation
  const startIndex =
    totalCategories === 0 ? 0 : (currentPage - 1) * PAGE_LIMIT + 1;
  const endIndex =
    totalCategories === 0
      ? 0
      : Math.min(startIndex + categories.length - 1, totalCategories);

  // Generate page numbers
  const pageNumbers = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="admin-categories-page">
      <div className="admin-categories-container">
        {/* Page Header */}
        <header className="admin-categories-header">
          <div className="admin-categories-title-group">
            <h1>Category Management</h1>
            <p>Manage product categories and organize your ELARQUE catalog.</p>
          </div>

          <div className="admin-header-actions">
            <button
              type="button"
              className="admin-btn-add-category"
              onClick={handleOpenAddModal}
              title="Add New Category"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Category</span>
            </button>
          </div>
        </header>

        {/* Success Banner */}
        {successMessage && (
          <div className="admin-cat-success-banner" role="status">
            <div className="admin-cat-success-content">
              <CheckCircle2 size={18} color="#4ade80" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              className="admin-cat-banner-close-btn"
              onClick={() => setSuccessMessage('')}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Category Summary / Stats */}
        <section className="admin-stats-strip">
          <div className="admin-stat-card">
            <Layers size={18} color="#dfc28d" />
            <div>
              <div className="admin-stat-number">{totalCategories}</div>
              <div className="admin-stat-label">Total Categories</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <CheckCircle2 size={18} color="#4ade80" />
            <div>
              <div className="admin-stat-number">{activeCountOnPage}</div>
              <div className="admin-stat-label">Active (Page)</div>
            </div>
          </div>

          <div className="admin-stat-card">
            <XCircle size={18} color="#f87171" />
            <div>
              <div className="admin-stat-number">{inactiveCountOnPage}</div>
              <div className="admin-stat-label">Inactive (Page)</div>
            </div>
          </div>
        </section>

        {/* Search & Sort Toolbar */}
        <section className="admin-toolbar-card">
          <div className="admin-search-wrapper">
            <span className="admin-search-icon">
              <Search size={17} strokeWidth={2} />
            </span>
            <input
              type="text"
              className="admin-search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search categories..."
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-search-clear-btn"
                onClick={handleClearSearch}
                aria-label="Clear search input"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="admin-toolbar-meta">
            <div className="admin-sort-badge">
              <ArrowDownUp size={13} />
              <span>Sorted by Latest First</span>
            </div>
          </div>
        </section>

        {/* Category Table Card */}
        <section className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-categories-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. Loading State */}
                {loading ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-cat-loading-state">
                        <div className="admin-cat-spinner" />
                        <p>Loading categories...</p>
                      </div>
                    </td>
                  </tr>
                ) : errorMessage ? (
                  /* 2. Error State */
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-cat-error-state">
                        <AlertCircle size={32} color="#f87171" />
                        <p>{errorMessage}</p>
                        <button
                          type="button"
                          className="admin-cat-retry-btn"
                          onClick={handleRetry}
                        >
                          <RefreshCw size={14} />
                          <span>Retry</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : categories.length > 0 ? (
                  /* 3. Data Rows */
                  categories.map((cat) => (
                    <tr key={cat.id}>
                      {/* Image Thumbnail */}
                      <td className="admin-cat-image-cell">
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="admin-cat-image-thumb"
                          />
                        ) : (
                          <div
                            className="admin-cat-image-placeholder"
                            title="No image uploaded"
                          >
                            <ImageIcon size={20} strokeWidth={1.5} />
                          </div>
                        )}
                      </td>

                      {/* Category Name */}
                      <td className="admin-cat-name-cell">{cat.name}</td>

                      {/* Description */}
                      <td className="admin-cat-desc-cell">
                        {cat.description || '—'}
                      </td>

                      {/* Status Badge */}
                      <td>
                        {cat.status === 'active' ? (
                          <span className="admin-cat-badge admin-cat-badge-active">
                            <span className="admin-cat-badge-dot" />
                            Active
                          </span>
                        ) : (
                          <span className="admin-cat-badge admin-cat-badge-inactive">
                            <span className="admin-cat-badge-dot" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="admin-cat-date-cell">
                        {formatDate(cat.createdAt)}
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <div className="admin-cat-actions">
                          <button
                            type="button"
                            className="admin-cat-action-btn admin-cat-action-edit"
                            onClick={() => handleOpenEditModal(cat)}
                            aria-label={`Edit ${cat.name}`}
                            title="Edit Category"
                          >
                            <Pencil size={13} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="admin-cat-action-btn admin-cat-action-delete"
                            onClick={() => handleOpenDeleteModal(cat)}
                            aria-label={`Delete ${cat.name}`}
                            title="Delete Category"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  /* 4. Empty State */
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-cat-empty-state">
                        <div className="admin-cat-empty-icon">
                          <Layers size={36} strokeWidth={1.5} />
                        </div>
                        <h3>No categories found</h3>
                        <p>
                          {debouncedSearch
                            ? `No categories match "${debouncedSearch}".`
                            : 'There are no active categories in the catalog.'}
                        </p>
                        {debouncedSearch && (
                          <button
                            type="button"
                            className="admin-cat-empty-clear-btn"
                            onClick={handleClearSearch}
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 0 && !loading && !errorMessage && (
            <footer className="admin-pagination-bar">
              <div className="admin-pagination-info">
                Showing {startIndex}–{endIndex} of {totalCategories} categories
              </div>

              <div className="admin-pagination-nav">
                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`admin-page-btn ${
                      num === currentPage ? 'admin-page-btn-active' : ''
                    }`}
                    disabled={loading}
                    onClick={() => handlePageChange(num)}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  className="admin-page-btn"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  aria-label="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </footer>
          )}
        </section>
      </div>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <div
          className="admin-cat-modal-overlay"
          onClick={handleCloseAddModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-category-title"
        >
          <div
            className="admin-cat-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-cat-modal-header">
              <h2 id="add-category-title" className="admin-cat-modal-title">
                Add Category
              </h2>
              <button
                type="button"
                className="admin-cat-modal-close-btn"
                onClick={handleCloseAddModal}
                disabled={submitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Submission Error Banner */}
            {formSubmitError && (
              <div className="admin-cat-modal-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{formSubmitError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form
              className="admin-cat-modal-form"
              onSubmit={handleAddCategorySubmit}
              noValidate
            >
              {/* Category Name */}
              <div className="admin-cat-form-group">
                <label htmlFor="cat-name" className="admin-cat-form-label">
                  Category Name
                  <span className="admin-cat-form-label-required">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter category name"
                  disabled={submitting}
                  className={`admin-cat-form-input ${
                    formErrors.name ? 'admin-cat-form-input-error' : ''
                  }`}
                  autoFocus
                />
                {formErrors.name && (
                  <span className="admin-cat-form-error">
                    {formErrors.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="admin-cat-form-group">
                <label htmlFor="cat-desc" className="admin-cat-form-label">
                  Description
                </label>
                <textarea
                  id="cat-desc"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter category description"
                  disabled={submitting}
                  className="admin-cat-form-textarea"
                />
              </div>

              {/* Status */}
              <div className="admin-cat-form-group">
                <label htmlFor="cat-status" className="admin-cat-form-label">
                  Status
                </label>
                <select
                  id="cat-status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  disabled={submitting}
                  className="admin-cat-form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Category Image URL */}
              <div className="admin-cat-form-group">
                <label htmlFor="cat-image" className="admin-cat-form-label">
                  Category Image
                </label>
                <input
                  id="cat-image"
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleFormChange}
                  placeholder="Enter image URL"
                  disabled={submitting}
                  className="admin-cat-form-input"
                />
                <span className="admin-cat-form-help">
                  Optional image URL (image upload will be supported in a future update).
                </span>
              </div>

              {/* Modal Actions */}
              <div className="admin-cat-modal-actions">
                <button
                  type="button"
                  className="admin-cat-modal-btn-cancel"
                  onClick={handleCloseAddModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-cat-modal-btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="admin-cat-btn-spinner" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {isEditModalOpen && selectedCategory && (
        <div
          className="admin-cat-modal-overlay"
          onClick={handleCloseEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-category-title"
        >
          <div
            className="admin-cat-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="admin-cat-modal-header">
              <h2 id="edit-category-title" className="admin-cat-modal-title">
                Edit Category
              </h2>
              <button
                type="button"
                className="admin-cat-modal-close-btn"
                onClick={handleCloseEditModal}
                disabled={editSubmitting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Submission Error Banner */}
            {editFormSubmitError && (
              <div className="admin-cat-modal-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{editFormSubmitError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form
              className="admin-cat-modal-form"
              onSubmit={handleEditCategorySubmit}
              noValidate
            >
              {/* Category Name */}
              <div className="admin-cat-form-group">
                <label htmlFor="edit-cat-name" className="admin-cat-form-label">
                  Category Name
                  <span className="admin-cat-form-label-required">*</span>
                </label>
                <input
                  id="edit-cat-name"
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Enter category name"
                  disabled={editSubmitting}
                  className={`admin-cat-form-input ${
                    editFormErrors.name ? 'admin-cat-form-input-error' : ''
                  }`}
                  autoFocus
                />
                {editFormErrors.name && (
                  <span className="admin-cat-form-error">
                    {editFormErrors.name}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="admin-cat-form-group">
                <label htmlFor="edit-cat-desc" className="admin-cat-form-label">
                  Description
                </label>
                <textarea
                  id="edit-cat-desc"
                  name="description"
                  rows={3}
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  placeholder="Enter category description"
                  disabled={editSubmitting}
                  className="admin-cat-form-textarea"
                />
              </div>

              {/* Status */}
              <div className="admin-cat-form-group">
                <label htmlFor="edit-cat-status" className="admin-cat-form-label">
                  Status
                </label>
                <select
                  id="edit-cat-status"
                  name="status"
                  value={editFormData.status}
                  onChange={handleEditFormChange}
                  disabled={editSubmitting}
                  className="admin-cat-form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Category Image URL */}
              <div className="admin-cat-form-group">
                <label htmlFor="edit-cat-image" className="admin-cat-form-label">
                  Category Image
                </label>
                <input
                  id="edit-cat-image"
                  type="text"
                  name="image"
                  value={editFormData.image}
                  onChange={handleEditFormChange}
                  placeholder="Enter image URL"
                  disabled={editSubmitting}
                  className="admin-cat-form-input"
                />
                <span className="admin-cat-form-help">
                  Optional image URL (image upload will be supported in a future update).
                </span>
              </div>

              {/* Modal Actions */}
              <div className="admin-cat-modal-actions">
                <button
                  type="button"
                  className="admin-cat-modal-btn-cancel"
                  onClick={handleCloseEditModal}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-cat-modal-btn-submit"
                  disabled={editSubmitting}
                >
                  {editSubmitting ? (
                    <>
                      <span className="admin-cat-btn-spinner" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div
          className="admin-cat-modal-overlay"
          onClick={handleCloseDeleteModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div
            className="admin-cat-modal-card admin-cat-modal-card-confirm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <div className="admin-cat-delete-icon-wrapper">
              <AlertTriangle size={28} />
            </div>

            {/* Modal Header */}
            <div className="admin-cat-modal-header admin-cat-modal-header-no-border">
              <h2 id="delete-category-title" className="admin-cat-modal-title">
                Delete Category?
              </h2>
              <button
                type="button"
                className="admin-cat-modal-close-btn"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Delete Error Banner */}
            {deleteError && (
              <div className="admin-cat-modal-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Delete Confirmation Messages */}
            <p className="admin-cat-delete-prompt">
              Are you sure you want to delete{' '}
              <span className="admin-cat-delete-highlight">
                "{categoryToDelete.name}"
              </span>
              ?
            </p>

            <p className="admin-cat-delete-supporting">
              This category will be removed from the active category list. The category
              data will be retained in the system.
            </p>

            {/* Modal Actions */}
            <div className="admin-cat-modal-actions admin-cat-delete-actions">
              <button
                type="button"
                className="admin-cat-modal-btn-cancel"
                onClick={handleCloseDeleteModal}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-cat-modal-btn-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="admin-cat-btn-spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Category</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
