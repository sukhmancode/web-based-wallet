import { useState } from "react";
import { mnemonicToSeed, generateMnemonic } from "bip39";
import { Keypair, Connection, Transaction,  SystemProgram, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import Wallets from './Wallet'
import Modal from "./Modal";
const DEV_NET_URL = "https://api.devnet.solana.com";
const connection = new Connection(DEV_NET_URL, "confirmed");
window.Buffer = Buffer;

const Solana = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState([]);
  const [walletInfo, setWalletInfo] = useState([]);
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferLoading,setTransferLoading] = useState(false)
  const [modalOpen,setModalOpen] = useState(false)
  const [transferData,setTransferData] = useState({
    walletNo:null,
    recipientAddress:"",
    amount:0
  })

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

  const transferSOL = async(senderIndex,recipientPublicKey,amount) => {
    setTransferLoading(false);
    
    try {
      const senderInfo = walletInfo[senderIndex];
      const senderKeyPair = Keypair.fromSecretKey(senderInfo.walletSecretKey)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeyPair.publicKey,
          toPubkey: new PublicKey(recipientPublicKey),
          lamports: amount * 1e9
        })
      )

      transaction.feePayer = senderKeyPair.publicKey;
      transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      await transaction.sign(senderKeyPair);
      const signature = await sendAndConfirmTransaction(connection,transaction,[senderKeyPair])

      const updatedSenderBalance = await connection.getBalance(senderKeyPair.publicKey)
      const updatedWalletInfo = walletInfo.map((info,index) => {
        if(index == senderIndex) {
          return { ...info,balance:updatedSenderBalance / 1e9 }
        }
        if(info.walletPublicKey.toBase58() === recipientPublicKey) {
          const updatedRecipientBalance = info.balance + amount;
          return {...info,balance:updatedRecipientBalance}
        }
        return info;
    })

    setWalletInfo(updatedWalletInfo)
    setTransferLoading(false)
  }
    catch(err) {
      console.log("Transaction failed",err);
      setTransferLoading(false)
    }
  }

  const makeTransaction = () => {
    console.log(transferData);
    if(transferData.walletNo !== null && transferData.recipientAddress && transferData.amount > 0) {
      transferSOL(transferData.walletNo,transferData.recipientAddress,transferData.amount)
    }
    else{
      console.log("please check your details");
    }
  }

  const openModal = (walletNo) => {
    setTransferData({
      walletNo:walletNo,
      recipientAddress:"",
      amount:0
    })
    setModalOpen(true)

  }

  const closeModal = () => setModalOpen(false)


  return (
    <div className="flex flex-col items-center justify-center">

      <Modal isOpen={modalOpen} closeModal={closeModal}>
        <div className="flex flex-col gap-5">
          <h1 className="text-3xl font-bold">Make Transactions</h1>
          <div>
            <form className="flex flex-col gap-2">
              <input type="text" placeholder="Reciever Public Key" className="p-2 border-2 rounded-md text-2xl" />
              <input type="number" placeholder="enter amount" className="p-2 border-2 rounded-md text-2xl"></input>
              <button
              onClick={makeTransaction}
              className="bg-black font-extrabold text-black px-5 py-2 text-1xl rounded-md hover:text-black hover:bg-white hover:border-slate-700 border transition duration-300 ease-in-out"
            >
              Transfer
            </button>
            </form>
          </div>
        </div>
      </Modal>
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
      
          <Wallets mnemonic={mnemonic} walletInfo={walletInfo} openModal={openModal}/>
        </>
      )}
    </div>
  );
};

export default Solana;
