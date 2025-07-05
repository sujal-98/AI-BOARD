from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import torch
from transformers import TrOCRProcessor
from optimum.onnxruntime import ORTModelForVision2Seq
from transformers import AutoTokenizer, AutoModelForCausalLM
import uvicorn

app = FastAPI(
    title="Mathematical Formula Recognition API And Solver",
    description="API for recognizing mathematical formulas from images using pix2text model and solving the formula",
    version="1.0.1"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

# Initialize model and processor globally
try:
    processor = TrOCRProcessor.from_pretrained('breezedeus/pix2text-mfr')
    model = ORTModelForVision2Seq.from_pretrained('breezedeus/pix2text-mfr', use_cache=False)
    
    # For solving latex math to solution
    tokenizer = AutoTokenizer.from_pretrained("WizardLM/WizardMath-7B-V1.1")
    modelMath = AutoModelForCausalLM.from_pretrained("WizardLM/WizardMath-7B-V1.1")  
except Exception as e:
    print(f"Error loading model: {e}")
    raise

@app.get("/")
async def root():
    return {"message": "Welcome to Mathematical Formula Recognition API. Use /docs for API documentation."}


@app.post("/solve-formula/")
async def solve_formula(formula: str):
    try:
        inputs = tokenizer(formula, return_tensors="pt")
        outputs = modelMath.generate(**inputs)
        solution = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return JSONResponse({"solution": solution})
    except Exception as e:
        print(f"Error solving formula: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/recognize-formula/")
async def recognize_formula(file: UploadFile = File(...)):
    try:
        # Read and validate the image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Process the image with proper tensor conversion
        inputs = processor(images=image, return_tensors="pt")
        pixel_values = inputs.pixel_values
        
        # Ensure pixel_values is in the correct format
        if not isinstance(pixel_values, torch.Tensor):
            pixel_values = torch.tensor(pixel_values)
        
        # Generate text
        generated_ids = model.generate(pixel_values=pixel_values)
        generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)
        
        return JSONResponse({
            "status": "success",
            "formula": generated_text[0],
            "explanation": "This is the recognized mathematical formula in LaTeX notation. It can be rendered using a LaTeX renderer."
        })
        
    except Exception as e:
        print(f"Error processing image: {str(e)}")  # Add logging
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 