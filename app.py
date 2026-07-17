from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from transformers import T5ForConditionalGeneration, T5Tokenizer
import torch
import re

app = FastAPI(
    title="T5 Text Summarization API",
    description="A API for summarizing text using the T5 model",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory="."), name="static")

#MODEL_PATH = r"C:\Users\LENOVO\OneDrive\Desktop\Project\Text_summarizer\save_summary_model"

model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)
tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("device:", device)
model.to(device)

templates = Jinja2Templates(directory=".")

class InputText(BaseModel):
    dialogue: str

def clean_text(text: str) -> str:
    text = re.sub(r"\r\n", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"<.*?>", " ", text)
    text = re.sub(r"[^a-zA-Z0-9.,!?'\-\s]", " ", text)
    text = text.strip().lower()
    return text

def summarize_dialogue(dialogue: str) -> str:
    inputs = tokenizer(
        dialogue,
        max_length=512,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    ).to(device)

    target = model.generate(
        input_ids=inputs["input_ids"].to(device),
        attention_mask=inputs["attention_mask"].to(device),
        max_length=150,
        num_beams=4,
        repetition_penalty=2.5,
        length_penalty=1.0,
        early_stopping=True,
    )

    summary = tokenizer.decode(
        target[0],
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )

    return summary

@app.post("/summarize")
async def summarize(input_text: InputText):
    cleaned_text = clean_text(input_text.dialogue)
    summary = summarize_dialogue(cleaned_text)
    return {"summary": summary}

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")