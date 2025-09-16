import sounddevice as sd
import numpy as np
import speech_recognition as sr
import os
import pygame
from pygame import mixer

# เริ่ม mixer ของ pygame
pygame.init()
mixer.init()

r = sr.Recognizer()

# ฟังก์ชันบันทึกเสียง
def record(duration=3, fs=16000):
    print(f"🎤 กำลังฟัง {duration} วินาที...")
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1, dtype='int16')
    sd.wait()
    audio = audio.flatten().tobytes()
    return sr.AudioData(audio, fs, 2) 

# ฟังก์ชันออกโปรแกรม
def exit_program():
    print("👋 จบโปรแกรม")
    global running
    running = False

# ฟังก์ชันเล่นไฟล์ wav/mp3 ด้วย pygame
def play_sound(file_name):
    sounds_dir = r"C:\Users\Nuntapon.p\Desktop\smathome\sounds"
    file_path = os.path.join(sounds_dir, file_name)
    if not os.path.exists(file_path):
        print(f"❌ ไฟล์เสียงไม่พบ: {file_path}")
        return
    try:
        sound = mixer.Sound(file_path)
        sound.play()  # เล่นแบบไม่บล็อก
    except Exception as e:
        print("❌ เล่นไฟล์เสียงไม่ได้:", e)

# ตัวแปรควบคุม loop
running = True

# Dictionary คำสั่งพร้อมไฟล์เสียง
commands = {
    "เปิดไฟ": lambda: (print("💡 ไฟถูกเปิดแล้ว"), play_sound("on_light.wav")),
    "ปิดไฟ": lambda: (print("💡 ไฟถูกปิดแล้ว"), play_sound("off_light.wav")),
    "เปิดทีวี": lambda: (print("📺 ทีวีถูกเปิดแล้ว"), play_sound("on_tv.wav")),
    "ปิดทีวี": lambda: (print("📺 ทีวีถูกปิดแล้ว"), play_sound("off_tv.wav")),
    "เพิ่มเสียง": lambda: (print("🔊 เพิ่มเสียงแล้ว"), play_sound("volume_up.wav")),
    "ลดเสียง": lambda: (print("🔉 ลดเสียงแล้ว"), play_sound("volume_down.wav")),
    "เปิดแอร์": lambda: (print("❄️ แอร์ถูกเปิดแล้ว"), play_sound("on_air.wav")),
    "ปิดแอร์": lambda: (print("❄️ แอร์ถูกปิดแล้ว"), play_sound("off_air.wav")),
    "ชื่ออะไร": lambda: (print("😜 สวัสดีครับ ผมคือ Smart Home Assistant"), play_sound("hi.wav")),
    "คุณชื่ออะไร": lambda: (print("😜 สวัสดีครับ ผมคือ Smart Home Assistant"), play_sound("hi.wav")),
    "โบว์ไปอาบน้ำ": lambda: (print("😜 โบว์ไปอาบน้ำ"), play_sound("bow_worter.wav")),
    "โบว์อาบน้ำ": lambda: (print("😜 โบว์ไปอาบน้ำ"), play_sound("bow_worter.wav")),
    "อาบน้ำโบว์": lambda: (print("😜 โบว์ไปอาบน้ำ"), play_sound("bow_worter.wav")),
    "หนาว": lambda: (print("😜 หนาว"), play_sound("cold_weather.wav")),
    "อากาศหนาว": lambda: (print("😜 หนาว"), play_sound("cold_weather.wav")),
    "อากาศเย็น": lambda: (print("😜 หนาว"), play_sound("cold_weather.wav")),
    "แค่นี้กีไม่ได้": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "โง่": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "พูดไม่ถูก": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "ให้โอกาศพูดใหม่": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "ไข่ต้มโง่": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "ไข่ต้มพูดไม่ถูก": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "ไข่ต้มพูดใหม่": lambda: (print("😢 sorry"), play_sound("sorry.wav")),
    "พูดใหม่ไข่ต้ม": lambda: (print("😢 ok"), play_sound("ok.wav")),
    "พูดใหม่": lambda: (print("😢 ok"), play_sound("ok.wav")),
    "พูดใหม่เลย": lambda: (print("😢 ok"), play_sound("ok.wav")),
    "พูดใหม่เลยไข่ตัม": lambda: (print("😢 ok"), play_sound("ok.wav")),
    "ไข่ตัมพูดใหม่เลย": lambda: (print("😢 ok"), play_sound("ok.wav")),
    "เหนื่อย": lambda: (print("🥳 worry"), play_sound("worry.wav")),
    "เหนื่อยจัง": lambda: (print("🥳 worry"), play_sound("worry.wav")),
    "ไข่ต้มเหนื่อย": lambda: (print("🥳 worry"), play_sound("worry.wav")),
    "ควย": lambda: (print("🥳 speak_rudely"), play_sound("speak_rudely.wav")),
    "โอ๋โอ๋": lambda: (print("🥳 sulking.wav"), play_sound("sulking.wav")),
    "โอ๋นะ": lambda: (print("🥳 sulking.wav"), play_sound("sulking.wav")),
    "โอ๋นะไข่ต้ม": lambda: (print("🥳 sulking.wav"), play_sound("sulking.wav")),
    "ไข่ต้ม": lambda: (print("🥳 naga.wav"), play_sound("naga.wav")),
    "หวัดดีไข่ต้ม": lambda: (print("🥳 naga.wav"), play_sound("naga.wav")),
    "ออก": exit_program,
    "หยุด": exit_program,
}

# สร้างคำสั่งตัวอย่าง 1000 คำสั่ง
for i in range(1000):
    commands[f"คำสั่ง{i}"] = lambda i=i: print(f"ทำงานคำสั่ง{i}")

# Loop หลัก
while running:
    choice = input("พิมพ์ 'k' เพื่อพิมพ์ข้อความ หรือ Enter เพื่อใช้เสียง: ").strip().lower()
    
    if choice == 'k':
        text = input("📝 พิมพ์ข้อความ: ")
    else:
        audio_data = record(duration=3)
        try:
            text = r.recognize_google(audio_data, language="th-TH")
        except sr.UnknownValueError:
            print("ไม่เข้าใจเสียง")
            continue
        except sr.RequestError as e:
            print("เชื่อมต่อ Google API ไม่ได้:", e)
            continue
    
    print("ได้ยินว่า:", text)

    # ตรวจสอบคำสั่ง
    found = False
    for key, action in commands.items():
        if key in text:
            action()
            found = True
            break
    if not found:
        print("❌ ไม่มีคำสั่งตรงกับข้อความ")
