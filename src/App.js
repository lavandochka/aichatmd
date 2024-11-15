import React, { useState } from "react";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
  dangerouslyAllowBrowser: true,
});

const App = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: "user", content: inputValue },
    ]);
    setIsLoading(true);
    setInputValue("");

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: inputValue }],
        model: "llama3-8b-8192",
        stream: true,
      });

      let assistantMessage = "";
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "llm", content: "" },
      ]);

      for await (const chunk of response) {
        const content = chunk?.choices?.[0]?.delta?.content;
        if (content) {
          assistantMessage += content;
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage.sender === "llm") {
              const updatedMessage = {
                ...lastMessage,
                content: assistantMessage,
              };
              return [...prevMessages.slice(0, -1), updatedMessage];
            } else {
              return prevMessages;
            }
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: "system", content: "Error fetching response." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Real-time Chat</h1>
      <div className="mb-6 bg-gray-100 p-4 rounded shadow">
        <div className="overflow-auto max-h-96 mb-4 space-y-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded ${
                msg.sender === "user"
                  ? "bg-blue-100"
                  : msg.sender === "llm"
                  ? "bg-green-100"
                  : "bg-gray-200"
              }`}
            >
              <p
                className={`text-sm ${
                  msg.sender === "user"
                    ? "text-blue-800"
                    : msg.sender === "llm"
                    ? "text-green-800"
                    : "text-gray-800"
                }`}
              >
                {msg.content}
              </p>
            </div>
          ))}
          {isLoading && <p className="text-blue-500 italic">Loading...</p>}
        </div>
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded p-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={isLoading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default App;
