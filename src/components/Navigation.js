import { ethers } from 'ethers';
import logo from '../assets/logo.svg';

const Navigation = ({ account, setAccount }) => {

    const connectHandler = async () => {
    try {
        if ( !window.ethereum ) {
            alert('MetaMask not detected');
            return;
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x7A69' }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x7A69',
                        chainName: 'Hardhat Localhost',
                        nativeCurrency: {
                            name: 'ETH',
                            symbol: 'ETH',
                            decimals: 18,
                        },
                        rpcUrls: ['http://127.0.0.1:8545'],
                    }],
                });
            } else {
                throw switchError;
            }
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(ethers.utils.getAddress(accounts[0]));
    } catch (error) {
        console.error('MetaMask connection error:', error);
        alert('Error connecting to MetaMask');
    }
    }

    return (
        <nav>
            <ul className='nav__links'>
                <li><a href="#">Buy</a></li>
                <li><a href="#">Rent</a></li>
                <li><a href="#">Sell</a></li>
            </ul>

            <div className='nav__brand'>
                <img src={logo} alt="Logo" />
                <h1>Millow</h1>
            </div>

            {account ? (
                <button
                    type="button"
                    className='nav__connect'
                >
                    {account.slice(0, 6) + '...' + account.slice(38, 42)}
                </button>
            ) : (
                <button
                    type="button"
                    className='nav__connect'
                    onClick={connectHandler}
                >
                    Connect
                </button>
            )}
        </nav>
    );
}

export default Navigation;