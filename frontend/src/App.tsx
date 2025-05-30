import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./routes";


const App: React.FC = () => {
    return (
        <Router
            future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <AppRoutes />
        </Router>
    );
};

export default App;
