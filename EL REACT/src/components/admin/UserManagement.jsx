import React, { useState } from 'react';
import {
  Search,
  X,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import './UserManagement.css';

// Initial high-fidelity mock users sorted latest first (based strictly on User.js schema)
const INITIAL_MOCK_USERS = [
  {
    _id: '6704b1234567890123456781',
    fullName: 'Seraphina Vance',
    email: 'seraphina.vance@atelier.com',
    phoneNumber: '9876543210',
    isVerified: true,
    isBlocked: false,
    createdAt: '2026-10-06T14:22:00.000Z',
  },
  {
    _id: '6704b1234567890123456782',
    fullName: 'Julian St. Claire',
    email: 'julian.stclaire@couture.com',
    phoneNumber: '9812345678',
    isVerified: true,
    isBlocked: false,
    createdAt: '2026-10-04T10:15:00.000Z',
  },
  {
    _id: '6704b1234567890123456783',
    fullName: 'Helena Rostova',
    email: 'helena.rostova@el-maison.com',
    phoneNumber: '9823456789',
    isVerified: false,
    isBlocked: true,
    createdAt: '2026-09-29T18:45:00.000Z',
  },
  {
    _id: '6704b1234567890123456784',
    fullName: 'Dorian Thorne',
    email: 'dorian.thorne@elarque.org',
    phoneNumber: '9834567890',
    isVerified: true,
    isBlocked: false,
    createdAt: '2026-09-25T08:30:00.000Z',
  },
  {
    _id: '6704b1234567890123456785',
    fullName: 'Vivienne Laurent',
    email: 'vivienne.laurent@paris.com',
    phoneNumber: '9845678901',
    isVerified: true,
    isBlocked: false,
    createdAt: '2026-09-18T16:05:00.000Z',
  },
];

const UserManagement = () => {
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Block / Unblock Confirmation
  const [modalState, setModalState] = useState({
    isOpen: false,
    targetUser: null,
    action: 'block', // 'block' | 'unblock'
  });

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle Search Clear
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter display by search query (client-side preview only, no API call)
  const displayedUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phoneNumber.includes(q)
    );
  });

  // Open Confirmation Modal
  const handleOpenModal = (user, action) => {
    setModalState({
      isOpen: true,
      targetUser: user,
      action,
    });
  };

  // Close Confirmation Modal
  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      targetUser: null,
      action: 'block',
    });
  };

  // Confirm Modal Action (Frontend UI only in Step 8, no backend API call yet)
  const handleConfirmAction = () => {
    if (!modalState.targetUser) return;

    // Toggle mock state locally for visual verification
    setUsers((prev) =>
      prev.map((u) =>
        u._id === modalState.targetUser._id
          ? { ...u, isBlocked: modalState.action === 'block' }
          : u
      )
    );

    handleCloseModal();
  };

  // Format creation date helper
  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  // Get user avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Quick Stats counts
  const totalCount = users.length;
  const activeCount = users.filter((u) => !u.isBlocked).length;
  const blockedCount = users.filter((u) => u.isBlocked).length;

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">
        {/* Page Header */}
        <header className="admin-users-header">
          <div className="admin-users-title-group">
            <h1>User Management</h1>
            <p>Manage customer accounts, account status, and user access.</p>
          </div>

          <div className="admin-stats-strip">
            <div className="admin-stat-card">
              <Users size={18} color="#dfc28d" />
              <div>
                <div className="admin-stat-number">{totalCount}</div>
                <div className="admin-stat-label">Total Users</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <UserCheck size={18} color="#4ade80" />
              <div>
                <div className="admin-stat-number">{activeCount}</div>
                <div className="admin-stat-label">Active</div>
              </div>
            </div>

            <div className="admin-stat-card">
              <UserX size={18} color="#f87171" />
              <div>
                <div className="admin-stat-number">{blockedCount}</div>
                <div className="admin-stat-label">Blocked</div>
              </div>
            </div>
          </div>
        </header>

        {/* Toolbar: Search and Sort Info */}
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
              placeholder="Search by name, email, or phone..."
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

        {/* User Table Card */}
        <section className="admin-table-card">
          <div className="admin-table-scroll">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone Number</th>
                  <th>Date Joined</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.length > 0 ? (
                  displayedUsers.map((user) => (
                    <tr key={user._id}>
                      {/* Customer Info */}
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-user-avatar">
                            {getInitials(user.fullName)}
                          </div>
                          <div className="admin-user-details">
                            <span className="admin-user-name">
                              {user.fullName}
                            </span>
                            <span className="admin-user-email">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>{user.phoneNumber || '—'}</td>

                      {/* Joined Date */}
                      <td>{formatDate(user.createdAt)}</td>

                      {/* Verification Status */}
                      <td>
                        {user.isVerified ? (
                          <span className="admin-badge admin-badge-verified">
                            <span className="admin-badge-dot" />
                            Verified
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-unverified">
                            <span className="admin-badge-dot" />
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Account Status */}
                      <td>
                        {user.isBlocked ? (
                          <span className="admin-badge admin-badge-blocked">
                            <span className="admin-badge-dot" />
                            Blocked
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-active">
                            <span className="admin-badge-dot" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td>
                        {user.isBlocked ? (
                          <button
                            type="button"
                            className="admin-action-btn admin-action-btn-unblock"
                            onClick={() => handleOpenModal(user, 'unblock')}
                          >
                            <ShieldCheck size={14} />
                            <span>Unblock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-action-btn admin-action-btn-block"
                            onClick={() => handleOpenModal(user, 'block')}
                          >
                            <ShieldAlert size={14} />
                            <span>Block</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="admin-empty-state">
                        <Users size={32} strokeWidth={1.5} />
                        <p>No customers match your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <footer className="admin-pagination-bar">
            <div className="admin-pagination-info">
              Showing 1–{displayedUsers.length} of {displayedUsers.length} users
            </div>

            <div className="admin-pagination-nav">
              <button
                type="button"
                className="admin-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                className="admin-page-btn admin-page-btn-active"
              >
                1
              </button>

              <button
                type="button"
                className="admin-page-btn"
                disabled
              >
                2
              </button>

              <button
                type="button"
                className="admin-page-btn"
                disabled
              >
                3
              </button>

              <button
                type="button"
                className="admin-page-btn"
                disabled={true}
                onClick={() => setCurrentPage((p) => p + 1)}
                aria-label="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
        </section>
      </div>

      {/* Reusable Confirmation Modal */}
      {modalState.isOpen && modalState.targetUser && (
        <div
          className="admin-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`admin-modal-icon-wrapper ${
                modalState.action === 'block'
                  ? 'admin-modal-icon-block'
                  : 'admin-modal-icon-unblock'
              }`}
            >
              {modalState.action === 'block' ? (
                <ShieldAlert size={28} />
              ) : (
                <ShieldCheck size={28} />
              )}
            </div>

            <h2 className="admin-modal-title">
              {modalState.action === 'block' ? 'Block User?' : 'Unblock User?'}
            </h2>

            <p className="admin-modal-description">
              {modalState.action === 'block' ? (
                <>
                  Are you sure you want to block{' '}
                  <span className="admin-modal-target-user">
                    {modalState.targetUser.fullName}
                  </span>{' '}
                  ({modalState.targetUser.email})? This will restrict their
                  ability to log in and access services.
                </>
              ) : (
                <>
                  Are you sure you want to unblock{' '}
                  <span className="admin-modal-target-user">
                    {modalState.targetUser.fullName}
                  </span>{' '}
                  ({modalState.targetUser.email})? This will restore their full
                  account access.
                </>
              )}
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn-cancel"
                onClick={handleCloseModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className={`admin-modal-btn-confirm ${
                  modalState.action === 'block'
                    ? 'admin-modal-btn-confirm-block'
                    : 'admin-modal-btn-confirm-unblock'
                }`}
                onClick={handleConfirmAction}
              >
                {modalState.action === 'block' ? 'Block User' : 'Unblock User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
