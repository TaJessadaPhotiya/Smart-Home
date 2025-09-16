from pydub import AudioSegment

# โหลดไฟล์ mp3
sound = AudioSegment.from_file("input.mp3", format="mp3")

# แปลงเป็น WAV
sound.export("output.wav", format="wav")

print("แปลง mp3 เป็น wav เรียบร้อย ✅")
