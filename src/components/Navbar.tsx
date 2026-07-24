import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface DropdownItem {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  path?: string;
  items?: DropdownItem[];
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'MBL', path: '/mbl-register' },
  // { label: 'New Entry', path: '/mbl' },
  {
    label: 'Masters',
    items: [
      { label: 'Carrier Master', path: '/masters/carriers' },
      { label: 'MLO Master', path: '/masters/mlos' },
      { label: 'Loading Port Master', path: '/masters/loading-ports' },
      { label: 'Delivery Port Master', path: '/masters/delivery-ports' },
    ],
  },
  {
    label: 'Report',
    adminOnly: true,
    items: [
      { label: 'Pending Statement', path: '/pending-statement' },
    ],
  },
  { label: 'Location', path: '/location' },
  {
    label: 'Admin',
    adminOnly: true,
    items: [
      { label: 'Register User', path: '/admin/register-user' },
      { label: 'Register Profile', path: '/admin/register-profile' },
      { label: 'Change Password', path: '/admin/change-password' },
    ],
  },
  {
    label: 'Accounting',
    adminOnly: true,
    items: [
      { label: 'View Invoice', path: '/accounting/invoice' },
    ],
  },
];

const Dropdown = ({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="dropdown-menu">
      {items.map((item) => (
        <span
          key={item.path}
          className="dropdown-item"
          onClick={() => {
            navigate(item.path);
            onClose();
          }}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
};

const Navbar: React.FC = () => {
  const { user, logout, hasRole, selectedLocation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path?: string) => Boolean(path && location.pathname.startsWith(path));

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-left">
        <a
          href="/mbl"
          className="navbar-brand"
          onClick={(event) => {
            event.preventDefault();
            navigate('/mbl');
          }}
        >
          EDISS SEA
        </a>
        <ul className="nav-links">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !hasRole(['master_admin', 'admin'])) {
              return null;
            }

            if (item.path) {
              return (
                <li key={item.label} className="nav-item">
                  <button
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => navigate(item.path || '/mbl')}
                  >
                    {item.label}
                  </button>
                </li>
              );
            }

            return (
              <li key={item.label} className="nav-item">
                <button
                  className="nav-link"
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                >
                  {item.label} <span className="caret">v</span>
                </button>
                {openDropdown === item.label && item.items && (
                  <Dropdown items={item.items} onClose={() => setOpenDropdown(null)} />
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="nav-right">
        <span className="nav-user">
          {(user?.username || 'USER').toUpperCase()}
          {' · '}
          {selectedLocation?.customs_house_code || user?.customs_house_code || 'NO-PORT'}
        </span>
        <button className="nav-link" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
