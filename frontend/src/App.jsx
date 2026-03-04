import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import './App.css';

// Import all your pages
import Login from './pages/Login';
import Register from './pages/Register';
import Customer from './pages/Customer';
import Driver from './pages/Driver';
import Admin from './pages/Admin';
import ErrorPage from './pages/ErrorPage';

function App() {
  return (
    <RecoilRoot>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Role-based routes */}
          <Route path="/" element={<Customer />} />
          <Route path="/customer" element={<Customer />} />
          <Route path="/driver" element={<Driver />} />
          <Route path="/admin" element={<Admin />} />
          
          {/* Error route */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </RecoilRoot>
  );
}

export default App;