import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Home2 from './pages/Home2';
import Create_template from './pages/Create_template';
import Dashboard from './pages/Dashboard';
import Template from './pages/Template_page';

function App() {
    return (
        <div className="app-container">
            <Router>
                <div className="page-container">
                    <div className="content-container">
                        <Routes>
                            <Route path="/" element={<Home2 />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/homee" element={<Home />} />
                            <Route path="/ct" element={<Create_template />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="template" element={<Template />} />
                        </Routes>
                    </div>
                </div>
            </Router>
        </div>
    );
}

export default App;
