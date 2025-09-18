import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = "http://qrcodebackend.tagifood.com/device";
// const API_URL = "http://localhost:5000/device";
const SOUND_PATH = "/sounds/";
const socket = io("http://qrcodebackend.tagifood.com");
// const socket = io("http://localhost:5000");

function App() {
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [devices, setDevices] = useState({
    light1: false,
    tv: false,
    air: false,
  });

  const recognitionRef = useRef(null); // ✅ เก็บ SpeechRecognition instance

  // เล่นเสียงตอบรับ
  const playSound = (file) => {
    const audio = new Audio(SOUND_PATH + file);
    audio.play().catch((err) => console.log("❌ เล่นเสียงไม่ได้:", err));
  };

  // ส่งคำสั่งไป backend
  const callApi = async (device, action) => {
    try {
      await axios.post(API_URL, { device, action });
    } catch (err) {
      console.log("❌ API error:", err);
    }
  };

  // Toggle device
  const toggleDevice = (device, onSound, offSound) => {
    const newState = !devices[device];
    setDevices((prev) => ({ ...prev, [device]: newState }));

    if (newState) {
      playSound(onSound);
      callApi(device, "on");
    } else {
      playSound(offSound);
      callApi(device, "off");
    }
  };

  // จัดการคำสั่ง
  const handleCommand = (text) => {
    if (text.includes("เปิดไฟ"))
      toggleDevice("light1", "on_light.wav", "off_light.wav");
    else if (text.includes("ปิดไฟ"))
      toggleDevice("light1", "on_light.wav", "off_light.wav");
    else if (text.includes("เปิดทีวี"))
      toggleDevice("tv", "on_tv.wav", "off_tv.wav");
    else if (text.includes("ปิดทีวี"))
      toggleDevice("tv", "on_tv.wav", "off_tv.wav");
    else if (text.includes("เปิดแอร์"))
      toggleDevice("air", "on_air.wav", "off_air.wav");
    else if (text.includes("ปิดแอร์"))
      toggleDevice("air", "on_air.wav", "off_air.wav");
    else {
      playSound("not_understand.wav");
    }
  };

  // เริ่มหรือหยุดฟังเสียง
  const toggleListening = () => {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      alert("❌ Browser ไม่รองรับ Speech Recognition");
      return;
    }

    // ถ้าอยู่ในโหมดกำลังฟัง → หยุด
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    // ถ้าไม่ได้ฟัง → สร้าง instance ใหม่
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onerror = (e) => {
      console.log("❌ Speech error:", e.error);
      playSound("not_understand.wav");
      setListening(false);
    };

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      console.log("🎤 ได้ยินว่า:", speechText);
      setRecognizedText(speechText);
      handleCommand(speechText);
    };

    recognitionRef.current = recognition; // ✅ เก็บไว้หยุดภายหลัง
    recognition.start();
  };

  // Realtime sync
  useEffect(() => {
    socket.on("updateDevices", (data) => {
      setDevices({
        light1: data.light1 === "on",
        tv: data.tv === "on",
        air: data.air === "on",
      });
    });

    return () => socket.off("updateDevices");
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Smart Home Control</h1>

      {/* Input */}
      <div className="flex gap-2 w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="พิมพ์คำสั่ง..."
          className="flex-1 p-2 border rounded"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
          onClick={() => {
            handleCommand(inputText);
            setInputText("");
          }}
        >
          ส่ง
        </button>
      </div>

      {/* ข้อความถอดเสียง */}
      {recognizedText && (
        <div className="w-full max-w-md p-3 mb-4 border rounded bg-white shadow">
          🎤 ข้อความที่ได้:{" "}
          <span className="font-semibold">{recognizedText}</span>
        </div>
      )}

      {/* ปุ่มเสียง */}
      <button
        className={`w-full max-w-md px-4 py-2 rounded text-white mb-6 transition ${
          listening ? "bg-red-500" : "bg-green-500 hover:bg-green-600"
        }`}
        onClick={toggleListening}
      >
        {listening ? "⏹️ หยุดฟัง" : "🎙️ กดเพื่อพูด"}
      </button>

      {/* Toggle Devices */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <button
          onClick={() =>
            toggleDevice("light1", "on_light.wav", "off_light.wav")
          }
          className={`py-3 rounded-lg shadow-lg font-semibold transition ${
            devices.light1
              ? "bg-yellow-400 text-black"
              : "bg-gray-700 text-white"
          }`}
        >
          💡 ไฟ {devices.light1 ? "ON" : "OFF"}
        </button>

        <button
          onClick={() => toggleDevice("tv", "on_tv.wav", "off_tv.wav")}
          className={`py-3 rounded-lg shadow-lg font-semibold transition ${
            devices.tv ? "bg-blue-400 text-white" : "bg-blue-800 text-white"
          }`}
        >
          📺 ทีวี {devices.tv ? "ON" : "OFF"}
        </button>

        <button
          onClick={() => toggleDevice("air", "on_air.wav", "off_air.wav")}
          className={`py-3 rounded-lg shadow-lg font-semibold transition ${
            devices.air ? "bg-cyan-400 text-black" : "bg-cyan-700 text-white"
          }`}
        >
          ❄️ แอร์ {devices.air ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}

export default App;
