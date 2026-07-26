import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

function Signin() {
        return (
		<>
                <div id="sign_in">
                        <h1>JoPay</h1>
                        <form>
                                <h2>Sign into your Jopay account</h2>
                               
                                <label>Email</label>
                                <input type="email"></input><br /><br />
                                
                                <button className="sign_in_btn" type="button" value="Sign in">Sign In</button><br />
                        </form><br />
                        
                        <h4 class="form_question">New to JoPay? <Link to="/signup">Create Account</Link></h4><br />
                </div>
		<Footer />
		</>
        )
}

export default Signin;
