import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Home2 from './pages/Home2';
import Create_template from './pages/Create_template';

// import './App.css';zzz

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home2 />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/homee" element={<Home />} />
                <Route path="/ct" element={<Create_template />} />
            </Routes>
        </Router>
    );
}

export default App;
