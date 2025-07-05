from transformers import (
    TrOCRProcessor, 
    VisionEncoderDecoderModel,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq
)
from datasets import Dataset
import torch
from PIL import Image
import json
import os

class PromptTemplate:
    def __init__(self, template=None):
        # Default template for mathematical formulas
        self.template = template or "Convert this mathematical formula image to LaTeX: {formula}"
        
    def format(self, formula):
        return self.template.format(formula=formula)
    
    def get_special_tokens(self):
        return {
            "bos_token": "<s>",
            "eos_token": "</s>",
            "pad_token": "<pad>",
            "unk_token": "<unk>"
        }

def load_dataset(image_dir, annotations_file, prompt_template=None):
    """
    Load dataset from images and annotations with optional prompt template
    annotations_file should be a JSON file with format:
    {
        "image_name.jpg": {
            "formula": "latex_formula",
            "prompt": "optional_custom_prompt"  # optional
        }
        or
        "image_name.jpg": "latex_formula"  # simple format
    }
    """
    data = {
        "image_path": [],
        "text": [],
        "prompt": []
    }
    
    prompt_handler = PromptTemplate(prompt_template)
    
    with open(annotations_file, 'r') as f:
        annotations = json.load(f)
    
    for image_name, annotation in annotations.items():
        image_path = os.path.join(image_dir, image_name)
        if not os.path.exists(image_path):
            continue
            
        # Handle both simple and detailed annotation formats
        if isinstance(annotation, dict):
            formula = annotation.get("formula", "")
            custom_prompt = annotation.get("prompt")
        else:
            formula = annotation
            custom_prompt = None
            
        if formula:
            data["image_path"].append(image_path)
            data["text"].append(formula)
            # Use custom prompt if provided, otherwise use template
            prompt = custom_prompt if custom_prompt else prompt_handler.format(formula)
            data["prompt"].append(prompt)
    
    return Dataset.from_dict(data)

def preprocess_function(examples, processor, prompt_template=None):
    """Preprocess images and text for the model with prompts"""
    images = [Image.open(image_path).convert("RGB") for image_path in examples["image_path"]]
    pixel_values = processor(images=images, return_tensors="pt").pixel_values
    
    # Combine prompts with formulas if provided
    if prompt_template and "prompt" in examples:
        texts = [f"{p} {t}" for p, t in zip(examples["prompt"], examples["text"])]
    else:
        texts = examples["text"]
    
    # Tokenize the text
    labels = processor.tokenizer(
        texts,
        padding="max_length",
        max_length=128,
        truncation=True
    ).input_ids
    
    return {
        "pixel_values": pixel_values,
        "labels": labels
    }

def main():
    # Initialize model and processor
    processor = TrOCRProcessor.from_pretrained('breezedeus/pix2text-mfr')
    model = VisionEncoderDecoderModel.from_pretrained('breezedeus/pix2text-mfr')
    
    # Define your custom prompt template
    prompt_template = PromptTemplate(
        "Given this mathematical expression image, convert it to LaTeX format. "
        "Focus on accuracy and proper mathematical notation: {formula}"
    )
    
    # Load dataset with prompt template
    train_dataset = load_dataset(
        image_dir="path/to/train/images",
        annotations_file="path/to/train/annotations.json",
        prompt_template=prompt_template
    )
    
    # Preprocess dataset with prompts
    processed_dataset = train_dataset.map(
        lambda x: preprocess_function(x, processor, prompt_template),
        batched=True,
        remove_columns=train_dataset.column_names
    )
    
    # Training arguments
    training_args = Seq2SeqTrainingArguments(
        output_dir="./results",
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        warmup_steps=500,
        weight_decay=0.01,
        logging_dir="./logs",
        logging_steps=10,
        evaluation_strategy="steps",
        eval_steps=100,
        save_strategy="steps",
        save_steps=100,
        learning_rate=5e-5,
        fp16=True,  # Use mixed precision training
        report_to="tensorboard"
    )
    
    # Data collator
    data_collator = DataCollatorForSeq2Seq(
        processor.tokenizer,
        model=model,
        padding="max_length",
        max_length=128
    )
    
    # Initialize trainer
    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=processed_dataset,
        data_collator=data_collator,
        tokenizer=processor.tokenizer
    )
    
    # Train the model
    trainer.train()
    
    # Save the model
    trainer.save_model("./fine_tuned_model")
    processor.save_pretrained("./fine_tuned_model")

if __name__ == "__main__":
    main() 