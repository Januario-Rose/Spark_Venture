
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BusinessProfile from "./pages/BusinessProfile";
import MyBusiness from "./pages/MyBusiness";
import Bookkeeping from "./pages/Bookkeeping";
import Opportunities from "./pages/Opportunities";
import Funding from "./pages/Funding";
import Market from "./pages/Market";
import Documents from "./pages/Documents";
import Resources from "./pages/Resources";
import Notifications from "./pages/Notifications";


const App = ()=> {
  const isBusinessRoute = useLocation().pathname.startsWith('/dashboard')

  return (
    <>
      <Toaster/>
      {!isBusinessRoute && <Navbar />}
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/features' element={<Features/>} />
        <Route path="/pricing" element={<Pricing/>}/>
        <Route path="/about" element={<About/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/login" element={<Login/>}/>

        {/* Business Routes */}
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/business-profile" element={<BusinessProfile/>}/>
        <Route path="/dashboard/my-business" element={<MyBusiness/>}/>
        <Route path="/dashboard/bookkeeping" element={<Bookkeeping />}/>
        <Route path="/dashboard/opportunities" element={<Opportunities/>}/>
        <Route path="/dashboard/funding" element={<Funding/>}/>
        <Route path="/dashboard/market" element={<Market/>}/>
        <Route path="/dashboard/documents" element={<Documents/>}/>
        <Route path="/dashboard/resources" element={<Resources />}/>
        <Route path="/dashboard/notifications" element={<Notifications/>}/>
      </Routes>
      {!isBusinessRoute && <Footer/>}
    </>
  );
};

export default App;
