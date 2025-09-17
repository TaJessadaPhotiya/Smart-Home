import sounddevice as sd
import numpy as np
import speech_recognition as sr
import os
import pygame
from pygame import mixer
import requests

# เริ่ม mixer ของ pygame
pygame.init()
mixer.init()

r = sr.Recognizer()
API_URL = "http://localhost:5000/device"  # แก้เป็น IP ของเครื่องที่รัน Node.js

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

# ฟังก์ชันเล่นไฟล์ wav/mp3
def play_sound(file_name):
    sounds_dir = r"C:\Users\Nuntapon.p\Desktop\Smart-Home\sounds"
    file_path = os.path.join(sounds_dir, file_name)
    if not os.path.exists(file_path):
        print(f"❌ ไฟล์เสียงไม่พบ: {file_path}")
        return
    try:
        sound = mixer.Sound(file_path)
        sound.play()
    except Exception as e:
        print("❌ เล่นไฟล์เสียงไม่ได้:", e)

# ฟังก์ชันเรียก API
def call_api(device, action):
    try:
        res = requests.post(API_URL, json={"device": device, "action": action})
        if res.status_code == 200:
            print(f"✅ ส่งคำสั่ง {device} {action} ไปยัง API สำเร็จ")
        else:
            print(f"❌ API error: {res.status_code}")
    except Exception as e:
        print("❌ API ไม่ทำงาน:", e)

# ตัวแปรควบคุม loop
running = True

# Dictionary คำสั่งพร้อมไฟล์เสียงและ API
commands = {
    "เปิดไฟ": lambda: (print("💡 ไฟถูกเปิดแล้ว"), play_sound("on_light.wav"), call_api("light1", "on")),
    "ปิดไฟ": lambda: (print("💡 ไฟถูกปิดแล้ว"), play_sound("off_light.wav"), call_api("light1", "off")),
    "เปิดทีวี": lambda: (print("📺 ทีวีถูกเปิดแล้ว"), play_sound("on_tv.wav"), call_api("tv", "on")),
    "ปิดทีวี": lambda: (print("📺 ทีวีถูกปิดแล้ว"), play_sound("off_tv.wav"), call_api("tv", "off")),
    "เปิดแอร์": lambda: (print("❄️ แอร์ถูกเปิดแล้ว"), play_sound("on_air.wav"), call_api("air", "on")),
    "ปิดแอร์": lambda: (print("❄️ แอร์ถูกปิดแล้ว"), play_sound("off_air.wav"), call_api("air", "off")),
    "ออก": exit_program,
    "หยุด": exit_program,
}

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
