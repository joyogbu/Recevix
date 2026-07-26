import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaCog, FaExchangeAlt, FaArrowRight, FaRegClone, FaDollarSign, FaFileInvoiceDollar, FaSignOutAlt, FaUser, FaBell, FaWallet, FaCoins, FaCheckCircle, FaClock, FaHistory, FaPaperPlane } from 'react-icons/fa';
import { supabase } from '../lib/supabase.js';
import PaymentLink from '../components/PaymentLink.jsx';
import SendTransaction from '../components/SendTransaction.jsx';
import { MerchantProvider, useMerchant, } from '../auth/MerchantContext.jsx';
import Footer from '../components/Footer.jsx';
import logo from '../images/jopay.jpg'
import usdc from '../images/usdc1.png'
import recevix from '../images/recevix.png';

function DashboardHeader() {
  const {merchant, invoices, walletBalance} = useMerchant();
  const [copyWallet, setCopyWallet] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isDropdown, setIsDropdown] = useState(false);
  const walletAddress = merchant?.circle_wallet_address;
  
  const trimAddress = walletAddress ? `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}` : "";
  const copyAddress = async () => {
	  await navigator.clipboard.writeText(walletAddress);
	  setIsCopied(true);
	  setTimeout(() => {
		  setIsCopied(false);
	  }, 500);
  }
  function dropNotis() {
	setIsDropdown(!isDropdown);
  }
  const notifications = invoices.filter(invoice => invoice.status === "Escrowed" || invoice.status === "Paid" );
  const notificationCount = invoices.filter(invoice => invoice.status === "Escrowed").length;

  return (
    <div id="dashboard_top_div">





	<div className={`notification_div ${isDropdown ? "show_notis" : ""}`}>
                        <p><u>Notifications</u></p>


                        {notifications.length === 0 ? (
                                <p>No notifications.</p>
                        ) : (
                                notifications.map(invoice => (
                                        <div key={invoice.invoice_id} className="notification-item">
                                        <span><b>{`${invoice.customer_name}: ` }</b></span><span><b>{invoice.description}</b></span>
                                        {invoice.status === "Escrowed" && ( <p> {invoice.amount} USDC has been deposited into escrow. </p>)}
                                        {invoice.status === "Paid" && ( <p> {invoice.amount} USDC has been released successfully.</p>)}
                                        <small>{new Date(invoice.released_at).toLocaleString()}</small>
                                        </div>
                                ))
                        )}



                </div>






	  <div id="logo_name" className="top_div">
	  	<div className="logo_div" id="logo">
	  		<img src={ recevix } className="_logo" />

	  	</div>
	  </div>
	  <div className="top_div" id="notis">
	  	<button id="notification_bell" onClick={dropNotis}><FaBell /></button>
	  	{notificationCount > 0 && (
			<span className="badge">{notificationCount}
			</span>
		)}
	  	
	  </div>
	  <div className="top_div" id="user_wallet">
	  	<div id="profile_img">
	  		<span>{Number(walletBalance).toFixed(2) ?? "0"} USDC</span>
	  	</div>
	  	<div id="_wallet">
	  		<span>{ trimAddress }</span><span><button className="copy_link" onClick={ copyAddress }>{isCopied ? "Copied!" : <FaRegClone />}</button></span>
	  	</div>
	  </div>
    </div>
  );
}

function Sidebar() {
	const [isOpen, setIsOpen] = useState(false);

	const [isSend, setIsSend] = useState(false);

	const navigate = useNavigate();

    useEffect(() => {
    const handleResize = () => {
        setIsOpen(window.innerWidth >= 768);
    };

    handleResize(); // run once on mount

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
}, []);

	//Display the send transaction modal box
	function showUsdc() {
		setIsSend(true);
	}

	//close send transaction modal box
	function closeUsdc() {
		setIsSend(false);
	}

	function toggle() {
		setIsOpen(!isOpen);
	}

	const handleSignout = async () => {
		await supabase.auth.signOut();
		navigate("/");
	};

	return (
		<div className = {`sidebar ${isOpen ? "open" : "close"}`}>
			<br />
			<span><button className="bttn_right" onClick = { toggle }> {isOpen ? "✕" : "☰"}</button></span>
			<br />	<br />	
			{isOpen && <div id="logo_box"><span className="_name"><img src= {logo} className ="logo_icon" /></span></div>}
			{isOpen && <hr />}
			<ul className="sidebar_links">
				<li><Link to="/"><FaHome />{isOpen && <span className="sidebar_link">Home</span>}</Link></li><br />

				<li><button className="sidebar_btn" type="button" onClick={showUsdc} ><FaPaperPlane />{isOpen && <span className="sidebar_link">Send USDC</span>}</button></li><br />
				{isSend && (<SendTransaction closeUsdc={closeUsdc} />)}

				<li><Link to="/transactions"><FaExchangeAlt /> {isOpen && <span className="sidebar_link">Transactions</span>}</Link></li><br />
				<li><Link to="/payment"><FaDollarSign />{isOpen && <span className="sidebar_link">Payment</span>}</Link></li><br />
				<li><Link to="/settings"><FaCog />{isOpen && <span className="sidebar_link">Settings</span>}</Link></li><br />
				<li><button className="sidebar_btn" type="button" onClick={ handleSignout }><FaSignOutAlt />{isOpen && <span className="sidebar_link">Sign out</span>}</button></li>
			</ul>
			
		
			
		</div>
	);
}

function DashboardBody() {
	const {merchant, walletBalance} = useMerchant();
	const[isModal, setIsModal] = useState(false);
	function showModal() {
		setIsModal(true);
        }
	function closeModal() {
		setIsModal(false);
	}
	return (
		<div id="dashboard_body">
			<h2>Hello, {merchant?.merchant_name} </h2>
			<p>Receive USDC payment Instantly from anywhere through simple payment links</p>
			<button id="generate_link" onClick={showModal}>Generate Payment Link</button>
		
			{isModal && (<PaymentLink closeModal={closeModal} />)}
		</div>
	);
}

function TotalTxn() {
	const {invoiceStats, walletBalance} = useMerchant();
        return (
                <div className="transactions">
		    <h3>Your Activity</h3>
		    <div id="txn_boxes" className="clearfix">
			<div className="usdc_box">
				<img className="usdc_1" src={usdc} />
			</div>
			<br />
			<br />
                        <div className ="txn_box" id="total_inv">
				<span className="txn_fa_icons"><FaFileInvoiceDollar style={{color: "orange"}} size="2em" /></span><br /><br />
				<span className="invoice_value">{invoiceStats?.totalInvoices ?? "0"}</span><br />
                                <span>Total invoices generated</span><br />
                        </div>
                        <div className="txn_box" id="wallet_balance">
				<span className="txn_fa_icons"><FaWallet style={{color: "dodgerblue" }} size="2em"/></span><br /><br />
                            
                                <span className="invoice_value">{Number(walletBalance).toFixed(2) ?? "0"} USDC</span><br />
				<span>Wallet Balance</span><br />
			
                        </div>
			<div className="txn_box" id="paid_inv">
				<span className="txn_fa_icons"><FaCoins style={{color: "green" }} size="2em" /> </span><br /><br />
                                
                                <span className="invoice_value">{Number(invoiceStats?.totalVolume).toFixed(2) ?? "0"} USDC</span><br />
				<span>Total Volume</span>
                        </div>
                        <div className="txn_box" id="unpaid_inv">
				<span className="txn_fa_icons"><FaClock style={{color: "purple" }} size="2em" /></span><br /><br />
                            
                                <span className="invoice_value">{Number(invoiceStats?.receivables).toFixed(2) ?? "0"} USDC</span><br />
				<span>Pending invoices</span>
                        </div>
			<br />
			<br />
		    </div><br />
		    <br />			
		    <button className="view_transactions">View Transactions <FaArrowRight /></button>
		    <br /><br />
                </div>
        );
}

/*function InvoiceTable() {
	const {invoices} = useMerchant();

	return (
		<div className="invoice_history">
			<h1>Invoice History</h1>
			<div className="table_container"><table className="invoice-table">
			    <thead>
			        <tr>
				    <th>Invoice ID</th>
				    <th>Description</th>
            			    <th>Amount</th>
				    <th>Status</th>
				    <th>Date</th>
				</tr>
			    </thead>
			    <tbody>
				{invoices?.map((invoice) => (
				    <tr key={invoice?.invoice_id}>
				        <td>{invoice?.invoice_id}</td>
				        <td>{invoice?.description}</td>
				        <td>{Number(invoice?.amount).toFixed(2)} USDC</td>
				        <td> {invoice.status}</td>
				        <td>{new Date(invoice?.created_at).toLocaleDateString()}</td>
				    </tr>
				))}
			    </tbody>
			</table></div>

		</div>
	);
}*/

function Display() {
	return (
		<MerchantProvider>
			<div id="dashboard_page">
				<Sidebar />

                <div className="dashboard_content">
				    <DashboardHeader />
				    <DashboardBody />			
				    <TotalTxn />
				</div>
            </div>
			<Footer />	
			
		</MerchantProvider>
	);
}

export default Display;

