import json
import sys
import os
import numpy as np

# Attempt imports with detailed error handling
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
except ImportError as e:
    error_msg = {
        "blanks": [],
        "overall": "Error: Missing dependencies",
        "details": f"{str(e)}. Install with: pip install --user sentence-transformers==2.7.0 numpy==1.26.4 scikit-learn==1.5.0 transformers==4.41.2 huggingface_hub==0.23.4"
    }
    print(json.dumps(error_msg))
    sys.exit(1)

# Set relative path to the local model directory
# Set path to the model directory
model_path = os.path.join(
    os.path.dirname(__file__),                                                  
    '..',                                     
    'model',
    'all-MiniLM-L6-v2',
)

# Validate model directory and files
if not os.path.exists(model_path):
    error_msg = {
        "blanks": [],
        "overall": "Error: Model directory not found",
        "details": f"Directory {model_path} does not exist. Download model with: from sentence_transformers import SentenceTransformer; model = SentenceTransformer('all-MiniLM-L6-v2'); model.save('{model_path}')"
    }
    print(json.dumps(error_msg))
    sys.exit(1)

required_files = ['config.json', 'pytorch_model.bin']
missing_files = [f for f in required_files if not os.path.exists(os.path.join(model_path, f))]
if missing_files:
    error_msg = {
        "blanks": [],
        "overall": "Error: Missing model files",
        "details": f"Missing files in {model_path}: {', '.join(missing_files)}. Redownload the model."
    }
    print(json.dumps(error_msg))
    sys.exit(1)

# Load the model with error handling
try:
    model = SentenceTransformer(model_path)
except Exception as e:
    error_msg = {
        "blanks": [],
        "overall": "Error: Model loading failed",
        "details": f"{str(e)}. Check if model files are corrupted or incompatible. Path: {model_path}"
    }
    print(json.dumps(error_msg))
    sys.exit(1)

# Read input from stdin
try:
    input_data = sys.stdin.read().strip()
    if not input_data:
        raise ValueError("No input data provided")
    data = json.loads(input_data)
    question = data.get('question', '')
    user_answers = data.get('userAnswers', [])
    blanks = data.get('blanks', 0)
    correct_answers = data.get('correctAnswers', [])
except (json.JSONDecodeError, ValueError) as e:
    error_msg = {
        "blanks": [],
        "overall": "Error: Invalid input format",
        "details": str(e)
    }
    print(json.dumps(error_msg))
    sys.exit(1)

# Validate inputs
if not isinstance(user_answers, list) or len(user_answers) != blanks:
    error_msg = {
        "blanks": [],
        "overall": f"Error: Expected {blanks} answers, got {len(user_answers)}",
        "details": "Input validation failed: userAnswers must be a list with length equal to blanks"
    }
    print(json.dumps(error_msg))
    sys.exit(1)

if not isinstance(correct_answers, list) or len(correct_answers) != blanks:
    error_msg = {
        "blanks": [],
        "overall": f"Error: Expected {blanks} correct answer sets, got {len(correct_answers)}",
        "details": "Input validation failed: correctAnswers must be a list of lists with length equal to blanks"
    }
    print(json.dumps(error_msg))
    sys.exit(1)

# Ensure all user answers are strings
user_answers = [str(ans) if ans is not None else "" for ans in user_answers]

# Threshold for "correct" (tuned for all-MiniLM-L6-v2)
SIMILARITY_THRESHOLD = 0.65

# Optimize: Batch encode all answers at once
try:
    # Prepare all texts for encoding
    all_texts = user_answers + [opt for sublist in correct_answers for opt in sublist if isinstance(opt, str)]
    if not all_texts:
        raise ValueError("No valid texts to encode")
    
    all_embeddings = model.encode(all_texts, convert_to_numpy=True)
    
    # Split embeddings
    user_embeddings = all_embeddings[:len(user_answers)]
    correct_embeddings = all_embeddings[len(user_answers):]
    correct_idx = 0

    blanks_results = []
    all_correct = True
    for i in range(blanks):
        user_ans = user_answers[i].lower().strip()
        correct_opts = [opt.lower().strip() for opt in correct_answers[i] if isinstance(opt, str)]
        
        if not user_ans:
            blanks_results.append({
                "isCorrect": False,
                "userAnswer": user_answers[i],
                "correctAnswers": ", ".join(correct_opts),
                "explanation": "No answer provided for this blank."
            })
            all_correct = False
            continue
        
        # Compute max similarity for this blank
        max_sim = 0.0
        best_correct = ""
        for j in range(len(correct_opts)):
            sim = float(cosine_similarity([user_embeddings[i]], [correct_embeddings[correct_idx + j]])[0][0])
            if sim > max_sim:
                max_sim = sim
                best_correct = correct_opts[j]
        
        is_correct = bool(max_sim >= SIMILARITY_THRESHOLD or user_ans in correct_opts)
        explanation = ""
        if not is_correct:
            all_correct = False
            if user_ans in correct_opts:
                explanation = f"Answer '{user_ans}' is correct but not recognized due to low similarity score ({max_sim:.2f})."
            else:
                explanation = f"Answer '{user_ans}' does not match any correct options: {', '.join(correct_opts)}. Similarity score: {max_sim:.2f} (threshold: {SIMILARITY_THRESHOLD})."
        
        blanks_results.append({
            "isCorrect": is_correct,
            "userAnswer": user_answers[i],
            "correctAnswers": ", ".join(correct_opts),
            "explanation": explanation if not is_correct else "Answer is correct."
        })
        
        correct_idx += len(correct_opts)

    overall = "Correct!" if all_correct else "Incorrect"

    # Output JSON
    output = {
        "blanks": blanks_results,
        "overall": overall
    }
    print(json.dumps(output, ensure_ascii=False))

except Exception as e:
    error_msg = {
        "blanks": [],
        "overall": "Error: Processing failed",
        "details": str(e)
    }
    print(json.dumps(error_msg))
    sys.exit(1)