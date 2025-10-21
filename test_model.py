import os
import tensorflow as tf
import numpy as np
import cv2
from tensorflow.keras.layers import DepthwiseConv2D

# ปิด oneDNN warning
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

# ✅ แก้บั๊ก DepthwiseConv2D
def fixed_depthwiseconv2d_init(self, *args, **kwargs):
    kwargs.pop('groups', None)
    super(DepthwiseConv2D, self).__init__(*args, **kwargs)
DepthwiseConv2D.__init__ = fixed_depthwiseconv2d_init

# โหลดโมเดล
model = tf.keras.models.load_model("keras_model.h5", compile=False)

# โหลด labels
class_names = open("labels.txt", "r").readlines()

# โหลดภาพทดสอบ
image = cv2.imread("1.jpg")
if image is None:
    raise Exception("ไม่พบไฟล์รูป 1.jpg")

image_resized = cv2.resize(image, (224, 224))
image_array = np.asarray(image_resized, dtype=np.float32).reshape(1, 224, 224, 3)
image_array = (image_array / 127.5) - 1

prediction = model.predict(image_array)
index = np.argmax(prediction)
confidence = prediction[0][index]

print(f"Class: {class_names[index].strip()} | Confidence: {confidence:.2f}")
