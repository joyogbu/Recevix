import { Routes, Route, Link } from 'react-router-dom';
import WalletSetup from './pages/WalletSetup';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import MagicLink from './pages/Confirmation_page';
import Onboarding from './pages/Onboarding.jsx';
import Signin from './pages/Signin.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ConnectWallet from './pages/ConnectWallet.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PayEscrow from './pages/PayEscrow.jsx';
import Receipt from './pages/Receipt.jsx';
import AuthCallback from './auth/Callback.jsx';

//import WalletChecker from './components/WalletChecker';

function App() {
	return (
		<div id ="container_div">
		
			
			<Routes>
				<Route path="/signup/wallet-setup" element={<WalletSetup />} />
				<Route path="/" element={ <Home /> } />
				<Route path="/signup" element={ <Signup /> } />
				<Route path="/signup/confirmation" element={ <MagicLink /> } />
				<Route path="/signup/complete_signup" element={ <Onboarding /> } />
				<Route path="/login" element={ <Signin /> } />
				<Route path="/connect_wallet" element={ <ConnectWallet /> } />
				<Route path="/dashboard" element={
				<ProtectedRoute>	
					<Dashboard /> 
				</ProtectedRoute>}
				/>
				<Route path="/pay/:invoiceId" element={ <PayEscrow /> } />
				<Route path="/pay/receipt" element={ <Receipt /> } />
				<Route path="/auth/callback" element={ <AuthCallback /> } />
			</Routes>
		</div>
	);
}


export default App;
