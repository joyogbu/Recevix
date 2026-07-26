import {useState, useEffect} from 'react';
import {supabase} from '../lib/supabase.js';
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import { useNavigate } from "react-router-dom";

export function WalletSetup() {
	const navigate = useNavigate();
	const [pageStatus, setPagestatus] = useState("Processing...");
	const sdk = new W3SSdk({                                                              appSettings: {                                 appId: import.meta.env.VITE_CIRCLE_APP_ID,                            },
	 });

	useEffect(() => {
		async function setup() {
			const {data: { user } } = await supabase.auth.getUser(
);
                        //if no session, redirect to sign up
                        if(!user) {
                                navigate("/signup");
                                return;
                        }
			await createCircleUser();
		}
		setup();
	}, []);




	async function invokeWithRetry(functionName, options = {}, retries = 3) {
		let lastError;

		for (let attempt = 1; attempt <= retries; attempt++) {
			const { data, error } = await supabase.functions.invoke(functionName, options);
			if (!error) {
				return { data, error: null };
			}

			lastError = error;
			console.log(`${functionName} failed (Attempt ${attempt}/${retries})`, error);

			//Wait before retrying
			await new Promise(resolve => setTimeout(resolve, 1500));
		}
		return { data: null, error: lastError };
	}


	async function createCircleUser() {
		const { data: dataUser, error: errorUser } = await invokeWithRetry("create-circle-user");
		if (errorUser) {
			console.error(errorUser);
			return;
		}
		
		//check if user already has a circle wallet
		if(dataUser.walletStatus === "created") {
			navigate("/dashboard");
			return;
		}

		setPagestatus("Setting up your profile...");

		setTimeout(async () => {await initializeUser();
		}, 3000 );
	}
                    



	async function initializeUser()  {
		console.log("user initialization started");
		const {data, error} = await invokeWithRetry("initialize-circle-user");
		if(error || !data) {
			return;
		}

		console.log(data);
		if(data.initialized === true) {
			console.log("user already initialized");

			setPagestatus("Please wait while we update your profile...");
			setTimeout(async () => { await syncWallet();
			}, 5000 );
			return;
		}


		console.log("SDK:", sdk);
		console.log("Initialize response:", data);
		sdk.setAuthentication({
			userToken: data.userToken,
			encryptionKey: data.encryptionKey,
		});

		setPagestatus("Creating your wallet...");

		console.log("SDK authenticated");
		console.log("Challenge ID:", data.challengeId);
		sdk.execute(data.challengeId, async (error, result) => {
			if(error){
				console.log("initialization challenge failed:", error);
				return;
			}
	
			console.log("Challenge completed:", result);
		
		

			console.log("my data:", data);
			console.log("any error:", error);
			setTimeout(async () => { await syncWallet();
			}, 5000 );
		});
	}

	
	async function syncWallet() {
		console.log("sync wallet started");
		const {data: syncData, error: syncError} = await invokeWithRetry("sync-circle-wallet");
		console.log("syncWallet response:", syncData);
		console.log("syncWallet error:", syncError);


		if(syncError || !syncData) {
			console.log("mrssage: there is error or no data");
			return;
		}

		console.log("syncWallet completed");

		setPagestatus("Wallet set up complete. Redirecting...");
		navigate("/dashboard");
	}

	async function getUser()  {
		console.log("user initialization started");
		const {data: getUserData, error: getUserError} = await supabase.functions.invoke("get-circle-user");
		if(getUserError){
			console.error(getUserError);
			return;
		}
		console.log("User info:", getUserData);
	}

	return (
		<>
			<p>{pageStatus}</p>
		</>
	);
}
export default WalletSetup;
