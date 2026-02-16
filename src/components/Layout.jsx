import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className={`app-layout ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main className="main-content">
                <div className="page-enter">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
