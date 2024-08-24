import { useState } from "react";
import { mnemonicToSeed, generateMnemonic } from "bip39";
import { Keypair, Connection } from "@solana/web3.js";
import { Buffer } from "buffer";
import Wallets from '../components/Wallet'
const DEV_NET_URL = "https://api.devnet.solana.com";
const connection = new Connection(DEV_NET_URL, "confirmed");
window.Buffer = Buffer;

const Mnemonic = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState([]);
  const [walletInfo, setWalletInfo] = useState([]);
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);

  const generateMn = async () => {
    setLoading(true);
    const mn = generateMnemonic();
    setMnemonic(mn);
    await generateSolanaWallet(mn);
    setLoading(false);
  };

  const generateSolanaWallet = async () => {
    try {
      setLoading(true);
      // Convert mnemonic to seed
      const seed = await mnemonicToSeed(mnemonic);
      console.log('Seed:', seed);

      
      const keypair = Keypair.fromSeed(seed.slice(0, 32)); // Use only the first 32 bytes for the seed
      const walletPublicKey = keypair.publicKey.toBase58();
      console.log('Wallet Public Key:', walletPublicKey);

      const balance = await connection.getBalance(keypair.publicKey);
      console.log('Balance:', balance);

      const walletInfoObj = {
        walletNo: currentIndex,
        walletPublicKey,
        walletSecretKey: keypair.secretKey,
        walletDerivedSeed: seed,
        balance: balance / 1e9,
      };

      setCurrentIndex(currentIndex + 1);
      setPublicKeys([...publicKeys, walletPublicKey]);
      setWalletInfo([...walletInfo, walletInfoObj]);
    } catch (e) {
      console.log('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        onClick={generateMn}
        className="bg-black font-extrabold text-black px-5 py-2 text-3xl rounded-md hover:text-black hover:bg-white hover:border-slate-700 border transition duration-300 ease-in-out"
      >
        {loading ? 'Generating...' : 'Generate Wallet'}
      </button>
      
      {mnemonic && (
        <>
          <div className="max-w-full p-2">
            <div className="">
              <div className="text-center my-5">
                <h2 className="text-2xl font-medium">Secret Recovery Phrase</h2>
              </div>
              <div className="grid grid-cols-4 gap-4 bg-slate-800 p-12 rounded-md">
                {mnemonic.split(' ').map((mn, idx) => (
                  <div key={idx} className="text-center">
                    <span className="text-white font-medium text-1xl">{mn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      
          <Wallets mnemonic={mnemonic} walletInfo={walletInfo}/>
        </>
      )}
    </div>
  );
};

export default Mnemonic;
