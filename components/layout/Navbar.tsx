import React, { useState } from 'react';
import { Page } from '../../types';

interface NavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, currentPage, setCurrentPage, children }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-white/20 text-white'
          : 'text-blue-100 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
};

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage }) => {
  const [isOpen, setIsOpen] = useState(false);

  const links: { page: Page; label: string }[] = [
    { page: 'dashboard', label: '首頁' },
    { page: 'data-manager', label: '資料管理' },
    { page: 'asset-management', label: '資產總覽' },
    { page: 'cashflow-management', label: '收支帳本' },
    { page: 'budget-missions', label: '預算檢視' },
    { page: 'investment-tracking', label: '投資追蹤' },
    { page: 'financial-goals', label: '目標進度' },
    { page: 'report-analysis', label: '報表分析' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">個人財務導航中心</h1>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-2">
              {links.map(link => (
                <NavLink key={link.page} page={link.page} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="bg-indigo-600 inline-flex items-center justify-center p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-500 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">開啟主選單</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {links.map(link => (
              <button
                key={link.page}
                onClick={() => {
                  setCurrentPage(link.page);
                  setIsOpen(false);
                }}
                className={`w-full text-left block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === link.page ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
