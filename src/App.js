import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {

  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);
  const [homes, setHomes] = useState([]);
  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);
  const [networkError, setNetworkError] = useState('');

  const loadBlockchainData = async () => {
    try {
      if (!window.ethereum) {
        console.error('MetaMask not detected');
        setHomes([]);
        setNetworkError('MetaMask not detected. Please install MetaMask.');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const network = await provider.getNetwork();
      const networkConfig = config[network.chainId];

      if (!networkConfig) {
        console.error(`Unsupported network: ${network.chainId}. Please switch to localhost (31337).`);
        setHomes([]);
        setEscrow(null);
        setNetworkError(`Wrong network (${network.chainId}). Switch MetaMask to localhost (31337).`);
        return;
      }

      setNetworkError('');

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(ethers.utils.getAddress(accounts[0]));
      }

      const realEstate = new ethers.Contract(networkConfig.realEstate.address, RealEstate, provider);
      const totalSupply = await realEstate.totalSupply();

      const homes = [];

      for (let i = 1; i <= totalSupply.toNumber(); i++) {
        try {
          const uri = await realEstate.tokenURI(i);
          const response = await fetch(uri);
          const metadata = await response.json();
          homes.push(metadata);
        } catch (error) {
          console.error(`Failed to load metadata for token ${i}:`, error);
        }
      }

      setHomes(homes);

      const escrow = new ethers.Contract(networkConfig.escrow.address, Escrow, provider);
      setEscrow(escrow);
    } catch (error) {
      console.error('Failed to load blockchain data:', error);
      setNetworkError('Failed to load blockchain data. Make sure Hardhat node is running and contracts are deployed.');
    }

  }

  useEffect(() => {
    loadBlockchainData();

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        return;
      }

      setAccount(ethers.utils.getAddress(accounts[0]));
    };

    const handleChainChanged = () => {
      loadBlockchainData();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []); 

  const togglePop = (home) => {
    //console.log(home);
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />
      <div className='cards__section'>

        {networkError && <p>{networkError}</p>}

        <h3>Homes For You</h3>
        <hr />

        <div className='cards'>
          {homes.map((home, index) => (
            <div className='card' key={index}  onClick={() => togglePop(home)}>
              <div className='card__image'>
                <img src={home.image} alt="Home" />
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))}
        </div>

      </div> 

      {toggle && (
        <Home 
          home={home} 
          provider={provider} 
          account={account} 
          escrow={escrow} 
          togglePop={togglePop} />
      )}

    </div>
  );
}

export default App;
