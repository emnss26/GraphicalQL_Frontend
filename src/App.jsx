import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { CookiesProvider } from "react-cookie";

import HomePage from '../pages/General_Pages/Home.Page'
import LoginPage from '../pages/General_Pages/Login.Page';

import AECModelPage from '../pages/AEC_Model/AEC_Model'

function App() {
  return (
    <CookiesProvider>
      <Router>
        <Routes>
          <Route exact path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/aec-model" element={<AECModelPage />} />
          
        </Routes>
      </Router>
    </CookiesProvider>
  );
}

export default App
