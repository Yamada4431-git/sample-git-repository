import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useExport } from '../contexts/ExportContext';

const Header = () => {
  const { exportFunction } = useExport();
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">URL管理</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/" end>ホーム</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} to="/add">新規リンクを追加</NavLink>
            </li>
            {exportFunction && ( // Only show if export function is available
              <li className="nav-item ms-lg-3"> {/* Add some margin for larger screens */}
                <button 
                  className="btn btn-sm btn-outline-light" // Smaller, light outline button
                  onClick={exportFunction}
                >
                  CSVエクスポート
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;