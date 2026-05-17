import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage.jsx';
import { SanListPage } from './pages/SanListPage.jsx';
import { FieldSchedulePage } from './pages/FieldSchedulePage.jsx';
import { BookingPage } from './pages/BookingPage.jsx';
import { HistoryPage } from './pages/HistoryPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/san-bong" element={<SanListPage />} />
      <Route path="/lich-san" element={<FieldSchedulePage />} />
      <Route path="/dat-san" element={<BookingPage />} />
      <Route path="/lich-su" element={<HistoryPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
