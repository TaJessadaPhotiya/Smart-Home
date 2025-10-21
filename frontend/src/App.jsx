import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import AirOutlinedIcon from "@mui/icons-material/AirOutlined";
import WbIncandescentOutlinedIcon from "@mui/icons-material/WbIncandescentOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import { Switch } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";

const API_URL = "https://qrcodebackend.tagifood.com/device";
// const API_URL = "http://localhost:5000/device";
const SOUND_PATH = "/sounds/";
const socket = io("https://qrcodebackend.tagifood.com");
// const socket = io("http://localhost:5000");

function App() {
  const [listening, setListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [recognizedText, setRecognizedText] = useState("");
  const [activeTab, setActiveTab] = useState("ห้องนอน");
  const tabs = ["ห้องนอน", "ห้องน้ำ", "ห้องครัว"];
  const [devices, setDevices] = useState({
    light1: false,
    tv: false,
    air: false,
  });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

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

    recognitionRef.current = recognition;
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

  const renderContent = () => {
    switch (activeTab) {
      case "ห้องนอน":
        return (
          <div className="grid grid-cols-2 gap-4 w-full">
            <div
              className={`flex flex-col justify-between w-full h-[160px] rounded-2xl p-4 text-white transition-colors ${
                devices.light1
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4]"
                  : "bg-[#2F313E]"
              }`}
              style={{
                boxShadow: devices.light1 ? "0 0.5px 15px #20d3d3" : "none",
              }}
            >
              <div className="flex justify-between items-center">
                <WbIncandescentOutlinedIcon
                  sx={{
                    fontSize: 35,
                    color: devices.light1 ? "#F5A524" : "#F5A524",
                  }}
                />
                <WifiOutlinedIcon
                  sx={{
                    fontSize: 25,
                    color: devices.light1 ? "#00A63E" : "#d1d5dc",
                  }}
                />
              </div>
              <div>
                <h1
                  className={`text-md font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  ไฟห้องนอน
                </h1>
                <p
                  className={`text-[12px] font-medium ${
                    devices.light1 ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  1 Devices
                </p>
              </div>
              <div className="flex justify-between items-center text-sm ">
                <h1
                  className={`text-sm font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {devices.light1 ? "ON" : "OFF"}
                </h1>
                <Switch
                  onChange={() =>
                    toggleDevice("light1", "on_light.wav", "off_light.wav")
                  }
                  defaultSelected
                  size="sm"
                  color="success"
                  isSelected={devices.light1}
                ></Switch>
              </div>
            </div>
            <div
              className={`flex flex-col justify-between w-full h-[160px] rounded-2xl p-4 text-white transition-colors ${
                devices.tv
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4]"
                  : "bg-[#2F313E]"
              }`}
              style={{
                boxShadow: devices.tv ? "0 0.5px 15px #20d3d3" : "none",
              }}
            >
              <div className="flex justify-between items-center">
                <LiveTvOutlinedIcon
                  sx={{
                    fontSize: 35,
                    color: devices.tv ? "#F31260" : "#F31260",
                  }}
                />
                <WifiOutlinedIcon
                  sx={{
                    fontSize: 25,
                    color: devices.tv ? "#00A63E" : "#d1d5dc",
                  }}
                />
              </div>
              <div>
                <h1
                  className={`text-md font-medium ${
                    devices.tv ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  ทีวี
                </h1>
                <p
                  className={`text-[12px] font-medium ${
                    devices.tv ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  1 Devices
                </p>
              </div>
              <div className="flex justify-between items-center text-sm ">
                <h1
                  className={`text-sm font-medium ${
                    devices.tv ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {devices.tv ? "ON" : "OFF"}
                </h1>
                <Switch
                  onChange={() => toggleDevice("tv", "on_tv.wav", "off_tv.wav")}
                  defaultSelected
                  size="sm"
                  color="success"
                  isSelected={devices.tv}
                ></Switch>
              </div>
            </div>
            <div
              className={`flex flex-col justify-between w-full h-[160px] rounded-2xl p-4 text-white transition-colors ${
                devices.air
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4]"
                  : "bg-[#2F313E]"
              }`}
              style={{
                boxShadow: devices.air ? "0 0.5px 15px #20d3d3" : "none",
              }}
            >
              <div className="flex justify-between items-center">
                <AirOutlinedIcon
                  sx={{
                    fontSize: 35,
                    color: devices.air ? "#338EF7" : "#338EF7",
                  }}
                />
                <WifiOutlinedIcon
                  sx={{
                    fontSize: 25,
                    color: devices.air ? "#00A63E" : "#d1d5dc",
                  }}
                />
              </div>
              <div>
                <h1
                  className={`text-md font-medium ${
                    devices.air ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  แอร์
                </h1>
                <p
                  className={`text-[12px] font-medium ${
                    devices.air ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  1 Devices
                </p>
              </div>
              <div className="flex justify-between items-center text-sm ">
                <h1
                  className={`text-sm font-medium ${
                    devices.air ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {devices.air ? "ON" : "OFF"}
                </h1>
                <Switch
                  onChange={() =>
                    toggleDevice("air", "on_air.wav", "off_air.wav")
                  }
                  defaultSelected
                  size="sm"
                  color="success"
                  isSelected={devices.air}
                ></Switch>
              </div>
            </div>
          </div>
        );
      case "ห้องน้ำ":
        return (
          <div className="grid grid-cols-2 gap-4 w-full">
            <div
              className={`flex flex-col justify-between w-full h-[160px] rounded-2xl p-4 text-white transition-colors ${
                devices.light1
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4]"
                  : "bg-[#2F313E]"
              }`}
              style={{
                boxShadow: devices.light1 ? "0 0.5px 15px #20d3d3" : "none",
              }}
            >
              <div className="flex justify-between items-center">
                <WbIncandescentOutlinedIcon
                  sx={{
                    fontSize: 35,
                    color: devices.light1 ? "#F5A524" : "#F5A524",
                  }}
                />
                <WifiOutlinedIcon
                  sx={{
                    fontSize: 25,
                    color: devices.light1 ? "#00A63E" : "#d1d5dc",
                  }}
                />
              </div>
              <div>
                <h1
                  className={`text-md font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  ไฟห้องนอน2
                </h1>
                <p
                  className={`text-[12px] font-medium ${
                    devices.light1 ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  1 Devices
                </p>
              </div>
              <div className="flex justify-between items-center text-sm ">
                <h1
                  className={`text-sm font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {devices.light1 ? "ON" : "OFF"}
                </h1>
                <Switch
                  onChange={() =>
                    toggleDevice("light1", "on_light.wav", "off_light.wav")
                  }
                  defaultSelected
                  size="sm"
                  color="success"
                  isSelected={devices.light1}
                ></Switch>
              </div>
            </div>
          </div>
        );
      case "ห้องครัว":
        return (
          <div className="grid grid-cols-2 gap-4 w-full">
            <div
              className={`flex flex-col justify-between w-full h-[160px] rounded-2xl p-4 text-white transition-colors ${
                devices.light1
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4]"
                  : "bg-[#2F313E]"
              }`}
              style={{
                boxShadow: devices.light1 ? "0 0.5px 15px #20d3d3" : "none",
              }}
            >
              <div className="flex justify-between items-center">
                <WbIncandescentOutlinedIcon
                  sx={{
                    fontSize: 35,
                    color: devices.light1 ? "#F5A524" : "#F5A524",
                  }}
                />
                <WifiOutlinedIcon
                  sx={{
                    fontSize: 25,
                    color: devices.light1 ? "#00A63E" : "#d1d5dc",
                  }}
                />
              </div>
              <div>
                <h1
                  className={`text-md font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  ไฟห้องนอน3
                </h1>
                <p
                  className={`text-[12px] font-medium ${
                    devices.light1 ? "text-gray-600" : "text-gray-500"
                  }`}
                >
                  1 Devices
                </p>
              </div>
              <div className="flex justify-between items-center text-sm ">
                <h1
                  className={`text-sm font-medium ${
                    devices.light1 ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  {devices.light1 ? "ON" : "OFF"}
                </h1>
                <Switch
                  onChange={() =>
                    toggleDevice("light1", "on_light.wav", "off_light.wav")
                  }
                  defaultSelected
                  size="sm"
                  color="success"
                  isSelected={devices.light1}
                ></Switch>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-200 flex justify-center items-center ">
      <div className="min-h-screen max-w-[500px] w-full bg-[#141321] overflow-hidden p-6">
        <div className="relative w-full h-[160px] bg-black rounded-2xl overflow-hidden">
          {/* <div className="relative w-full h-[160px] bg-gradient-to-r from-[#20d3d3] to-[#c7e4e4] rounded-2xl overflow-hidden"> */}
          <img
            className="w-full h-full object-cover"
            src="/image/banner6.jpg"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-0"></div>
          <div className="absolute top-5 left-5 flex flex-col items-start z-10 text-left">
            {/* ข้อความหลัก */}
            <h1 className="text-white text-lg font-semibold drop-shadow-lg">
              สวัสดีตอนเช้า 🌤️
            </h1>

            {/* อุณหภูมิ */}
            <p className="text-white text-sm mt-1 drop-shadow-md">
              อุณหภูมิ: 29°C
            </p>

            {/* วัน เดือน ปี */}
            <p className="text-white text-xs mt-1 drop-shadow-md">
              วันศุกร์ 19 กันยายน 2025
            </p>

            {/* สภาพอากาศ */}
            <p className="text-white text-xs mt-1 drop-shadow-md">
              สภาพอากาศ: มีแดดเล็กน้อย
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between w-full mt-6">
          <h1 className="text-white text-2xl font-medium">Controller</h1>
          {/* Input */}
          <div className="relative flex items-center gap-2 w-[170px] h-[38px] max-w-sm">
            <input
              type="text"
              placeholder="พิมพ์คำสั่ง..."
              className="w-full h-[38px] p-3 border border-transparent rounded-full text-sm font-normal bg-[#2F313E] text-white pr-10 
             focus:outline-none focus:border-[#3ACFCF] focus:ring-1 focus:ring-[#3ACFCF]"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <SearchOutlinedIcon
              className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-300 
             hover:text-[#3ACFCF] hover:scale-110 z-10 
             transition-all duration-300 ease-in-out"
              onClick={() => {
                handleCommand(inputText);
                setInputText("");
              }}
              sx={{ fontSize: 27 }}
            />
          </div>
        </div>

        <div className="flex w-full items-center gap-3 py-6 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 text-sm rounded-full px-4 py-2 cursor-pointer transition ${
                activeTab === tab
                  ? "bg-gradient-to-r from-[#3ACFCF] to-[#c7e4e4] text-white"
                  : "bg-[#2F313E] text-gray-300"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>

        {renderContent()}

        {/* ข้อความถอดเสียง */}
        {recognizedText && (
          <div className="w-full max-w-md p-3 mb-4 border rounded bg-white shadow">
            🎤 ข้อความที่ได้:{" "}
            <span className="font-semibold">{recognizedText}</span>
          </div>
        )}

        {/* ปุ่มเสียง */}
        <button
          className={`mt-4 w-full max-w-md px-6 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 text-white mb-6 shadow-lg transition-all duration-300 transform 
              ${
                listening
                  ? "bg-gradient-to-r from-[#20d3d3] to-[#14b8b8] hover:from-[#1ac0c0] hover:to-[#0fa0a0] scale-105"
                  : "bg-gradient-to-r from-[#20d3d3] to-[#14b8b8] hover:from-[#1ac0c0] hover:to-[#0fa0a0] scale-105"
              }`}
          onClick={toggleListening}
        >
          {listening ? "⏹️ หยุดฟัง" : "🎙️ กดเพื่อพูด"}
        </button>

        <Button onPress={onOpen}>Open Modal</Button>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent >
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Modal Title
                </ModalHeader>
                <ModalBody>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nullam pulvinar risus non risus hendrerit venenatis.
                    Pellentesque sit amet hendrerit risus, sed porttitor quam.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Nullam pulvinar risus non risus hendrerit venenatis.
                    Pellentesque sit amet hendrerit risus, sed porttitor quam.
                  </p>
                  <p>
                    Magna exercitation reprehenderit magna aute tempor cupidatat
                    consequat elit dolor adipisicing. Mollit dolor eiusmod sunt
                    ex incididunt cillum quis. Velit duis sit officia eiusmod
                    Lorem aliqua enim laboris do dolor eiusmod. Et mollit
                    incididunt nisi consectetur esse laborum eiusmod pariatur
                    proident Lorem eiusmod et. Culpa deserunt nostrud ad veniam.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                  <Button color="primary" onPress={onClose}>
                    Action
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default App;
