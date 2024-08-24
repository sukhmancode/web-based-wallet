import { useState } from "react";
import { mnemonicToSeed, generateMnemonic } from "bip39";
import { HDNodeWallet, ethers, Wallet } from "ethers";
import { Buffer } from "buffer";

const ALCHEMY_URL = "https://eth-mainnet.g.alchemy.com/v2/MRWpBcKyooPthPEp3J_Tmi9RZbDy3ylE";
const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
window.Buffer = Buffer;

const Ethereum = () => {
  const [mnemonic, setMnemonic] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [walletInfo, setWalletInfo] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateMn = async () => {
    setLoading(true);
    const mn = generateMnemonic();
    setMnemonic(mn);
    await generateETH(mn);
  };

  const generateETH = async (mn) => {
    try {
      const seed = await mnemonicToSeed(mn);
      const derivationPath = `m/44'/60'/${currentIndex}'/0/0`;
      const hdNode = HDNodeWallet.fromSeed(seed);
      const child = hdNode.derivePath(derivationPath);
      const privateKey = child.privateKey;
      const wallet = new Wallet(privateKey);
      const walletAddress = wallet.address;

      const balance = await provider.getBalance(walletAddress);
      const formattedBalance = ethers.formatEther(balance);

      const walletInfoObj = {
        walletNo: currentIndex,
        walletAddress,
        walletSecret: privateKey,
        balance: formattedBalance,
      };

      setCurrentIndex(currentIndex + 1);
      setWalletInfo([...walletInfo, walletInfoObj]);
    } catch (e) {
      console.error(e);
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
        {loading ? "Generating..." : "Generate Wallet"}
      </button>

      {mnemonic && (
        <>
          <div className="max-w-full p-2">
            <div className="">
              <div className="text-center my-5">
                <h2 className="text-2xl font-medium">Secret Recovery Phrase</h2>
              </div>
              <div className="grid grid-cols-4 gap-4 bg-slate-800 p-12 rounded-md">
                {mnemonic.split(" ").map((mn, idx) => (
                  <div key={idx} className="text-center">
                    <span className="text-white font-medium text-1xl">{mn}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full ">
              {walletInfo.length > 0 && (
                <div className="w-full">
                  <ul>
                    {walletInfo.map((info, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col p-4 rounded-lg m-4"
                        style={{
                          backgroundColor: idx % 2 === 0 ? "#f0f4f8" : "#e1e7ec",
                        }}
                      >
                        <div className="mt-10">
                          <span className="text-3xl font-bold">
                            Wallet No: {info.walletNo}
                          </span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <h2 className="text-2xl font-semibold">Public Key</h2>
                          <span className="font-medium">{info.walletAddress}</span>
                        </div>
                        <div className="flex gap-3 items-center">
                          <h2 className="text-2xl font-semibold">Balance</h2>
                          <span className="font-medium">{info.balance} ETH</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Ethereum;
