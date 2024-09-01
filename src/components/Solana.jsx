import { useState } from "react";
import { mnemonicToSeed, generateMnemonic } from "bip39";
import {
  Keypair,
  Connection,
  Transaction,
  SystemProgram,
  PublicKey,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import Wallet from "./Wallet";
import Modal from "./Modal";

const DEV_NET_URL = "https://api.devnet.solana.com";
const connection = new Connection(DEV_NET_URL, "confirmed");
window.Buffer = Buffer;

const Solana = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [publicKeys, setPublicKeys] = useState([]);
  const [walletInfo, setWalletInfo] = useState([]);
  const [mnemonic, setMnemonic] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    walletNo: null,
    recipientAddress: "",
    amount: 0,
  });

  const generateMn = async () => {
    const mn = generateMnemonic();
    setMnemonic(mn);
    await generateSolanaWallet(mn);
  };

  const generateSolanaWallet = async (mnemonic, airdropAmount = 2) => {
    try {
      setLoading(true);
      const seed = await mnemonicToSeed(mnemonic);
      const keypair = Keypair.fromSeed(seed.slice(0, 32));
      const walletPublicKey = keypair.publicKey;

      // Airdrop SOL to the new wallet
      await airdropSOL(walletPublicKey, airdropAmount);

      const balance = await connection.getBalance(walletPublicKey);

      const walletInfoObj = {
        walletNo: currentIndex,
        walletPublicKey: walletPublicKey.toBase58(),
        walletSecretKey: keypair.secretKey,
        walletDerivedSeed: seed,
        balance: balance / 1e9,
      };

      setCurrentIndex(currentIndex + 1);
      setPublicKeys([...publicKeys, walletPublicKey.toBase58()]);
      setWalletInfo([...walletInfo, walletInfoObj]);
    } catch (e) {
      console.log("Error generating wallet:", e);
    } finally {
      setLoading(false);
    }
  };

  const airdropSOL = async (publicKey, amount) => {
    try {
      setLoading(true);
      const lamports = amount * 1e9;
      const signature = await connection.requestAirdrop(publicKey, lamports);
      await connection.confirmTransaction(signature, "confirmed");
      console.log(`Airdropped ${amount} SOL to ${publicKey.toBase58()}`);

      // Update balance in walletInfo
      const updatedBalance = await connection.getBalance(publicKey);
      setWalletInfo((prevWalletInfo) =>
        prevWalletInfo.map((wallet) =>
          wallet.walletPublicKey === publicKey.toBase58()
            ? { ...wallet, balance: updatedBalance / 1e9 }
            : wallet
        )
      );
    } catch (error) {
      console.error("Airdrop failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const transferSOL = async (senderIndex, recipientPublicKey, amount) => {
    if (
      senderIndex < 0 ||
      senderIndex >= walletInfo.length ||
      !PublicKey.isOnCurve(recipientPublicKey)
    ) {
      console.log("Invalid sender index or recipient address");
      return;
    }

    const senderInfo = walletInfo[senderIndex];
    if (!senderInfo || !senderInfo.walletSecretKey) {
      console.log("Sender wallet info is incomplete or undefined");
      return;
    }

    try {
      setTransferLoading(true);

      const senderKeyPair = Keypair.fromSecretKey(
        Uint8Array.from(senderInfo.walletSecretKey)
      );
      const recipientKey = new PublicKey(recipientPublicKey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeyPair.publicKey,
          toPubkey: recipientKey,
          lamports: amount * 1e9,
        })
      );

      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [senderKeyPair]
      );
      console.log("Transaction successful, signature:", signature);

      // Update balances
      const updatedSenderBalance = await connection.getBalance(
        senderKeyPair.publicKey
      );
      const updatedWalletInfo = walletInfo.map((info, index) => {
        if (index === senderIndex) {
          return { ...info, balance: updatedSenderBalance / 1e9 };
        }
        if (info.walletPublicKey === recipientPublicKey) {
          const updatedRecipientBalance = info.balance + amount;
          return { ...info, balance: updatedRecipientBalance };
        }
        return info;
      });

      setWalletInfo(updatedWalletInfo);
    } catch (err) {
      console.log("Transaction failed", err);
    } finally {
      setTransferLoading(false);
      closeModal();
    }
  };

  const makeTransaction = (e) => {
    e.preventDefault();
    if (
      transferData.walletNo !== null &&
      transferData.recipientAddress &&
      transferData.amount > 0
    ) {
      transferSOL(
        transferData.walletNo,
        transferData.recipientAddress,
        transferData.amount
      );
    } else {
      console.log("Please check your transaction details");
    }
  };

  const openModal = (walletNo) => {
    setTransferData({
      walletNo,
      recipientAddress: "",
      amount: 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  return (
    <div className="flex flex-col items-center justify-center">
      <Modal isOpen={modalOpen} closeModal={closeModal}>
        <div className="flex flex-col gap-5 p-4">
          <h1 className="text-3xl font-bold">Make Transaction</h1>
          <form className="flex flex-col gap-4" onSubmit={makeTransaction}>
            <input
              type="text"
              value={transferData.recipientAddress}
              onChange={(e) =>
                setTransferData({
                  ...transferData,
                  recipientAddress: e.target.value,
                })
              }
              placeholder="Recipient Public Key"
              className="p-2 border rounded-md"
              required
            />
            <input
              type="number"
              value={transferData.amount}
              onChange={(e) =>
                setTransferData({
                  ...transferData,
                  amount: parseFloat(e.target.value),
                })
              }
              placeholder="Amount (SOL)"
              className="p-2 border rounded-md"
              min="0.000000001"
              step="0.000000001"
              required
            />
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
              disabled={transferLoading}
            >
              {transferLoading ? "Processing..." : "Send SOL"}
            </button>
          </form>
        </div>
      </Modal>

      <button
        onClick={generateMn}
        className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 my-4"
        disabled={loading}
      >
        {loading ? "Generating Wallet..." : "Generate New Wallet"}
      </button>

      {mnemonic && (
        <div className="w-full max-w-xl p-4 bg-gray-100 rounded-md shadow-md">
          <h2 className="text-xl font-semibold mb-2">Secret Recovery Phrase:</h2>
          <div className="grid grid-cols-3 gap-2">
            {mnemonic.split(" ").map((word, index) => (
              <div
                key={index}
                className="bg-white p-2 rounded-md text-center shadow-sm"
              >
                {word}
              </div>
            ))}
          </div>
        </div>
      )}

      {walletInfo.length > 0 && (
        <Wallet
          walletInfo={walletInfo}
          airdropSOL={airdropSOL}
          openModal={openModal}
        />
      )}
    </div>
  );
};

export default Solana;
