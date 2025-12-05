import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import SeniorsProfiles from "./SeniorsProfiles.jsx";

const SeniorsPage = ({ onBackToHome }) => {
  const bannedWords = ["none","nothing"
];


function containsBadWord(text) {
  const lower = text.toLowerCase();
  return bannedWords.some(word => lower.includes(word));
}
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [canSend, setCanSend] = useState(true);

useEffect(() => {
  let timer;
  if (!canSend) {
    timer = setTimeout(() => setCanSend(true), 3000); // 3s cooldown
  }
  return () => clearTimeout(timer);
}, [canSend]);

  // 🔄 Fetch messages live from Firestore (ordered oldest → newest)
  useEffect(() => {
    const q = query(collection(db, "broadcasts"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);


  // 🚀 Send message to Firestore
  const sendMessage = async (e) => {
  e.preventDefault();
  if (containsBadWord(message)) {
    alert("⚠️ Please avoid using inappropriate or harmful language.");
    return; // stop sending
  }

  if (!message) return;
  if (!canSend) {
    alert("⏳ Please wait a few seconds before sending another message.");
    return;
  }

  try {
    await addDoc(collection(db, "broadcasts"), {
      text: message,
      email: auth.currentUser?.email,
      timestamp: serverTimestamp(),
    });
    setMessage("");
    setCanSend(false); 
  } catch (error) {
    console.error("Error sending message:", error);
  }
};


  return (
    <>
      <style>{`
        :root {
          --accent: #f4b30c;
          --beige: #fbf9f1;
          --brown: #1a1200;
        }
        .broadcast-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: linear-gradient(135deg, var(--beige), #fdfcf8);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: var(--brown);
          align-items: center;
        }
        .broadcast-header {
          text-align: center;
          padding: 1rem;
          font-size: 1.8rem;
          font-weight: 700;
          color: #f4b30c;
          letter-spacing: 1px;
        }
        .broadcast-container {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          padding: 1rem;
        }
        .broadcast-chat {
          width: 75%;
          height: 80vh;
          display: flex;
          flex-direction: column;
          background: #fbf9f1;
          overflow: hidden;
        }
        .broadcast-messages {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .broadcast-message {
          max-width: 75%;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          animation: fadeInUp 0.5s ease forwards;
          word-wrap: break-word;
        }
        .user-msg {
          align-self: flex-end;
          background: linear-gradient(135deg, #667eea, #5a67f2);
          color: white;
        }
        .other-msg {
          align-self: flex-start;
          background: #ddd9c5;
          color: black;
        }
        .broadcast-input-area {
          display: flex;
          border-top: 1px solid #ddd9c5;
          padding: 0.8rem;
          background: white;
        }
        .broadcast-input {
          flex: 1;
          padding: 0.7rem;
          border: 1px solid #ccc;
          border-radius: 12px;
          outline: none;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
          transition: box-shadow 0.3s ease;
          font-size: 1rem;
        }
        .broadcast-input:focus {
          box-shadow: 0 0 5px var(--accent);
        }
        .broadcast-btn {
          margin-left: 0.6rem;
          padding: 0.7rem 1.4rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #f4b30c, #ff8c42);
          color: white;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        }
        .broadcast-btn:hover {
          transform: scale(1.05);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="broadcast-page">
        <header className="broadcast-header">📡 Community Broadcast Room</header>

        <div className="broadcast-container">
          <div className="broadcast-chat">
            <div className="broadcast-messages" id="messagesBox">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`broadcast-message ${msg.email === auth.currentUser?.email ? "user-msg" : "other-msg"
                    }`}
                >
                  <strong>{msg.email?.split("@")[0] || "Guest"}:</strong> {msg.text}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="broadcast-input-area">
              <textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault(); // prevent newline
                    sendMessage(e); // send the message
                  }
                }}
                className="broadcast-input"
                rows={1}
              />

              <button type="submit" className="broadcast-btn">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SeniorsPage;
