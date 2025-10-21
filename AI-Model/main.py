import json
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DATA_FILE = "data.json"
MEMORY_FILE = "memory.json"

# โหลดฐานข้อมูลตอบกลับ
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        chatbot_data = json.load(f)
else:
    chatbot_data = []

# โหลด memory เก่า
if os.path.exists(MEMORY_FILE):
    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        context_memory = json.load(f)
else:
    context_memory = []

def save_memory():
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(context_memory, f, ensure_ascii=False, indent=2)

def save_data():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(chatbot_data, f, ensure_ascii=False, indent=2)

# สร้าง TF-IDF Vectorizer
def get_vectorizer():
    questions = [item["user"] for item in chatbot_data]
    vectorizer = TfidfVectorizer()
    question_vectors = vectorizer.fit_transform(questions) if questions else None
    return vectorizer, question_vectors

def find_best_match(user_input):
    if not chatbot_data:
        return None
    
    vectorizer, question_vectors = get_vectorizer()
    user_vec = vectorizer.transform([user_input])
    similarities = cosine_similarity(user_vec, question_vectors)
    best_idx = similarities.argmax()
    if similarities[0, best_idx] < 0.3:  # ถ้า similarity ต่ำเกินไป
        return None
    return chatbot_data[best_idx]["bot"]

def chat_with_bot(user_input):
    context_memory.append({"user": user_input, "bot": None})
    
    # หาคำตอบจาก TF-IDF
    response = find_best_match(user_input)
    
    if not response:
        # พยายามดู context ก่อนหน้า
        last_topic = None
        for prev in reversed(context_memory[:-1]):
            if "user" in prev:
                last_topic = prev["user"]
                break
        if last_topic:
            response = f"ทวนคำถาม '{user_input}' ค่ะ ฉันไม่เข้าใจ แต่คุณพูดถึง '{last_topic}' ใช่ไหมคะ?"
        else:
            response = f"ทวนคำถาม '{user_input}' ค่ะ ฉันไม่เข้าใจ"

        # บันทึกคำถามใหม่ลง chatbot_data เพื่อเรียนรู้
        chatbot_data.append({"user": user_input, "bot": response})
        save_data()

    context_memory[-1]["bot"] = response
    save_memory()
    
    return response

# -------------------------
print("🤖 สวัสดีค่ะ! พิมพ์ 'ลืมทั้งหมด' เพื่อล้างความจำ หรือ 'ออก' เพื่อจบ\n")

while True:
    user_input = input("👤 คุณ: ").strip()
    if user_input.lower() in ["ออก", "exit", "quit"]:
        print("🤖 บอท: บ๊ายบายค่ะ ❤️")
        break
    elif user_input.lower() in ["ลืมทั้งหมด", "forget"]:
        context_memory.clear()
        save_memory()
        print("🤖 บอท: ล้างความจำเรียบร้อยค่ะ 🧠✨")
        continue

    reply = chat_with_bot(user_input)
    print("🤖 บอท:", reply)
