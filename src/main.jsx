import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

//import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config } from './config/Config.jsx';


import { BrowserRouter } from 'react-router-dom'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
	<WagmiProvider config={config}>
		<QueryClientProvider client= { queryClient }>
			<BrowserRouter>
    				<App />
			</BrowserRouter>
		</QueryClientProvider>
	</WagmiProvider>
  </StrictMode>,
)
