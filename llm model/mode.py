from PIL import Image
from transformers import TrOCRProcessor
from optimum.onnxruntime import ORTModelForVision2Seq

processor = TrOCRProcessor.from_pretrained('breezedeus/pix2text-mfr')
model = ORTModelForVision2Seq.from_pretrained('breezedeus/pix2text-mfr', use_cache=False)

image_fps = [
    '800wm.jpg'
]
images = [Image.open(fp).convert('RGB') for fp in image_fps]
pixel_values = processor(images=images, return_tensors="pt").pixel_values

print(f'pixel_values: {pixel_values}')

generated_ids = model.generate(pixel_values)

generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)

print(f'generated_ids: {generated_ids}, \ngenerated text: {generated_text}')
