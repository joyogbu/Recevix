import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';

function ProtectedRoute({ children }) {
	const navigate = useNavigate();
	const [ isAuthenticated, setIsAuthenticated ] = useState(true);

	useEffect(() => {

		//check if user is logged in
		const checkUser = async () => {
			const { data: {user} } = await supabase.auth.getUser();

			if (!user) {

				setIsAuthenticated(false) 
				navigate("/");
				console.log("User?:", isAuthenticated);
				return;
				//return <Navigate to="/login" />;
			}
		}
		checkUser();
	}, []);

	return children;

}

export default ProtectedRoute;
