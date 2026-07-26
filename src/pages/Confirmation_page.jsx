import envelope from '../images/env1.png';
function MagicLink() {
	return (
		<div className="confirmation_div">
			<div className="envelope_box">
				<img className="envelope_big" src={envelope} />
			</div>
			<div className="confirmation_text_div">
				<h1>Check your inbox to activate your account</h1>
				<p id="confirmation_text">We have sent a verification link to your registered email address. Plick click the link to confirm your email and complete your profile. The link is active for 24 hours. Thank you.</p>
			</div>
		</div>	
	);
}

export default MagicLink;
