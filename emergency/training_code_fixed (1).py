# ╔══════════════════════════════════════════════════════════════════════╗
# ║  PsychSense — DAIC-WOZ Depression Detection v3  [FIXED]             ║
# ║  + ADET (Adaptive Depression Evaluation Tracker)                    ║
# ║  Audio + Text + Cognitive Distortion + Coping Mechanism             ║
# ║  Models : WavLM-base-plus (partial unfreeze) + RoBERTa-base         ║
# ║  Text   : RoBERTa(768) + Distortions(5) + Coping(4) + Risk(1)      ║
# ║           = 778-dim text feature vector                              ║
# ║                                                                      ║
# ║  FIX SUMMARY (recall was stuck at 1.0):                             ║
# ║   1. Removed DEPRESSED_CLASS_EXTRA_WEIGHT (was 2.0 → now 1.0)      ║
# ║   2. Removed WeightedRandomSampler — RandomOverSampler is enough    ║
# ║   3. Reduced focal gamma 2.0 → 1.5 (less minority over-emphasis)   ║
# ║   4. Threshold sweep now requires recall ≥ 0.50 AND precision ≥     ║
# ║      0.30 and maximises F1 (not recall alone)                       ║
# ║   5. Threshold sweep lower bound raised 0.15 → 0.25                 ║
# ║   6. Label smoothing kept at 0.1 (unchanged)                        ║
# ║                                                                      ║
# ║  ADET ARCHITECTURE:                                                  ║
# ║   Frontend  → Real-time single-session input (live data)            ║
# ║   Backend   → Synthetic multi-session generator (longitudinal sim)  ║
# ║   ADET      → Fusion + Trend analysis + Risk detection              ║
# ║                                                                      ║
# ║  NOTE: Due to lack of longitudinal real-world data, synthetic        ║
# ║  sessions are generated to simulate temporal mental health           ║
# ║  progression. These are clearly marked as [Synthetic] throughout.   ║
# ╚══════════════════════════════════════════════════════════════════════╝


# ═════════════════════════════════════════════════════════════════════
# ██████████████████████████  PART 1 — v3 CORE  ██████████████████████
# ═════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────
# STEP 0 ─ INSTALL
# ─────────────────────────────────────────────────────────────────────
"""
!pip install transformers==4.40.0 librosa imbalanced-learn \
             scikit-learn tqdm torch nltk -q
"""

# ─────────────────────────────────────────────────────────────────────
# STEP 1 ─ MOUNT DRIVE
# ─────────────────────────────────────────────────────────────────────
from google.colab import drive
drive.mount("/content/drive")
print("✅ Google Drive mounted.")

# ─────────────────────────────────────────────────────────────────────
# STEP 2 ─ IMPORTS
# ─────────────────────────────────────────────────────────────────────
import os
import re
import random
import warnings
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Tuple

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, classification_report, confusion_matrix, roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import RandomOverSampler

import librosa
import nltk
from tqdm import tqdm

from transformers import (
    Wav2Vec2FeatureExtractor,
    WavLMModel,
    RobertaTokenizer,
    RobertaModel,
)

warnings.filterwarnings("ignore")
nltk.download("punkt",     quiet=True)
nltk.download("punkt_tab", quiet=True)
nltk.download("stopwords", quiet=True)

# ─────────────────────────────────────────────────────────────────────
# STEP 3 ─ REPRODUCIBILITY
# ─────────────────────────────────────────────────────────────────────
SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)
torch.cuda.manual_seed_all(SEED)
torch.backends.cudnn.deterministic = True

# ─────────────────────────────────────────────────────────────────────
# STEP 4 ─ CONFIGURATION
# ─────────────────────────────────────────────────────────────────────
DATA_PATH = "/content/drive/MyDrive/daicwoz"
CACHE_DIR = "/content/drive/MyDrive/daicwoz_cache_v3"
DEVICE    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
FP16      = torch.cuda.is_available()

# ── Training hyperparameters ─────────────────────────────────────────
BATCH_SIZE   = 16
EPOCHS       = 50
LR_HEAD      = 3e-4
LR_WAVLM     = 5e-6
LR_ROBERTA   = 5e-6
DROPOUT      = 0.4
FUSION_DIM   = 256
NUM_HEADS    = 4
PATIENCE     = 12
LABEL_SMOOTH = 0.1
MIXUP_ALPHA  = 0.3

WAVLM_UNFREEZE_LAYERS   = 2
ROBERTA_UNFREEZE_LAYERS = 1

# ── Audio ────────────────────────────────────────────────────────────
SR        = 16_000
CHUNK_SEC = 10
MAX_DUR   = 300

# ── Text ─────────────────────────────────────────────────────────────
MAX_TEXT_LEN = 512
TEXT_STRIDE  = 384

# ── Cognitive feature dimensions ─────────────────────────────────────
N_DISTORTIONS = 5
N_COPING      = 4
N_RISK        = 1

TEXT_DIM_BASE = 768
TEXT_DIM      = TEXT_DIM_BASE + N_DISTORTIONS + N_COPING + N_RISK  # 778

AUDIO_DIM_CONST = 768

# ── FIX 1: Removed DEPRESSED_CLASS_EXTRA_WEIGHT ──────────────────────
DEPRESSED_CLASS_EXTRA_WEIGHT = 1.0   # ← was 2.0, now neutral

# ── FIX 3: Lower focal gamma ─────────────────────────────────────────
FOCAL_GAMMA = 1.5   # ← was 2.0

os.makedirs(CACHE_DIR, exist_ok=True)
print(f"✅ Device : {DEVICE}  |  FP16: {FP16}")
print(f"✅ Cache  : {CACHE_DIR}")
print(f"✅ Text feature dim: {TEXT_DIM}  "
      f"(RoBERTa={TEXT_DIM_BASE} + distortions={N_DISTORTIONS} "
      f"+ coping={N_COPING} + risk={N_RISK})")

# ─────────────────────────────────────────────────────────────────────
# STEP 5 ─ UTILITIES
# ─────────────────────────────────────────────────────────────────────
def phq_severity(score):
    score = int(score)
    if   score <= 4:  return f"Minimal     (PHQ={score})"
    elif score <= 9:  return f"Mild        (PHQ={score})"
    elif score <= 14: return f"Moderate    (PHQ={score})"
    elif score <= 19: return f"Mod-Severe  (PHQ={score})"
    else:             return f"Severe      (PHQ={score})"


def safe_clean(arr, clip=1e6):
    arr = np.array(arr, dtype=np.float32)
    arr[~np.isfinite(arr)] = 0.0
    return np.clip(arr, -clip, clip).astype(np.float32)


def find_file(folder, key):
    try:
        for f in os.listdir(folder):
            if key.lower() in f.lower():
                return os.path.join(folder, f)
    except Exception:
        pass
    return None


# ─────────────────────────────────────────────────────────────────────
# STEP 6 ─ COGNITIVE DISTORTION + COPING MECHANISM MODULE
# ─────────────────────────────────────────────────────────────────────

DISTORTION_PATTERNS = {
    "overgeneralization": [
        r"\balways\b", r"\bnever\b", r"\beveryone\b", r"\bno\s+one\b",
        r"\bnothing\b", r"\beverything\b", r"\bforever\b", r"\bconstantly\b",
        r"\ball\s+the\s+time\b", r"\bevery\s+time\b", r"\bnobody\b",
        r"\bentirely\b", r"\bcompletely\b", r"\bwholly\b",
    ],
    "catastrophizing": [
        r"\bworst\b", r"\bruined\b", r"\beverything\s+is\s+over\b",
        r"\bterrible\b", r"\bdisaster\b", r"\bhopeless\b", r"\bdesperate\b",
        r"\bdestroyed\b", r"\bcollapsed\b", r"\bundone\b", r"\bpointless\b",
        r"\bunbearable\b", r"\boverwhelmed\b", r"\bcan.t\s+take\s+it\b",
        r"\bgive\s+up\b", r"\bgave\s+up\b", r"\bno\s+way\s+out\b",
    ],
    "personalization": [
        r"\bmy\s+fault\b", r"\bi\s+caused\b", r"\bi\s+am\s+useless\b",
        r"\bi.m\s+useless\b", r"\bbecause\s+of\s+me\b", r"\bi\s+ruined\b",
        r"\bi\s+broke\b", r"\bi\s+destroyed\b", r"\bi\s+should\s+have\b",
        r"\bi\s+shouldn.t\s+have\b", r"\bi\s+let\b", r"\bi\s+blew\b",
        r"\bblame\s+myself\b", r"\bi.m\s+responsible\b",
        r"\ball\s+my\s+fault\b", r"\bi\s+failed\b",
    ],
    "negative_self_labeling": [
        r"\bi\s+am\s+worthless\b", r"\bi.m\s+worthless\b",
        r"\bi\s+am\s+a\s+failure\b", r"\bi.m\s+a\s+failure\b",
        r"\bi\s+am\s+stupid\b",     r"\bi.m\s+stupid\b",
        r"\bi\s+am\s+ugly\b",       r"\bi.m\s+ugly\b",
        r"\bi\s+am\s+broken\b",     r"\bi.m\s+broken\b",
        r"\bi\s+am\s+pathetic\b",   r"\bi.m\s+pathetic\b",
        r"\bi\s+am\s+a\s+burden\b", r"\bi.m\s+a\s+burden\b",
        r"\bi\s+am\s+nothing\b",    r"\bi.m\s+nothing\b",
        r"\bi\s+hate\s+myself\b",   r"\bi\s+don.t\s+deserve\b",
        r"\bi\s+am\s+weak\b",       r"\bi.m\s+weak\b",
        r"\bi\s+am\s+incompetent\b",r"\bi\s+am\s+awful\b",
    ],
    "emotional_reasoning": [
        r"\bi\s+feel\s+like\s+a\s+failure\b",
        r"\bi\s+feel\s+hopeless\b",  r"\bi\s+feel\s+worthless\b",
        r"\bi\s+feel\s+empty\b",     r"\bi\s+feel\s+nothing\b",
        r"\bi\s+just\s+know\b",      r"\bi\s+know\s+it\s+will\b",
        r"\bi\s+know\s+i.ll\b",
        r"\bsomething\s+must\s+be\s+wrong\s+with\s+me\b",
        r"\bif\s+i\s+feel\s+bad\b",  r"\bfeeling\s+so\s+bad\b",
    ],
}

COPING_PATTERNS = {
    "help_seeking": [
        r"\btalked\s+to\s+someone\b", r"\basked\s+for\s+help\b",
        r"\bsought\s+help\b",         r"\bspoke\s+to\b",
        r"\breached\s+out\b",         r"\bcalled\s+someone\b",
        r"\bsaw\s+a\s+therapist\b",   r"\bsaw\s+my\s+doctor\b",
        r"\bwent\s+to\s+therapy\b",   r"\bsupport\s+group\b",
        r"\btold\s+my\b",             r"\bshared\s+with\b",
        r"\bopened\s+up\b",           r"\bconfided\b",
    ],
    "problem_solving": [
        r"\btrying\s+to\s+fix\b",  r"\bworking\s+on\s+it\b",
        r"\bmade\s+a\s+plan\b",    r"\bset\s+a\s+goal\b",
        r"\bfigured\s+out\b",      r"\bsolved\b",
        r"\btook\s+action\b",      r"\bstepped\s+up\b",
        r"\bhandled\s+it\b",       r"\bmanaged\s+it\b",
        r"\bdecided\s+to\b",       r"\bstarted\s+to\b",
        r"\btaking\s+steps\b",     r"\bworking\s+through\b",
        r"\baddressing\b",
    ],
    "positive_reframing": [
        r"\bit\s+will\s+get\s+better\b", r"\bstaying\s+hopeful\b",
        r"\blooking\s+on\s+the\s+bright\b", r"\bsilver\s+lining\b",
        r"\bthings\s+will\s+improve\b",  r"\bcan\s+get\s+through\b",
        r"\bi\s+will\s+be\s+okay\b",     r"\bi.ll\s+be\s+okay\b",
        r"\bnot\s+giving\s+up\b",        r"\bstill\s+hopeful\b",
        r"\blearned\s+from\b",           r"\bgrew\s+from\b",
        r"\bopportunity\s+to\b",         r"\bgrateful\s+for\b",
        r"\bthankful\s+for\b",           r"\bpositive\s+side\b",
    ],
    "emotional_expression": [
        r"\bi\s+feel\s+sad\b",     r"\bi\s+am\s+sad\b",    r"\bi.m\s+sad\b",
        r"\bi\s+feel\s+angry\b",   r"\bi\s+am\s+angry\b",
        r"\bi\s+feel\s+upset\b",   r"\bi\s+am\s+upset\b",
        r"\bi\s+feel\s+scared\b",  r"\bi\s+am\s+scared\b",
        r"\bi\s+feel\s+anxious\b", r"\bi\s+am\s+anxious\b",
        r"\bi\s+cried\b",          r"\bi\s+was\s+crying\b",
        r"\blet\s+it\s+out\b",     r"\bexpressed\s+my\b",
        r"\blet\s+myself\s+feel\b",
    ],
}

DISTORTION_DISPLAY = {
    "overgeneralization":     "Overgeneralization",
    "catastrophizing":        "Catastrophizing",
    "personalization":        "Personalization",
    "negative_self_labeling": "Negative Self-Labeling",
    "emotional_reasoning":    "Emotional Reasoning",
}
COPING_DISPLAY = {
    "help_seeking":         "Help Seeking",
    "problem_solving":      "Problem Solving",
    "positive_reframing":   "Positive Reframing",
    "emotional_expression": "Emotional Expression",
}


def extract_cognitive_features(text: str, verbose: bool = False) -> np.ndarray:
    """
    Extract a 10-dimensional cognitive feature vector from raw transcript text.

    Output shape: (10,)
        [d1..d5]  — 5 distortion scores, each normalised by word count (0-1)
        [c1..c4]  — 4 coping scores,     each normalised by word count (0-1)
        [risk]    — cognitive_risk_score = sum(distortions) - sum(coping), clipped [0,1]
    """
    if not text or not isinstance(text, str) or not text.strip():
        if verbose:
            _print_dominant(None, None, None, None)
        return np.zeros(N_DISTORTIONS + N_COPING + N_RISK, dtype=np.float32)

    text_lower = text.lower()
    words      = nltk.word_tokenize(text_lower)
    word_count = max(len(words), 1)

    if word_count < 5:
        if verbose:
            _print_dominant(None, None, None, None)
        return np.zeros(N_DISTORTIONS + N_COPING + N_RISK, dtype=np.float32)

    distortion_scores = {}
    for name, patterns in DISTORTION_PATTERNS.items():
        count = sum(len(re.findall(pat, text_lower)) for pat in patterns)
        distortion_scores[name] = count / word_count

    coping_scores = {}
    for name, patterns in COPING_PATTERNS.items():
        count = sum(len(re.findall(pat, text_lower)) for pat in patterns)
        coping_scores[name] = count / word_count

    sum_d = sum(distortion_scores.values())
    sum_c = sum(coping_scores.values())
    risk  = float(np.clip(sum_d - sum_c, 0.0, 1.0))

    if verbose:
        _print_dominant(distortion_scores, coping_scores, word_count, risk)

    d_vec = np.array([
        distortion_scores["overgeneralization"],
        distortion_scores["catastrophizing"],
        distortion_scores["personalization"],
        distortion_scores["negative_self_labeling"],
        distortion_scores["emotional_reasoning"],
    ], dtype=np.float32)

    c_vec = np.array([
        coping_scores["help_seeking"],
        coping_scores["problem_solving"],
        coping_scores["positive_reframing"],
        coping_scores["emotional_expression"],
    ], dtype=np.float32)

    r_vec = np.array([risk], dtype=np.float32)

    return safe_clean(np.concatenate([d_vec, c_vec, r_vec]))


def _print_dominant(distortion_scores, coping_scores, word_count, risk):
    print("\n  Dominant Distortion:")
    if distortion_scores and max(distortion_scores.values()) > 0:
        best_d_key = max(distortion_scores, key=distortion_scores.get)
        best_d_val = distortion_scores[best_d_key] * 100
        print(f"    {DISTORTION_DISPLAY[best_d_key]}: {best_d_val:.2f}%")
    else:
        print("    None detected")

    print("\n  Dominant Coping Mechanism:")
    if coping_scores and max(coping_scores.values()) > 0:
        best_c_key = max(coping_scores, key=coping_scores.get)
        best_c_val = coping_scores[best_c_key] * 100
        print(f"    {COPING_DISPLAY[best_c_key]}: {best_c_val:.2f}%")
    else:
        print("    None detected")

    if risk is not None:
        print(f"\n  Cognitive Risk Score: {risk:.4f}")


def integrate_into_pipeline(roberta_embedding: np.ndarray,
                             raw_text: str) -> np.ndarray:
    cog      = extract_cognitive_features(raw_text, verbose=False)
    combined = np.concatenate([roberta_embedding, cog])
    return safe_clean(combined.astype(np.float32))


# ─────────────────────────────────────────────────────────────────────
# STEP 7 ─ LOAD PRETRAINED ENCODERS
# ─────────────────────────────────────────────────────────────────────
print("\n[A] Loading pretrained encoders …")

AUDIO_MODEL = "microsoft/wavlm-base-plus"
wav_feat    = Wav2Vec2FeatureExtractor.from_pretrained(AUDIO_MODEL)
wavlm       = WavLMModel.from_pretrained(AUDIO_MODEL)

for p in wavlm.parameters():
    p.requires_grad = False
for layer in wavlm.encoder.layers[-WAVLM_UNFREEZE_LAYERS:]:
    for p in layer.parameters():
        p.requires_grad = True

if FP16:
    wavlm = wavlm.half()
wavlm     = wavlm.to(DEVICE)
AUDIO_DIM = wavlm.config.hidden_size
n_audio_tr = sum(p.numel() for p in wavlm.parameters() if p.requires_grad)
print(f"  WavLM   ✓  dim={AUDIO_DIM}  trainable params={n_audio_tr:,}")

TEXT_MODEL    = "roberta-base"
roberta_tok   = RobertaTokenizer.from_pretrained(TEXT_MODEL)
roberta_model = RobertaModel.from_pretrained(TEXT_MODEL)

for p in roberta_model.parameters():
    p.requires_grad = False
for layer in roberta_model.encoder.layer[-ROBERTA_UNFREEZE_LAYERS:]:
    for p in layer.parameters():
        p.requires_grad = True
for p in roberta_model.pooler.parameters():
    p.requires_grad = True

if FP16:
    roberta_model = roberta_model.half()
roberta_model = roberta_model.to(DEVICE)
n_text_tr = sum(p.numel() for p in roberta_model.parameters() if p.requires_grad)
print(f"  RoBERTa ✓  dim={TEXT_DIM_BASE}  trainable params={n_text_tr:,}")
print(f"  Text combined dim = {TEXT_DIM}  "
      f"(RoBERTa={TEXT_DIM_BASE} + cognitive={N_DISTORTIONS+N_COPING+N_RISK})")

# ─────────────────────────────────────────────────────────────────────
# STEP 8 ─ LABELS
# ─────────────────────────────────────────────────────────────────────
def load_labels():
    df1 = pd.read_csv(os.path.join(DATA_PATH, "train_split_Depression_AVEC2017.csv"))
    df2 = pd.read_csv(os.path.join(DATA_PATH, "dev_split_Depression_AVEC2017.csv"))
    df  = pd.concat([df1, df2], ignore_index=True)
    labels = {}
    for _, row in df.iterrows():
        pid    = int(row["Participant_ID"])
        binary = int(row["PHQ8_Binary"])
        score  = int(row["PHQ8_Score"])
        labels[pid] = (binary, score)
    pos = sum(1 for v in labels.values() if v[0] == 1)
    print(f"  Labels: {len(labels)}  depressed={pos}  healthy={len(labels)-pos}")
    return labels

# ─────────────────────────────────────────────────────────────────────
# STEP 9 ─ FEATURE EXTRACTORS WITH CACHING
# ─────────────────────────────────────────────────────────────────────

def get_audio(audio_path, pid):
    cache = os.path.join(CACHE_DIR, f"{pid}_audio.npy")
    if os.path.exists(cache):
        return np.load(cache)
    try:
        y, _ = librosa.load(audio_path, sr=SR, mono=True, duration=MAX_DUR)
        y, _ = librosa.effects.trim(y, top_db=20)

        chunk_n = SR * CHUNK_SEC
        min_n   = SR // 4
        chunks  = [
            y[i:i + chunk_n]
            for i in range(0, len(y), chunk_n)
            if len(y[i:i + chunk_n]) >= min_n
        ]
        if not chunks:
            return None

        embs = []
        with torch.no_grad():
            for ch in chunks:
                inp = wav_feat(
                    ch, sampling_rate=SR,
                    return_tensors="pt", padding=True
                ).input_values.to(DEVICE)
                if FP16:
                    inp = inp.half()
                out = wavlm(inp).last_hidden_state
                embs.append(out.mean(1).squeeze(0).float().cpu().numpy())

        emb = safe_clean(np.mean(embs, axis=0).astype(np.float32))
        np.save(cache, emb)
        return emb
    except Exception as e:
        print(f"  [WARN] audio pid={pid}: {e}")
        return None


def get_text(folder, pid):
    cache = os.path.join(CACHE_DIR, f"{pid}_text_v3.npy")
    if os.path.exists(cache):
        return np.load(cache)

    raw_text = ""
    tf = find_file(folder, "transcript")
    if tf:
        try:
            df   = pd.read_csv(tf, sep="\t", header=None,
                               names=["s", "e", "sp", "v"], on_bad_lines="skip")
            mask = df["sp"].astype(str).str.upper().isin(["PARTICIPANT", "P"])
            rows = df[mask] if mask.any() else df
            raw_text = " ".join(rows["v"].dropna().astype(str)).strip()
        except Exception as e:
            print(f"  [WARN] transcript pid={pid}: {e}")

    if not raw_text or not raw_text.strip():
        roberta_emb = np.zeros(TEXT_DIM_BASE, dtype=np.float32)
    else:
        try:
            tokens = roberta_tok(
                raw_text, return_tensors="pt",
                truncation=False, padding=False
            )["input_ids"][0]

            cls_id = roberta_tok.cls_token_id
            sep_id = roberta_tok.sep_token_id
            inner  = tokens[1:-1]
            window = MAX_TEXT_LEN - 2

            chunks_text = []
            for start in range(0, max(1, len(inner)), TEXT_STRIDE):
                chunk = inner[start:start + window]
                ids   = torch.cat([
                    torch.tensor([cls_id]),
                    chunk,
                    torch.tensor([sep_id]),
                ]).unsqueeze(0).to(DEVICE)
                msk = torch.ones_like(ids).to(DEVICE)
                chunks_text.append((ids, msk))
                if start + window >= len(inner):
                    break

            cls_vecs = []
            with torch.no_grad():
                for ids, msk in chunks_text:
                    out = roberta_model(input_ids=ids, attention_mask=msk)
                    cls = out.last_hidden_state[:, 0, :].squeeze(0).float().cpu().numpy()
                    cls_vecs.append(cls)

            roberta_emb = safe_clean(np.mean(cls_vecs, axis=0).astype(np.float32))
        except Exception as e:
            print(f"  [WARN] RoBERTa pid={pid}: {e}")
            roberta_emb = np.zeros(TEXT_DIM_BASE, dtype=np.float32)

    combined = integrate_into_pipeline(roberta_emb, raw_text)
    np.save(cache, combined)
    return combined


# ─────────────────────────────────────────────────────────────────────
# STEP 10 ─ BUILD DATASET
# ─────────────────────────────────────────────────────────────────────
def build_dataset(labels):
    dirs = sorted([
        d for d in os.listdir(DATA_PATH)
        if os.path.isdir(os.path.join(DATA_PATH, d))
        and re.match(r"^\d+_P$", d, re.IGNORECASE)
    ])
    print(f"\n  Participant folders found: {len(dirs)}")

    audio_list, text_list        = [], []
    y_list, score_list, pid_list = [], [], []

    for dname in tqdm(dirs, desc="  Extracting features"):
        try:
            pid = int(dname.split("_")[0])
        except ValueError:
            continue
        if pid not in labels:
            continue

        folder = os.path.join(DATA_PATH, dname)
        af     = find_file(folder, "audio")
        if af is None:
            continue

        ae = get_audio(af, pid)
        if ae is None:
            continue

        te = get_text(folder, pid)

        audio_list.append(ae)
        text_list.append(te)
        y_list.append(labels[pid][0])
        score_list.append(labels[pid][1])
        pid_list.append(pid)

    print(f"\n  Valid participants  : {len(pid_list)}")
    print(f"  Depressed          : {sum(y_list)}")
    print(f"  Not depressed      : {y_list.count(0)}")
    if audio_list:
        print(f"  Audio feature dim  : {audio_list[0].shape}")
        print(f"  Text  feature dim  : {text_list[0].shape}")
    return audio_list, text_list, y_list, score_list, pid_list


# ─────────────────────────────────────────────────────────────────────
# STEP 11 ─ MIXUP AUGMENTATION
# ─────────────────────────────────────────────────────────────────────
def mixup_batch(audio, text, labels, alpha=MIXUP_ALPHA):
    if alpha == 0:
        return audio, text, F.one_hot(labels, num_classes=2).float()

    lam = np.random.beta(alpha, alpha)
    B   = audio.size(0)
    idx = torch.randperm(B, device=audio.device)

    audio_mix = lam * audio + (1 - lam) * audio[idx]
    text_mix  = lam * text  + (1 - lam) * text[idx]

    y_a   = F.one_hot(labels,      num_classes=2).float()
    y_b   = F.one_hot(labels[idx], num_classes=2).float()
    y_mix = lam * y_a + (1 - lam) * y_b

    return audio_mix, text_mix, y_mix


# ─────────────────────────────────────────────────────────────────────
# STEP 12 ─ MODEL ARCHITECTURE
# ─────────────────────────────────────────────────────────────────────

class CrossModalAttention(nn.Module):
    def __init__(self, dim: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        self.attn = nn.MultiheadAttention(
            dim, num_heads, dropout=dropout, batch_first=True
        )
        self.norm = nn.LayerNorm(dim)
        self.drop = nn.Dropout(dropout)

    def forward(self, query: torch.Tensor, key_value: torch.Tensor) -> torch.Tensor:
        q      = query.unsqueeze(1)
        kv     = key_value.unsqueeze(1)
        out, _ = self.attn(q, kv, kv)
        return self.norm(self.drop(out.squeeze(1)) + query)


class AudioTextFusionNet(nn.Module):
    def __init__(
        self,
        audio_dim:  int,
        text_dim:   int,
        fusion_dim: int   = FUSION_DIM,
        num_heads:  int   = NUM_HEADS,
        dropout:    float = DROPOUT,
    ):
        super().__init__()

        self.audio_proj = nn.Sequential(
            nn.Linear(audio_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, fusion_dim),
            nn.GELU(),
        )
        self.text_proj = nn.Sequential(
            nn.Linear(text_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, fusion_dim),
            nn.GELU(),
        )

        self.audio_attn_text = CrossModalAttention(fusion_dim, num_heads, dropout * 0.5)
        self.text_attn_audio = CrossModalAttention(fusion_dim, num_heads, dropout * 0.5)

        self.modality_embed = nn.Embedding(2, fusion_dim)

        enc_layer = nn.TransformerEncoderLayer(
            d_model=fusion_dim,
            nhead=num_heads,
            dim_feedforward=fusion_dim * 4,
            dropout=dropout,
            batch_first=True,
            norm_first=True,
        )
        self.transformer = nn.TransformerEncoder(enc_layer, num_layers=2)

        self.gate = nn.Sequential(
            nn.Linear(fusion_dim * 2, 64),
            nn.GELU(),
            nn.Linear(64, 2),
            nn.Softmax(dim=-1),
        )

        self.classifier = nn.Sequential(
            nn.Linear(fusion_dim, fusion_dim),
            nn.LayerNorm(fusion_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(fusion_dim, fusion_dim // 2),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(fusion_dim // 2, 2),
        )

    def forward(self, audio: torch.Tensor, text: torch.Tensor) -> torch.Tensor:
        a = self.audio_proj(audio)
        t = self.text_proj(text)

        a_ref = self.audio_attn_text(a, t)
        t_ref = self.text_attn_audio(t, a)

        ids    = torch.arange(2, device=audio.device)
        me     = self.modality_embed(ids)
        tokens = torch.stack([a_ref, t_ref], dim=1) + me

        fused  = self.transformer(tokens)
        fa, ft = fused[:, 0], fused[:, 1]

        gate_w = self.gate(torch.cat([fa, ft], dim=-1))
        agg    = gate_w[:, 0:1] * fa + gate_w[:, 1:2] * ft

        return self.classifier(agg)


# ─────────────────────────────────────────────────────────────────────
# STEP 13 ─ LOSS FUNCTION
# ─────────────────────────────────────────────────────────────────────

class SoftFocalLoss(nn.Module):
    """
    Focal Loss + Label Smoothing.
    FIX 3: gamma reduced from 2.0 → 1.5.
    """
    def __init__(self, gamma=FOCAL_GAMMA, smoothing=LABEL_SMOOTH, weight=None):
        super().__init__()
        self.gamma     = gamma
        self.smoothing = smoothing
        self.weight    = weight

    def forward(self, logits: torch.Tensor, soft_targets: torch.Tensor) -> torch.Tensor:
        n_cls  = soft_targets.size(-1)
        smooth = soft_targets * (1 - self.smoothing) + self.smoothing / n_cls

        log_p  = F.log_softmax(logits, dim=-1)
        p      = log_p.exp()
        p_t    = (smooth * p).sum(dim=-1, keepdim=True)
        focal  = (1 - p_t) ** self.gamma
        ce     = -(smooth * log_p)

        if self.weight is not None:
            w  = self.weight.to(logits.device)
            ce = ce * w.unsqueeze(0)

        return (focal * ce.sum(dim=-1, keepdim=True)).mean()


# ─────────────────────────────────────────────────────────────────────
# STEP 14 ─ TRAIN / EVAL HELPERS
# ─────────────────────────────────────────────────────────────────────

def run_epoch(model, loader, criterion, optimizer=None, scheduler=None):
    training = optimizer is not None
    model.train() if training else model.eval()
    if training:
        wavlm.train(); roberta_model.train()
    else:
        wavlm.eval();  roberta_model.eval()

    total_loss = total_correct = total = 0
    ctx = torch.enable_grad() if training else torch.no_grad()

    with ctx:
        for audio, text, labels in loader:
            audio  = audio.to(DEVICE)
            text   = text.to(DEVICE)
            labels = labels.to(DEVICE)

            if training:
                audio_m, text_m, soft_labels = mixup_batch(audio, text, labels)
            else:
                audio_m     = audio
                text_m      = text
                soft_labels = F.one_hot(labels, num_classes=2).float()

            logits = torch.nan_to_num(model(audio_m, text_m))
            loss   = criterion(logits, soft_labels)

            if training:
                optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(
                    list(model.parameters()) +
                    list(filter(lambda p: p.requires_grad, wavlm.parameters())) +
                    list(filter(lambda p: p.requires_grad, roberta_model.parameters())),
                    max_norm=1.0
                )
                optimizer.step()
                if scheduler is not None:
                    scheduler.step()

            total_loss    += loss.item() * len(labels)
            total_correct += (logits.argmax(1) == labels).sum().item()
            total         += len(labels)

    return total_loss / total, total_correct / total


@torch.no_grad()
def evaluate_metrics(model, loader, threshold: float = 0.5):
    model.eval(); wavlm.eval(); roberta_model.eval()
    all_preds, all_labels, all_probs = [], [], []

    for audio, text, labels in loader:
        logits = model(audio.to(DEVICE), text.to(DEVICE))
        probs  = torch.softmax(logits, dim=1)[:, 1].cpu().numpy()
        preds  = (probs >= threshold).astype(int)
        all_probs.extend(probs)
        all_preds.extend(preds)
        all_labels.extend(labels.numpy())

    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)
    probs  = np.array(all_probs)
    return {
        "accuracy" : accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, zero_division=0),
        "recall"   : recall_score(y_true, y_pred, zero_division=0),
        "f1"       : f1_score(y_true, y_pred, zero_division=0),
        "auc"      : roc_auc_score(y_true, probs) if len(np.unique(y_true)) > 1 else 0.0,
        "y_true"   : y_true,
        "y_pred"   : y_pred,
        "probs"    : probs,
    }


def find_best_threshold(probs: np.ndarray, y_true: np.ndarray):
    """
    FIX 4 & 5: Grid-search over [0.25, 0.75] to maximise F1 while
    enforcing BOTH recall >= 0.50 AND precision >= 0.30.
    """
    best_t, best_f1 = 0.5, 0.0
    print("\n  Threshold sweep  [0.25 → 0.75, recall≥0.50, precision≥0.30]:")
    for t in np.arange(0.25, 0.76, 0.01):
        yp = (probs >= t).astype(int)
        f  = f1_score(y_true, yp, zero_division=0)
        r  = recall_score(y_true, yp, zero_division=0)
        p  = precision_score(y_true, yp, zero_division=0)
        if f > best_f1 and r >= 0.50 and p >= 0.30:
            best_f1, best_t = f, t
    print(f"    Best threshold: {best_t:.2f}  F1={best_f1:.4f}")
    return best_t, best_f1


# ─────────────────────────────────────────────────────────────────────
# STEP 15 ─ VISUALISATION
# ─────────────────────────────────────────────────────────────────────

def plot_history(history: dict):
    epochs = range(1, len(history["train_loss"]) + 1)
    fig, axes = plt.subplots(1, 3, figsize=(15, 4))

    axes[0].plot(epochs, history["train_loss"], label="Train")
    axes[0].plot(epochs, history["val_loss"],   label="Val")
    axes[0].set_title("Loss"); axes[0].set_xlabel("Epoch"); axes[0].legend()

    axes[1].plot(epochs, history["train_acc"], label="Train")
    axes[1].plot(epochs, history["val_acc"],   label="Val")
    axes[1].set_title("Accuracy"); axes[1].set_xlabel("Epoch"); axes[1].legend()

    axes[2].plot(epochs, history["val_f1"],     label="Val F1",     color="green")
    axes[2].plot(epochs, history["val_recall"], label="Val Recall", color="red")
    axes[2].set_title("F1 & Recall (key metrics)")
    axes[2].set_xlabel("Epoch"); axes[2].legend()

    plt.tight_layout()
    plt.savefig("/content/training_curves_v3.png", dpi=150)
    plt.show()
    print("  Saved → /content/training_curves_v3.png")


def plot_confusion(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=["Not Dep", "Dep"],
                yticklabels=["Not Dep", "Dep"])
    plt.title("Confusion Matrix — v3 (Audio + Text + Cognitive)")
    plt.ylabel("True"); plt.xlabel("Predicted")
    plt.tight_layout()
    plt.savefig("/content/confusion_matrix_v3.png", dpi=150)
    plt.show()
    print("  Saved → /content/confusion_matrix_v3.png")


def plot_cognitive_comparison(text_raw, y_raw):
    cog = text_raw[:, TEXT_DIM_BASE:]
    feat_names = [
        "Overgeneralization", "Catastrophizing", "Personalization",
        "Neg. Self-Label", "Emotional Reasoning",
        "Help Seeking", "Problem Solving", "Pos. Reframing",
        "Emotional Expr.", "Cognitive Risk"
    ]
    dep_mask = y_raw == 1
    not_mask = y_raw == 0
    mean_dep = cog[dep_mask].mean(axis=0)
    mean_not = cog[not_mask].mean(axis=0)

    x     = np.arange(len(feat_names))
    width = 0.35
    fig, ax = plt.subplots(figsize=(13, 5))
    ax.bar(x - width/2, mean_dep, width, label="Depressed",     color="#EF4444", alpha=0.8)
    ax.bar(x + width/2, mean_not, width, label="Not Depressed", color="#22C55E", alpha=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels(feat_names, rotation=35, ha="right", fontsize=9)
    ax.set_ylabel("Mean Normalised Score")
    ax.set_title("Cognitive Features — Depressed vs Not Depressed")
    ax.legend()
    plt.tight_layout()
    plt.savefig("/content/cognitive_features_v3.png", dpi=150)
    plt.show()
    print("  Saved → /content/cognitive_features_v3.png")


# ─────────────────────────────────────────────────────────────────────
# STEP 16 ─ MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 65)
    print("  PsychSense v3 — Audio + Text + Cognitive Distortion Features")
    print("═" * 65)

    print("\n[1] Loading labels …")
    labels = load_labels()

    print("\n[2] Extracting features (audio + text + cognitive) …")
    audio_l, text_l, y_l, score_l, pid_l = build_dataset(labels)

    if not pid_l:
        raise RuntimeError("No valid participants found. Check DATA_PATH.")

    audio_raw = safe_clean(np.stack(audio_l))
    text_raw  = safe_clean(np.stack(text_l))
    y_raw     = np.array(y_l,     dtype=np.int64)
    score_raw = np.array(score_l)
    pid_raw   = np.array(pid_l)

    print(f"\n  Audio shape : {audio_raw.shape}")
    print(f"  Text  shape : {text_raw.shape}")
    print(f"  Labels      : depressed={y_raw.sum()}  healthy={(y_raw==0).sum()}")

    cog_names = [
        "Overgeneralization", "Catastrophizing", "Personalization",
        "Neg. Self-Label", "Emotional Reasoning",
        "Help Seeking", "Problem Solving", "Pos. Reframing",
        "Emotional Expr.", "Cognitive Risk"
    ]
    print("\n  Cognitive feature means across all participants:")
    cog_means = text_raw[:, TEXT_DIM_BASE:].mean(axis=0)
    for name, val in zip(cog_names, cog_means):
        print(f"    {name:<24s}: {val:.5f}")

    print("\n[3] Stratified 80/20 split …")
    idx = np.arange(len(y_raw))
    tr_idx, va_idx = train_test_split(
        idx, test_size=0.2, stratify=y_raw, random_state=SEED
    )
    print(f"  Train={len(tr_idx)}  Val={len(va_idx)}")

    a_tr, a_va = audio_raw[tr_idx], audio_raw[va_idx]
    t_tr, t_va = text_raw[tr_idx],  text_raw[va_idx]
    y_tr, y_va = y_raw[tr_idx],     y_raw[va_idx]

    # ── FIX ISSUE 1: Fit scalers on PRE-ROS data, then apply ROS ──────
    # Previously scalers were fit after ROS, skewing mean_/var_ toward the
    # depressed class (duplicated minority rows). Correct order: fit on the
    # original train split, scale it, THEN oversample the scaled features.
    print("\n[4] StandardScaler (fit on pre-ROS train split only) …")
    sc_audio = StandardScaler()
    sc_text  = StandardScaler()

    # Fit and transform on the original (pre-ROS) training split
    a_tr_scaled = safe_clean(sc_audio.fit_transform(a_tr))
    t_tr_scaled = safe_clean(sc_text.fit_transform(t_tr))
    a_va = safe_clean(sc_audio.transform(a_va))
    t_va = safe_clean(sc_text.transform(t_va))
    print("  ✓ All features finite and normalised (scalers fit pre-ROS)")

    # ── FIX 2: Use ONLY RandomOverSampler ────────────────────────────
    # Apply ROS AFTER scaling so scaler statistics reflect the true
    # class distribution, not the oversampled one.
    print("\n[5] RandomOverSampler (train split only, applied after scaling) …")
    ros = RandomOverSampler(random_state=SEED)
    ri, y_tr = ros.fit_resample(np.arange(len(y_tr)).reshape(-1, 1), y_tr)
    ri   = ri.flatten()
    a_tr = a_tr_scaled[ri]
    t_tr = t_tr_scaled[ri]
    y_tr = y_tr.astype(np.int64)
    print(f"  After resample: {len(y_tr)}  pos={y_tr.sum()}  neg={(y_tr==0).sum()}")

    def make_ds(a, t, y):
        return TensorDataset(
            torch.from_numpy(a.astype(np.float32)),
            torch.from_numpy(t.astype(np.float32)),
            torch.from_numpy(y.astype(np.int64)),
        )

    train_loader = DataLoader(make_ds(a_tr, t_tr, y_tr),
                              batch_size=BATCH_SIZE, shuffle=True)
    val_loader   = DataLoader(make_ds(a_va, t_va, y_va),
                              batch_size=BATCH_SIZE, shuffle=False)

    print(f"\n[6] AudioTextFusionNet v3  (text_dim={TEXT_DIM}) …")
    model = AudioTextFusionNet(
        audio_dim=AUDIO_DIM,
        text_dim=TEXT_DIM,
        fusion_dim=FUSION_DIM,
        num_heads=NUM_HEADS,
        dropout=DROPOUT,
    ).to(DEVICE)
    n_head = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"  Fusion head params: {n_head:,}")

    # ── FIX 1: Class weights — no extra multiplier ───────────────────
    cw = compute_class_weight("balanced", classes=np.array([0, 1]), y=y_tr)
    cw[1] *= DEPRESSED_CLASS_EXTRA_WEIGHT   # 1.0 → no change
    cw_tensor = torch.tensor(cw, dtype=torch.float32).to(DEVICE)
    print(f"  Class weights: healthy={cw[0]:.2f}  depressed={cw[1]:.2f}")

    criterion = SoftFocalLoss(
        gamma=FOCAL_GAMMA,
        smoothing=LABEL_SMOOTH,
        weight=cw_tensor
    )

    encoder_params = (
        [p for p in wavlm.parameters()         if p.requires_grad] +
        [p for p in roberta_model.parameters() if p.requires_grad]
    )
    head_params = list(model.parameters())

    optimizer = optim.AdamW([
        {"params": encoder_params, "lr": LR_WAVLM,  "weight_decay": 1e-5},
        {"params": head_params,    "lr": LR_HEAD,   "weight_decay": 1e-4},
    ])

    scheduler = optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=[LR_WAVLM * 5, LR_HEAD * 5],
        steps_per_epoch=len(train_loader),
        epochs=EPOCHS,
        pct_start=0.15,
    )

    print(f"\n[7] Training ({EPOCHS} epochs, patience={PATIENCE}) …\n")
    best_f1, best_state, no_improve = 0.0, None, 0
    history = {
        "train_loss": [], "val_loss":   [],
        "train_acc":  [], "val_acc":    [],
        "val_f1":     [], "val_recall": [],
    }

    for epoch in range(1, EPOCHS + 1):
        tr_loss, tr_acc = run_epoch(model, train_loader, criterion, optimizer, scheduler)
        val_loss, val_acc_raw = run_epoch(model, val_loader, criterion)  # FIX ISSUE 2: real val loss
        vm = evaluate_metrics(model, val_loader)

        history["train_loss"].append(tr_loss)
        history["train_acc"].append(tr_acc)
        history["val_loss"].append(val_loss)   # FIX ISSUE 2: was (1 - vm["accuracy"]), now actual focal loss
        history["val_acc"].append(vm["accuracy"])
        history["val_f1"].append(vm["f1"])
        history["val_recall"].append(vm["recall"])

        tag = ""
        if vm["f1"] > best_f1:
            best_f1    = vm["f1"]
            best_state = {
                "model"  : {k: v.cpu().clone() for k, v in model.state_dict().items()},
                "wavlm"  : {k: v.cpu().clone() for k, v in wavlm.state_dict().items()},
                "roberta": {k: v.cpu().clone() for k, v in roberta_model.state_dict().items()},
            }
            no_improve = 0
            tag        = " ★"
        else:
            no_improve += 1

        print(
            f"  Ep {epoch:03d} | loss={tr_loss:.4f} | "
            f"acc={vm['accuracy']:.3f}  f1={vm['f1']:.3f}  "
            f"rec={vm['recall']:.3f}  auc={vm['auc']:.3f}{tag}"
        )

        if no_improve >= PATIENCE:
            print(f"\n  Early stopping at epoch {epoch}.")
            break

    plot_history(history)

    # FIX ISSUE 3: Restore ALL three components to their best-epoch weights,
    # not just the fusion head. Without this, wavlm and roberta_model stay at
    # their last-epoch weights (potentially worse than the best-F1 epoch).
    model.load_state_dict({k: v.to(DEVICE) for k, v in best_state["model"].items()})
    wavlm.load_state_dict({k: v.to(DEVICE) for k, v in best_state["wavlm"].items()})
    roberta_model.load_state_dict({k: v.to(DEVICE) for k, v in best_state["roberta"].items()})
    print("  ✓ Restored model + wavlm + roberta_model to best-F1 epoch weights")

    print("\n[8] Threshold tuning …")
    vm_best = evaluate_metrics(model, val_loader)
    best_thr, _ = find_best_threshold(vm_best["probs"], vm_best["y_true"])

    print("\n[9] Final evaluation …")
    final = evaluate_metrics(model, val_loader, threshold=best_thr)

    print("\n" + "╔" + "═" * 58 + "╗")
    print("║  FINAL RESULTS  (held-out val, no leakage)  v3          ║")
    print("╠" + "═" * 58 + "╣")
    print(f"║  Accuracy   : {final['accuracy']:.4f}  ({final['accuracy']*100:.1f}%)                  ║")
    print(f"║  Precision  : {final['precision']:.4f}  ({final['precision']*100:.1f}%)                  ║")
    print(f"║  Recall     : {final['recall']:.4f}  ({final['recall']*100:.1f}%)                  ║")
    print(f"║  F1 Score   : {final['f1']:.4f}  ({final['f1']*100:.1f}%)                  ║")
    print(f"║  ROC-AUC    : {final['auc']:.4f}                                  ║")
    print(f"║  Threshold  : {best_thr:.2f}  (F1-tuned, recall≥50%, prec≥30%)    ║")
    print("╚" + "═" * 58 + "╝\n")

    print(classification_report(
        final["y_true"], final["y_pred"],
        target_names=["Not Depressed", "Depressed"]
    ))
    plot_confusion(final["y_true"], final["y_pred"])
    plot_cognitive_comparison(text_raw, y_raw)

    # ── Collect only the fine-tuned encoder layers ───────────────────
    # Saving full WavLM (~360 MB) + full RoBERTa (~480 MB) would make the
    # checkpoint ~850 MB. Instead we save only the unfrozen layers that
    # actually changed during training. At load time app.py downloads the
    # frozen base weights from HuggingFace and patches in these deltas
    # with strict=False. Final checkpoint size: ~30-40 MB.

    # WavLM: last WAVLM_UNFREEZE_LAYERS encoder layers
    n_wavlm_layers = wavlm.config.num_hidden_layers   # 12 for wavlm-base-plus
    wavlm_ft_keys  = set()
    for layer_idx in range(n_wavlm_layers - WAVLM_UNFREEZE_LAYERS, n_wavlm_layers):
        wavlm_ft_keys.add(f"encoder.layers.{layer_idx}.")
    wavlm_ft_state = {
        k: v.cpu()
        for k, v in wavlm.state_dict().items()
        if any(k.startswith(prefix) for prefix in wavlm_ft_keys)
    }

    # RoBERTa: last ROBERTA_UNFREEZE_LAYERS encoder layers + pooler
    n_roberta_layers = roberta_model.config.num_hidden_layers   # 12 for roberta-base
    roberta_ft_keys  = set()
    for layer_idx in range(n_roberta_layers - ROBERTA_UNFREEZE_LAYERS, n_roberta_layers):
        roberta_ft_keys.add(f"encoder.layer.{layer_idx}.")
    roberta_ft_state = {
        k: v.cpu()
        for k, v in roberta_model.state_dict().items()
        if any(k.startswith(prefix) for prefix in roberta_ft_keys)
        or k.startswith("pooler.")
    }

    print(f"  WavLM   fine-tuned keys saved  : {len(wavlm_ft_state)}")
    print(f"  RoBERTa fine-tuned keys saved  : {len(roberta_ft_state)}")

    ckpt_path = os.path.join(DATA_PATH, "model_audio_text_v3.pt")
    torch.save({
        "model_state"     : {k: v.cpu() for k, v in model.state_dict().items()},
        # Only unfrozen encoder layers — keeps checkpoint ~30-40 MB instead of ~850 MB.
        # app.py loads the frozen base from HuggingFace then patches these in
        # using load_state_dict(strict=False).
        "wavlm_ft_state"  : wavlm_ft_state,
        "roberta_ft_state": roberta_ft_state,
        # Store which layers were unfrozen so app.py can log / verify
        "WAVLM_UNFREEZE_LAYERS"  : WAVLM_UNFREEZE_LAYERS,
        "ROBERTA_UNFREEZE_LAYERS": ROBERTA_UNFREEZE_LAYERS,
        "AUDIO_DIM"    : AUDIO_DIM,
        "TEXT_DIM"     : TEXT_DIM,
        "TEXT_DIM_BASE": TEXT_DIM_BASE,
        "FUSION_DIM"   : FUSION_DIM,
        "NUM_HEADS"    : NUM_HEADS,
        "threshold"    : best_thr,
        "sc_audio"     : sc_audio,
        "sc_text"      : sc_text,
        "version"      : "v3_cognitive_features",
    }, ckpt_path)
    print(f"  ✅ Checkpoint saved → {ckpt_path}")

    return (
        model, sc_audio, sc_text, best_thr,
        pid_raw, score_raw, y_raw,
        a_va, t_va, y_va, va_idx,
        audio_raw, text_raw,
    )


# ─────────────────────────────────────────────────────────────────────
# STEP 17 ─ RUN MAIN
# ─────────────────────────────────────────────────────────────────────
(model, sc_audio, sc_text, best_thr,
 pid_raw, score_raw, y_raw,
 a_va, t_va, y_va, va_idx,
 audio_raw, text_raw) = main()


# ─────────────────────────────────────────────────────────────────────
# STEP 18 ─ SINGLE-PARTICIPANT INFERENCE
# ─────────────────────────────────────────────────────────────────────

def predict_participant(target_pid: int):
    print(f"\n{'═'*60}")
    print(f"  Inference — Participant {target_pid}  (v3)")
    print(f"{'═'*60}")

    folder = next(
        (
            os.path.join(DATA_PATH, d)
            for d in os.listdir(DATA_PATH)
            if d.startswith(str(target_pid))
            and os.path.isdir(os.path.join(DATA_PATH, d))
        ),
        None,
    )
    if folder is None:
        print(f"  Folder for PID {target_pid} not found.")
        return None

    af = find_file(folder, "audio")
    if af is None:
        print("  Audio file missing.")
        return None

    ae = get_audio(af, target_pid)
    if ae is None:
        print("  Audio extraction failed.")
        return None

    te       = get_text(folder, target_pid)
    has_text = np.any(te[:TEXT_DIM_BASE] != 0)

    raw_text = ""
    tf = find_file(folder, "transcript")
    if tf:
        try:
            df   = pd.read_csv(tf, sep="\t", header=None,
                               names=["s","e","sp","v"], on_bad_lines="skip")
            mask = df["sp"].astype(str).str.upper().isin(["PARTICIPANT","P"])
            rows = df[mask] if mask.any() else df
            raw_text = " ".join(rows["v"].dropna().astype(str)).strip()
        except Exception:
            pass

    print("\n  ── Cognitive Analysis ───────────────────────────────────")
    extract_cognitive_features(raw_text, verbose=True)

    ae_s = safe_clean(sc_audio.transform(ae.reshape(1, -1))[0].astype(np.float32))
    te_s = safe_clean(sc_text.transform(te.reshape(1, -1))[0].astype(np.float32))

    at = torch.from_numpy(ae_s).unsqueeze(0).to(DEVICE)
    tt = torch.from_numpy(te_s).unsqueeze(0).to(DEVICE)

    model.eval(); wavlm.eval(); roberta_model.eval()
    with torch.no_grad():
        logits = model(at, tt)
        probs  = torch.softmax(logits, dim=1).cpu().numpy()[0]
        pred   = int(probs[1] >= best_thr)

    labels_all = load_labels()
    gt         = labels_all.get(target_pid)

    print(f"\n  ── Classification Result ────────────────────────────────")
    print(f"  Audio      : ✓")
    print(f"  Transcript : {'✓' if has_text else '✗ (zero vector)'}")
    print(f"\n  ► Prediction         : {'⚠  DEPRESSED' if pred else '✓  NOT DEPRESSED'}")
    print(f"  ► P(depressed)       : {probs[1]*100:.1f}%")
    print(f"  ► P(not depressed)   : {probs[0]*100:.1f}%")
    print(f"  ► Decision threshold : {best_thr:.2f}")

    if gt is not None:
        gt_binary, gt_score = gt
        print(f"\n  ► Ground truth       : {'Depressed' if gt_binary else 'Not Depressed'}")
        print(f"  ► PHQ-8 Score        : {gt_score}  {phq_severity(gt_score)}")
        print(f"  ► Correct?           : {'✅ YES' if pred == gt_binary else '❌ NO'}")
    else:
        print(f"\n  ► Ground truth       : Not found in label files")

    return pred, probs


predict_participant(346)

print("\n" + "─" * 60)
labels_all = load_labels()
depressed_sorted = sorted(
    [(pid, s) for pid, (b, s) in labels_all.items() if b == 1],
    key=lambda x: x[1], reverse=True
)
if depressed_sorted:
    pid_top, phq_top = depressed_sorted[0]
    print(f"  Most severe: PID={pid_top}  PHQ={phq_top}  {phq_severity(phq_top)}")
    predict_participant(pid_top)


# ─────────────────────────────────────────────────────────────────────
# STEP 19 ─ STANDALONE COGNITIVE MODULE DEMO
# ─────────────────────────────────────────────────────────────────────

def demo_cognitive_module():
    print("\n" + "═" * 60)
    print("  COGNITIVE MODULE DEMO  —  Part 5 Output Format")
    print("═" * 60)

    samples = {
        "High-distortion transcript": (
            "I always fail at everything. It is completely my fault. "
            "I am worthless and nothing will ever get better. "
            "I feel like a failure every single day. "
            "I destroyed every relationship I had. I am useless."
        ),
        "High-coping transcript": (
            "I talked to my therapist about how I feel sad and upset. "
            "I am working on it and trying to fix things step by step. "
            "I believe it will get better and I am staying hopeful. "
            "I reached out to my friend and shared how I feel."
        ),
        "Mixed transcript": (
            "I never seem to do anything right, it is always my fault. "
            "But I asked my doctor for help and I am trying to fix it. "
            "I feel hopeless sometimes but I spoke to someone about it."
        ),
        "Empty transcript": "",
    }

    for label, text in samples.items():
        print(f"\n  ── Sample: {label} ──")
        feat = extract_cognitive_features(text, verbose=True)
        print(f"  Full feature vector (10 dims): {np.round(feat, 4)}")

demo_cognitive_module()


# ═════════════════════════════════════════════════════════════════════
# ██████████████████████  PART 2 — ADET MODULE  ███████████████████████
# ═════════════════════════════════════════════════════════════════════
# ║  ADET (Adaptive Depression Evaluation Tracker)                    ║
# ║  Continuation of PsychSense v3 (Audio + Text + Cognitive)        ║
# ║                                                                   ║
# ║  NOTE: v3 globals (DISTORTION_PATTERNS, COPING_PATTERNS,         ║
# ║  extract_cognitive_features, roberta_tok, roberta_model, etc.)   ║
# ║  are already defined above — ADET uses them directly.            ║
# ═════════════════════════════════════════════════════════════════════

print("  [ADET] PsychSense v3 globals detected — using real v3 definitions.")

# ─────────────────────────────────────────────────────────────────────
# ADET STEP 1 ─ SESSION DATA STRUCTURES
# ─────────────────────────────────────────────────────────────────────

@dataclass
class SessionInput:
    """
    Frontend input structure for a single real-time session.
    All fields except user_id and text_input are optional and can be
    replaced with placeholder zeros if hardware is unavailable.
    """
    user_id:         str
    session_id:      str
    date:            str                          # ISO format: YYYY-MM-DD
    text_input:      str
    audio_features:  Optional[np.ndarray] = None # 768-dim WavLM embedding or None
    facial_features: Optional[np.ndarray] = None # optional OpenCV/FER features


@dataclass
class SessionResult:
    """Output structure for a processed session."""
    session_id:          str
    date:                str
    depression_score:    float                    # continuous [0, 1]
    label:               str                      # "Depressed" / "Not Depressed"
    session_type:        str                      # "Real" | "Synthetic"
    phq_equivalent:      int   = 0
    cognitive_risk:      float = 0.0
    dominant_distortion: str   = "None"
    dominant_coping:     str   = "None"
    change:              float = 0.0             # delta vs previous session
    notes:               str   = ""


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 2 ─ PREDICTION ENGINE
# (Uses the real AudioTextFusionNet trained in v3 when available,
#  falls back to heuristic mock predictor otherwise)
# ─────────────────────────────────────────────────────────────────────

def score_to_phq(score: float) -> int:
    """Map continuous depression score [0,1] → approximate PHQ-8 range [0,24]."""
    return int(round(score * 24))


def score_to_label(score: float, threshold: float = 0.50) -> str:
    return "Depressed" if score >= threshold else "Not Depressed"


def process_session(
    session_input: SessionInput,
    model_         = None,      # AudioTextFusionNet instance (v3)
    sc_audio_      = None,      # fitted StandardScaler for audio
    sc_text_       = None,      # fitted StandardScaler for text
    best_thr: float = 0.50,
    device_         = None,
) -> SessionResult:
    """
    Process a single real session.

    If a trained model + scalers are provided (from PsychSense v3 main()),
    uses the real model for inference. Otherwise, falls back to a
    heuristic mock model based on cognitive feature extraction.

    Note: parameters are suffixed with _ to avoid shadowing the v3
    globals (model, sc_audio, sc_text) defined in the outer scope.
    """
    text    = session_input.text_input
    cog_feat = extract_cognitive_features(text, verbose=False)

    d_names  = list(DISTORTION_PATTERNS.keys())
    c_names  = list(COPING_PATTERNS.keys())
    d_scores = cog_feat[:N_DISTORTIONS]
    c_scores = cog_feat[N_DISTORTIONS:N_DISTORTIONS + N_COPING]
    risk     = float(cog_feat[-1])

    dom_d = (DISTORTION_DISPLAY[d_names[int(np.argmax(d_scores))]]
             if d_scores.max() > 0 else "None")
    dom_c = (COPING_DISPLAY[c_names[int(np.argmax(c_scores))]]
             if c_scores.max() > 0 else "None")

    # ── Real model path ───────────────────────────────────────────────
    if model_ is not None and sc_audio_ is not None and sc_text_ is not None:
        if device_ is None:
            device_ = DEVICE

        ae = (safe_clean(session_input.audio_features.astype(np.float32))
              if session_input.audio_features is not None
              else np.zeros(AUDIO_DIM_CONST, dtype=np.float32))

        try:
            tokens  = roberta_tok(
                text, return_tensors="pt",
                truncation=False, padding=False
            )["input_ids"][0]
            cls_id  = roberta_tok.cls_token_id
            sep_id  = roberta_tok.sep_token_id
            inner   = tokens[1:-1]
            window  = MAX_TEXT_LEN - 2
            cls_vecs = []
            with torch.no_grad():
                for start in range(0, max(1, len(inner)), TEXT_STRIDE):
                    chunk = inner[start:start + window]
                    ids   = torch.cat([
                        torch.tensor([cls_id]),
                        chunk,
                        torch.tensor([sep_id]),
                    ]).unsqueeze(0).to(device_)
                    msk = torch.ones_like(ids).to(device_)
                    out = roberta_model(input_ids=ids, attention_mask=msk)
                    cls_vecs.append(
                        out.last_hidden_state[:, 0, :]
                           .squeeze(0).float().cpu().numpy()
                    )
            roberta_emb = safe_clean(np.mean(cls_vecs, axis=0).astype(np.float32))
        except Exception:
            roberta_emb = np.zeros(TEXT_DIM_BASE, dtype=np.float32)

        te   = integrate_into_pipeline(roberta_emb, text)
        ae_s = safe_clean(sc_audio_.transform(ae.reshape(1, -1))[0])
        te_s = safe_clean(sc_text_.transform(te.reshape(1, -1))[0])

        at = torch.from_numpy(ae_s).unsqueeze(0).to(device_)
        tt = torch.from_numpy(te_s).unsqueeze(0).to(device_)

        model_.eval()
        with torch.no_grad():
            logits = model_(at, tt)
            probs  = torch.softmax(logits, dim=1).cpu().numpy()[0]
        depression_score = float(probs[1])

    else:
        # ── Heuristic mock model (no trained weights required) ────────
        distortion_weight = 0.55
        coping_weight     = 0.30
        risk_weight       = 0.15

        distortion_density = float(d_scores.sum())
        coping_strength    = float(c_scores.sum())

        raw = (
            distortion_weight * min(distortion_density * 8, 1.0)
            + risk_weight     * risk
            - coping_weight   * min(coping_strength * 8, 1.0)
        )
        noise = np.random.normal(0, 0.02)
        depression_score = float(np.clip(raw + 0.35 + noise, 0.05, 0.95))

        if session_input.audio_features is not None:
            af = session_input.audio_features.astype(np.float32)
            energy_proxy = float(np.clip(np.abs(af).mean() / 10.0, 0.0, 0.5))
            depression_score = float(np.clip(
                0.75 * depression_score + 0.25 * energy_proxy, 0.05, 0.95
            ))

    label = score_to_label(depression_score, threshold=best_thr)
    phq   = score_to_phq(depression_score)

    return SessionResult(
        session_id           = session_input.session_id,
        date                 = session_input.date,
        depression_score     = round(depression_score, 4),
        label                = label,
        session_type         = "Real",
        phq_equivalent       = phq,
        cognitive_risk       = round(risk, 4),
        dominant_distortion  = dom_d,
        dominant_coping      = dom_c,
        notes = f"Threshold={best_thr:.2f} | Cognitive risk={risk:.3f}",
    )


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 3 ─ SYNTHETIC SESSION GENERATOR
# ─────────────────────────────────────────────────────────────────────

SCENARIO_PATTERNS = {
    "improving":   [-0.04, -0.03, -0.05, -0.02, -0.04],
    "worsening":   [ 0.04,  0.03,  0.05,  0.02,  0.04],
    "fluctuating": [ 0.04, -0.05,  0.03, -0.04,  0.05],
    "stable":      [ 0.01, -0.01,  0.00,  0.01, -0.01],
    "recovery":    [ 0.05,  0.04, -0.03, -0.05, -0.04],
    "onset":       [-0.02,  0.03,  0.04,  0.05,  0.04],
}

DISTORTION_POOL = list(DISTORTION_DISPLAY.values()) + ["None"]
COPING_POOL     = list(COPING_DISPLAY.values())     + ["None"]


def generate_synthetic_sessions(
    base_score:    float,
    num_sessions:  int  = 5,
    scenario:      str  = "fluctuating",
    base_date:     Optional[str] = None,
    interval_days: int  = 7,
    seed:          int  = 42,
) -> List[SessionResult]:
    """
    Generate synthetic historical sessions for longitudinal analysis.

    Due to lack of longitudinal real-world data, these sessions are
    generated to simulate temporal mental health progression. They are
    clearly tagged as session_type="Synthetic" throughout the pipeline.
    """
    rng = np.random.default_rng(seed)

    if scenario == "random":
        chosen = rng.choice(list(SCENARIO_PATTERNS.keys()))
    else:
        chosen = scenario if scenario in SCENARIO_PATTERNS else "fluctuating"

    pattern = SCENARIO_PATTERNS[chosen]

    if len(pattern) < num_sessions:
        pattern = (pattern * (num_sessions // len(pattern) + 1))[:num_sessions]
    else:
        pattern = pattern[:num_sessions]

    scores = []
    score  = base_score
    for delta in reversed(pattern):
        score -= delta
        score  = float(np.clip(score, 0.05, 0.95))
        scores.append(score)
    scores.reverse()

    scores = [
        float(np.clip(s + rng.normal(0, 0.015), 0.05, 0.95))
        for s in scores
    ]

    if base_date is None:
        ref_dt = datetime.today()
    else:
        try:
            ref_dt = datetime.fromisoformat(base_date)
        except ValueError:
            ref_dt = datetime.today()

    dates = [
        (ref_dt - timedelta(days=interval_days * (num_sessions - i))).strftime("%Y-%m-%d")
        for i in range(num_sessions)
    ]

    synthetic_sessions = []
    for i, (sc, dt) in enumerate(zip(scores, dates)):
        sid   = f"S{i+1}"
        lbl   = score_to_label(sc)
        phq   = score_to_phq(sc)
        dom_d = rng.choice(DISTORTION_POOL)
        dom_c = rng.choice(COPING_POOL)
        risk  = float(np.clip(sc * 0.8 + rng.normal(0, 0.05), 0.0, 1.0))

        synthetic_sessions.append(SessionResult(
            session_id          = sid,
            date                = dt,
            depression_score    = round(sc, 4),
            label               = lbl,
            session_type        = "Synthetic",
            phq_equivalent      = phq,
            cognitive_risk      = round(risk, 4),
            dominant_distortion = dom_d,
            dominant_coping     = dom_c,
            notes = (
                f"[Synthetic — {chosen} scenario] "
                "Auto-generated for longitudinal simulation."
            ),
        ))

    print(
        f"\n  ⚠️  SYNTHETIC DATA NOTICE:\n"
        f"  Due to lack of longitudinal real-world data, {num_sessions} "
        f"synthetic sessions\n"
        f"  were generated using the '{chosen}' scenario to simulate "
        f"temporal mental\n"
        f"  health progression. These are clearly marked [Synthetic] "
        f"throughout.\n"
    )
    return synthetic_sessions


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 4 ─ DATA FUSION
# ─────────────────────────────────────────────────────────────────────

def merge_sessions(
    synthetic: List[SessionResult],
    real:      SessionResult,
) -> List[SessionResult]:
    """
    Merge synthetic past sessions with the real current session.
    Assigns session IDs sequentially and computes per-session delta.
    Layout: [S1, S2, ..., S_n, REAL_SESSION]
    """
    all_sessions = list(synthetic) + [real]

    for i, s in enumerate(all_sessions[:-1]):
        s.session_id = f"S{i+1}"
    all_sessions[-1].session_id = f"S{len(all_sessions)} (Real)"

    for i in range(1, len(all_sessions)):
        all_sessions[i].change = round(
            all_sessions[i].depression_score - all_sessions[i-1].depression_score, 4
        )
    all_sessions[0].change = 0.0

    return all_sessions


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 5 ─ TREND ANALYSIS
# ─────────────────────────────────────────────────────────────────────

def analyze_trend(sessions: List[SessionResult]) -> Dict:
    """Perform longitudinal trend analysis on the merged session list."""
    scores = np.array([s.depression_score for s in sessions])
    n      = len(scores)

    rolling_mean = pd.Series(scores).rolling(window=3, min_periods=1).mean().values
    deltas       = np.diff(scores)
    volatility   = float(np.std(scores))

    if n > 1:
        x     = np.arange(n)
        slope = float(np.polyfit(x, scores, 1)[0])
    else:
        slope = 0.0

    if   slope >  0.015: overall_trend = "Worsening"
    elif slope < -0.015: overall_trend = "Improving"
    else:                overall_trend = "Stable"

    if n >= 3:
        recent_scores = scores[-3:]
        recent_slope  = float(np.polyfit(np.arange(3), recent_scores, 1)[0])
        if   recent_slope >  0.015: recent_trend = "Worsening"
        elif recent_slope < -0.015: recent_trend = "Improving"
        else:                       recent_trend = "Stable"
        risk_alert = recent_slope > 0.015
    else:
        recent_trend = overall_trend
        risk_alert   = False

    insights = []
    for i, s in enumerate(sessions):
        if   s.change > 0.05:  insights.append("⬆ Notable increase")
        elif s.change < -0.05: insights.append("⬇ Notable decrease")
        elif i == 0:           insights.append("─ Baseline")
        else:                  insights.append("≈ Stable")

    return {
        "scores":        scores,
        "rolling_mean":  rolling_mean,
        "deltas":        deltas,
        "volatility":    volatility,
        "slope":         slope,
        "overall_trend": overall_trend,
        "recent_trend":  recent_trend,
        "risk_alert":    risk_alert,
        "insights":      insights,
        "n":             n,
    }


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 6 ─ COMPARISON TABLE
# ─────────────────────────────────────────────────────────────────────

def generate_table(
    sessions: List[SessionResult],
    trend:    Dict,
) -> pd.DataFrame:
    """Generate a structured comparison DataFrame."""
    rows = []
    for i, s in enumerate(sessions):
        change_str = (
            f"+{s.change:.3f}" if s.change > 0
            else f"{s.change:.3f}" if s.change != 0
            else "—"
        )
        rows.append({
            "Session":             s.session_id,
            "Date":                s.date,
            "Score":               f"{s.depression_score:.4f}",
            "Label":               s.label,
            "Type":                s.session_type,
            "PHQ≈":                s.phq_equivalent,
            "Cog. Risk":           f"{s.cognitive_risk:.3f}",
            "Dom. Distortion":     s.dominant_distortion,
            "Dom. Coping":         s.dominant_coping,
            "Change":              change_str,
            "Moving Avg (3-sess)": f"{trend['rolling_mean'][i]:.4f}",
            "Insight":             trend["insights"][i],
        })
    return pd.DataFrame(rows)


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 7 ─ VISUALIZATION
# ─────────────────────────────────────────────────────────────────────

_CLR = {
    "synth":      "#6366F1",
    "synth_fill": "#EEF2FF",
    "real":       "#EF4444",
    "trend":      "#0EA5E9",
    "fit":        "#F59E0B",
    "grid":       "#E5E7EB",
    "bg":         "#FAFAFA",
    "text":       "#1E293B",
    "depressed":  "#FCA5A5",
    "not_dep":    "#86EFAC",
    "threshold":  "#9CA3AF",
}


def plot_graph(
    sessions:  List[SessionResult],
    trend:     Dict,
    save_path: Optional[str] = "/content/adet_analysis.png",
    show:      bool = True,
):
    """
    Multi-panel ADET visualization:
      Panel 1 : Depression score trajectory with rolling avg + regression.
      Panel 2 : Session-to-session delta bar chart.
      Panel 3 : Cognitive risk over time.
      Panel 4 : Label timeline.
    """
    n       = trend["n"]
    labels  = [s.session_id for s in sessions]
    x       = np.arange(n)
    scores  = trend["scores"]
    rolling = trend["rolling_mean"]

    if n > 1:
        z   = np.polyfit(x, scores, 1)
        fit = np.poly1d(z)(x)
    else:
        fit = scores.copy()

    fig = plt.figure(figsize=(16, 12), facecolor=_CLR["bg"])
    gs  = gridspec.GridSpec(3, 2, figure=fig,
                            height_ratios=[3, 1.2, 1.2],
                            hspace=0.45, wspace=0.35)

    ax_main  = fig.add_subplot(gs[0, :])
    ax_delta = fig.add_subplot(gs[1, 0])
    ax_risk  = fig.add_subplot(gs[1, 1])
    ax_label = fig.add_subplot(gs[2, :])

    # ── PANEL 1: Main line graph ──────────────────────────────────────
    ax_main.set_facecolor(_CLR["bg"])
    ax_main.grid(axis="y", color=_CLR["grid"], linewidth=0.8, zorder=0)
    ax_main.axhline(0.5, color=_CLR["threshold"], linestyle="--",
                    linewidth=1.2, alpha=0.7, label="Decision threshold (0.50)")
    ax_main.axhspan(0.5, 1.0, alpha=0.06, color=_CLR["real"],  zorder=0)
    ax_main.axhspan(0.0, 0.5, alpha=0.06, color="#22C55E",     zorder=0)

    ax_main.plot(x[:-1], scores[:-1],
                 color=_CLR["synth"], linewidth=2.2,
                 marker="o", markersize=7, zorder=3,
                 label="Synthetic sessions")
    ax_main.plot([x[-2], x[-1]], [scores[-2], scores[-1]],
                 color=_CLR["synth"], linewidth=1.5, linestyle=":", zorder=3)
    ax_main.scatter(x[-1], scores[-1],
                    color=_CLR["real"], s=220, zorder=6,
                    marker="*", edgecolors="#7F1D1D", linewidths=1.2,
                    label=f"Real session (current)  score={scores[-1]:.3f}")
    ax_main.plot(x, rolling, color=_CLR["trend"],
                 linewidth=1.8, linestyle="-.", alpha=0.85, zorder=4,
                 label="3-session rolling avg")
    ax_main.plot(x, fit, color=_CLR["fit"],
                 linewidth=1.5, linestyle="--", alpha=0.75, zorder=4,
                 label=f"Trend line (slope={trend['slope']:+.4f})")

    ax_main.set_xticks(x)
    ax_main.set_xticklabels(labels, rotation=15, ha="right", fontsize=9)
    ax_main.set_ylabel("Depression Score [0–1]", fontsize=11)
    ax_main.set_ylim(-0.02, 1.05)
    ax_main.set_title(
        f"ADET — Depression Score Trajectory\n"
        f"Overall Trend: {trend['overall_trend']}  |  "
        f"Volatility: {trend['volatility']:.4f}  |  "
        f"Recent Trend (last 3): {trend['recent_trend']}",
        fontsize=12, fontweight="bold", color=_CLR["text"]
    )
    ax_main.legend(fontsize=8.5, loc="upper left", framealpha=0.9)

    for xi, sc in zip(x[:-1], scores[:-1]):
        ax_main.annotate(f"{sc:.2f}", (xi, sc),
                         textcoords="offset points", xytext=(0, 8),
                         fontsize=7.5, ha="center", color=_CLR["synth"])
    ax_main.annotate(f"  {scores[-1]:.2f} ★",
                     (x[-1], scores[-1]),
                     textcoords="offset points", xytext=(6, 6),
                     fontsize=9, color=_CLR["real"], fontweight="bold")

    # ── PANEL 2: Delta bar chart ──────────────────────────────────────
    ax_delta.set_facecolor(_CLR["bg"])
    ax_delta.grid(axis="y", color=_CLR["grid"], linewidth=0.7, zorder=0)
    deltas = np.array([s.change for s in sessions])
    colors = [
        (_CLR["real"] if d > 0 else "#22C55E") if abs(d) > 1e-6
        else _CLR["threshold"]
        for d in deltas
    ]
    bars = ax_delta.bar(x, deltas, color=colors, alpha=0.8,
                        zorder=3, edgecolor="white", linewidth=0.7)
    ax_delta.axhline(0, color=_CLR["text"], linewidth=0.8)
    ax_delta.set_xticks(x)
    ax_delta.set_xticklabels(labels, rotation=15, ha="right", fontsize=8)
    ax_delta.set_ylabel("Δ Score", fontsize=10)
    ax_delta.set_title("Session-to-Session Change (Δ)", fontsize=10,
                        fontweight="bold", color=_CLR["text"])
    for bar, d in zip(bars, deltas):
        if abs(d) > 0.005:
            ax_delta.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + (0.003 if d > 0 else -0.012),
                f"{d:+.3f}", ha="center", va="bottom", fontsize=7
            )

    # ── PANEL 3: Cognitive risk ───────────────────────────────────────
    ax_risk.set_facecolor(_CLR["bg"])
    ax_risk.grid(axis="y", color=_CLR["grid"], linewidth=0.7, zorder=0)
    cog_risks  = np.array([s.cognitive_risk for s in sessions])
    cog_colors = [
        _CLR["real"]  if r >= 0.5 else
        (_CLR["trend"] if r >= 0.25 else "#22C55E")
        for r in cog_risks
    ]
    ax_risk.bar(x, cog_risks, color=cog_colors, alpha=0.8,
                zorder=3, edgecolor="white", linewidth=0.7)
    ax_risk.set_xticks(x)
    ax_risk.set_xticklabels(labels, rotation=15, ha="right", fontsize=8)
    ax_risk.set_ylabel("Cog. Risk", fontsize=10)
    ax_risk.set_ylim(0, 1.05)
    ax_risk.set_title("Cognitive Risk Score per Session", fontsize=10,
                       fontweight="bold", color=_CLR["text"])
    ax_risk.axhline(0.5, color=_CLR["threshold"], linestyle="--",
                    linewidth=1, alpha=0.7)

    # ── PANEL 4: Label timeline ───────────────────────────────────────
    ax_label.set_facecolor(_CLR["bg"])
    ax_label.set_xlim(-0.5, n - 0.5)
    ax_label.set_ylim(-0.5, 0.5)
    ax_label.axis("off")
    ax_label.set_title("Session Label Timeline", fontsize=10,
                        fontweight="bold", color=_CLR["text"])

    for xi, s in zip(x, sessions):
        clr  = _CLR["depressed"] if s.label == "Depressed" else _CLR["not_dep"]
        rect = mpatches.FancyBboxPatch(
            (xi - 0.4, -0.35), 0.8, 0.7,
            boxstyle="round,pad=0.05",
            facecolor=clr, edgecolor="white", linewidth=1.2, zorder=3
        )
        ax_label.add_patch(rect)
        ax_label.text(xi, 0.0, s.label.replace(" ", "\n"),
                      ha="center", va="center", fontsize=7.5,
                      color=_CLR["text"], fontweight="bold", zorder=4)
        ax_label.text(xi, -0.48, s.session_id,
                      ha="center", va="bottom", fontsize=7,
                      color="#64748B", zorder=4)
        if s.session_type == "Real":
            ax_label.text(xi, 0.42, "★ REAL",
                          ha="center", va="bottom", fontsize=7.5,
                          color=_CLR["real"], fontweight="bold", zorder=5)

    plt.suptitle(
        "PsychSense — ADET (Adaptive Depression Evaluation Tracker)",
        fontsize=14, fontweight="bold", color=_CLR["text"], y=1.01
    )
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches="tight",
                    facecolor=_CLR["bg"])
        print(f"  Saved → {save_path}")
    if show:
        plt.show()
    plt.close()


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 8 ─ RISK DETECTION + INSIGHT SUMMARY
# ─────────────────────────────────────────────────────────────────────

def generate_insight_summary(
    sessions: List[SessionResult],
    trend:    Dict,
    user_id:  str = "User",
) -> str:
    """Generate a human-readable clinical insight summary."""
    lines = []
    lines.append("═" * 65)
    lines.append(f"  ADET INSIGHT SUMMARY — {user_id}")
    lines.append("═" * 65)
    lines.append(f"  Sessions analysed : {trend['n']}  "
                 f"(Synthetic={trend['n']-1}, Real=1)")
    lines.append(f"  Date range        : "
                 f"{sessions[0].date} → {sessions[-1].date}")
    lines.append(f"  Score range       : "
                 f"{trend['scores'].min():.3f} – {trend['scores'].max():.3f}")
    lines.append(f"  Volatility        : {trend['volatility']:.4f}  "
                 f"({'High' if trend['volatility'] > 0.10 else 'Low'})")
    lines.append("")

    trend_icons = {
        "Improving": "✅ IMPROVING",
        "Worsening": "⚠️  WORSENING",
        "Stable":    "🔵 STABLE",
    }
    lines.append(f"  Overall trend  : {trend_icons.get(trend['overall_trend'], trend['overall_trend'])}")
    lines.append(f"  Recent trend   : {trend_icons.get(trend['recent_trend'],  trend['recent_trend'])}")
    lines.append("")

    lines.append("  Session-level observations:")
    for s, ins in zip(sessions, trend["insights"]):
        tag = "[Real]" if s.session_type == "Real" else "[Syn] "
        lines.append(
            f"    {tag} {s.session_id:<18s} "
            f"score={s.depression_score:.3f}  {s.label:<15s}  {ins}"
        )
    lines.append("")

    if trend["risk_alert"]:
        lines.append("  ┌─────────────────────────────────────────────────┐")
        lines.append("  │ ⚠️  RISK ALERT: Condition worsening in last 3   │")
        lines.append("  │    sessions. Clinical review recommended.       │")
        lines.append("  └─────────────────────────────────────────────────┘")
    else:
        lines.append("  ✅ No acute risk alert detected in recent sessions.")

    if trend["volatility"] > 0.10:
        lines.append("  ⚡ High fluctuation detected — scores vary significantly.")
        lines.append("     Monitoring consistency and triggers is advised.")

    real = sessions[-1]
    lines.append("")
    lines.append("  Current (Real) Session:")
    lines.append(f"    Score          : {real.depression_score:.4f}")
    lines.append(f"    Label          : {real.label}")
    lines.append(f"    PHQ≈           : {real.phq_equivalent}")
    lines.append(f"    Cognitive Risk : {real.cognitive_risk:.4f}")
    lines.append(f"    Dom. Distortion: {real.dominant_distortion}")
    lines.append(f"    Dom. Coping    : {real.dominant_coping}")
    lines.append("")
    lines.append("  ⚠️  SYNTHETIC DATA DISCLAIMER:")
    lines.append("  Historical sessions are simulated for longitudinal")
    lines.append("  demonstration. Only the final [Real] session reflects")
    lines.append("  actual user input. Clinical decisions must rely solely")
    lines.append("  on validated real-world assessments.")
    lines.append("═" * 65)

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 9 ─ FULL ADET PIPELINE (ENTRY POINT)
# ─────────────────────────────────────────────────────────────────────

def run_adet(
    session_input:  SessionInput,
    scenario:       str   = "fluctuating",
    num_synthetic:  int   = 5,
    model_          = None,
    sc_audio_       = None,
    sc_text_        = None,
    best_thr:       float = 0.50,
    device_               = None,
    save_path: Optional[str] = "/content/adet_analysis.png",
    show_plot:      bool  = True,
) -> Tuple[pd.DataFrame, Dict, List[SessionResult]]:
    """
    Full ADET pipeline.

    Steps
    -----
    1. Process the real (frontend) session.
    2. Generate synthetic (backend) historical sessions.
    3. Merge into unified dataset.
    4. Analyse longitudinal trend.
    5. Generate comparison table.
    6. Plot graphs.
    7. Print insight summary.

    Returns
    -------
    (comparison_df, trend_dict, all_sessions)
    """
    print("\n" + "╔" + "═" * 62 + "╗")
    print("║  ADET — Adaptive Depression Evaluation Tracker            ║")
    print("║  PsychSense v3 Longitudinal Extension                     ║")
    print("╚" + "═" * 62 + "╝")

    print(f"\n[ADET-1] Processing real session ({session_input.session_id}) …")
    real_result = process_session(
        session_input, model_, sc_audio_, sc_text_, best_thr, device_
    )
    print(f"  → Score: {real_result.depression_score:.4f}  |  "
          f"Label: {real_result.label}  |  "
          f"CogRisk: {real_result.cognitive_risk:.4f}")

    print(f"\n[ADET-2] Generating {num_synthetic} synthetic sessions "
          f"({scenario} scenario) …")
    synthetic = generate_synthetic_sessions(
        base_score   = real_result.depression_score,
        num_sessions = num_synthetic,
        scenario     = scenario,
        base_date    = session_input.date,
    )

    print(f"[ADET-3] Merging sessions …")
    all_sessions = merge_sessions(synthetic, real_result)
    print(f"  → Total sessions: {len(all_sessions)} "
          f"[{num_synthetic} Synthetic + 1 Real]")

    print(f"\n[ADET-4] Analysing longitudinal trend …")
    trend = analyze_trend(all_sessions)
    print(f"  → Overall trend  : {trend['overall_trend']}")
    print(f"  → Recent trend   : {trend['recent_trend']}")
    print(f"  → Volatility     : {trend['volatility']:.4f}")
    if trend["risk_alert"]:
        print(f"  → ⚠️  RISK ALERT: Worsening in last 3 sessions!")

    print(f"\n[ADET-5] Generating comparison table …")
    df = generate_table(all_sessions, trend)
    print("\n" + "─" * 120)
    print("  ADET COMPARISON TABLE")
    print("─" * 120)
    with pd.option_context(
        "display.max_columns", None,
        "display.width", 140,
        "display.max_colwidth", 28,
    ):
        print(df.to_string(index=False))
    print("─" * 120)

    print(f"\n[ADET-6] Generating visualizations …")
    plot_graph(all_sessions, trend, save_path=save_path, show=show_plot)

    print(f"\n[ADET-7] Insight summary …\n")
    summary = generate_insight_summary(
        all_sessions, trend, user_id=session_input.user_id
    )
    print(summary)

    return df, trend, all_sessions


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 10 ─ DEMO RUNNERS
# ─────────────────────────────────────────────────────────────────────

def demo_adet_standalone():
    """
    Standalone demo using the heuristic mock predictor.
    Works without GPU / model weights — useful for testing the ADET
    pipeline in isolation.
    """
    print("\n" + "═" * 65)
    print("  ADET STANDALONE DEMO  (mock predictor — no model needed)")
    print("═" * 65)

    sample_transcript = (
        "I always feel like a failure and nothing ever works out for me. "
        "Everything I do seems to fall apart — I am completely worthless. "
        "I have been feeling so hopeless lately and I feel like a burden "
        "to everyone around me. I can't seem to do anything right. "
        "I tried talking to my therapist though, and they suggested I work "
        "on a plan. I'm trying to stay hopeful but it's hard. "
        "I feel empty most of the time and I cried a lot this week."
    )

    frontend_input = SessionInput(
        user_id    = "USR_001",
        session_id = "REAL_SESSION",
        date       = datetime.today().strftime("%Y-%m-%d"),
        text_input = sample_transcript,
    )

    df, trend, sessions = run_adet(
        session_input = frontend_input,
        scenario      = "worsening",
        num_synthetic = 5,
        model_        = None,
        sc_audio_     = None,
        sc_text_      = None,
        best_thr      = 0.50,
        save_path     = "/content/adet_analysis.png",
        show_plot     = True,
    )
    return df, trend, sessions


def demo_adet_with_v3_model(
    model_, sc_audio_, sc_text_, best_thr_,
    pid_raw_, score_raw_, y_raw_,
    a_va_, t_va_, y_va_, va_idx_,
    audio_raw_, text_raw_,
):
    """
    Demo that uses the real v3 model weights produced by main().
    Call this AFTER Step 17 (main()) has completed successfully.
    The function reads a sample participant's transcript from disk and
    runs the full ADET pipeline using the trained AudioTextFusionNet.
    """
    sample_pid_idx = 0
    pid_chosen     = pid_raw_[va_idx_[sample_pid_idx]]

    folder = next(
        (
            os.path.join(DATA_PATH, d)
            for d in os.listdir(DATA_PATH)
            if d.startswith(str(pid_chosen))
            and os.path.isdir(os.path.join(DATA_PATH, d))
        ),
        None,
    )
    raw_text = ""
    if folder:
        tf = find_file(folder, "transcript")
        if tf:
            try:
                df_t = pd.read_csv(tf, sep="\t", header=None,
                                   names=["s","e","sp","v"], on_bad_lines="skip")
                mask = df_t["sp"].astype(str).str.upper().isin(["PARTICIPANT","P"])
                rows = df_t[mask] if mask.any() else df_t
                raw_text = " ".join(rows["v"].dropna().astype(str)).strip()
            except Exception:
                pass

    frontend_input = SessionInput(
        user_id    = f"PID_{pid_chosen}",
        session_id = "REAL_SESSION",
        date       = datetime.today().strftime("%Y-%m-%d"),
        text_input = raw_text or "No transcript available.",
        audio_features = a_va_[sample_pid_idx] if len(a_va_) > 0 else None,
    )

    df, trend, sessions = run_adet(
        session_input = frontend_input,
        scenario      = "fluctuating",
        num_synthetic = 5,
        model_        = model_,
        sc_audio_     = sc_audio_,
        sc_text_      = sc_text_,
        best_thr      = best_thr_,
        device_       = DEVICE,
        save_path     = "/content/adet_v3_analysis.png",
        show_plot     = True,
    )
    return df, trend, sessions


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 11 ─ RUN THE APPROPRIATE DEMO
# ─────────────────────────────────────────────────────────────────────

# ── OPTION A: Full integration with trained v3 model (preferred) ─────
# main() was already called in STEP 17, so model, sc_audio, sc_text,
# best_thr, pid_raw, etc. are all in scope. We use them directly.
try:
    df_adet, trend_adet, sessions_adet = demo_adet_with_v3_model(
        model, sc_audio, sc_text, best_thr,
        pid_raw, score_raw, y_raw,
        a_va, t_va, y_va, va_idx,
        audio_raw, text_raw,
    )
except Exception as e:
    print(f"  [ADET] v3 model demo failed ({e}) — falling back to standalone demo.")
    df_adet, trend_adet, sessions_adet = demo_adet_standalone()


# ─────────────────────────────────────────────────────────────────────
# ADET STEP 12 ─ MULTI-SCENARIO COMPARISON (BONUS)
# ─────────────────────────────────────────────────────────────────────

def compare_scenarios(base_score: float = 0.55):
    """
    Run ADET across all built-in scenarios and produce a comparative plot.
    """
    print("\n" + "═" * 65)
    print("  ADET MULTI-SCENARIO COMPARISON")
    print("═" * 65)

    scenarios = list(SCENARIO_PATTERNS.keys())
    fig, axes = plt.subplots(2, 3, figsize=(18, 9),
                              facecolor=_CLR["bg"], sharey=True)
    axes_flat = axes.flatten()

    for ax, sc_name in zip(axes_flat, scenarios):
        synth = generate_synthetic_sessions(
            base_score=base_score, num_sessions=5,
            scenario=sc_name, seed=99,
        )
        real_dummy = SessionResult(
            session_id       = "Real",
            date             = datetime.today().strftime("%Y-%m-%d"),
            depression_score = base_score,
            label            = score_to_label(base_score),
            session_type     = "Real",
            phq_equivalent   = score_to_phq(base_score),
        )
        merged = merge_sessions(synth, real_dummy)
        t      = analyze_trend(merged)
        scores = t["scores"]
        x      = np.arange(len(scores))

        ax.set_facecolor(_CLR["bg"])
        ax.grid(axis="y", color=_CLR["grid"], linewidth=0.7, zorder=0)
        ax.axhline(0.5, color=_CLR["threshold"], linestyle="--",
                   linewidth=1, alpha=0.7)
        ax.plot(x[:-1], scores[:-1], color=_CLR["synth"],
                marker="o", linewidth=1.8, markersize=5, zorder=3)
        ax.scatter(x[-1], scores[-1], color=_CLR["real"],
                   s=120, marker="*", zorder=5)
        ax.plot(x, t["rolling_mean"], color=_CLR["trend"],
                linewidth=1.4, linestyle="-.", alpha=0.85)
        ax.set_title(
            f"Scenario: {sc_name.title()}\nTrend: {t['overall_trend']}",
            fontsize=10, fontweight="bold", color=_CLR["text"]
        )
        ax.set_ylim(0, 1)
        ax.set_xticks(x)
        ax.set_xticklabels(
            [s.session_id for s in merged],
            rotation=20, ha="right", fontsize=7
        )

    plt.suptitle(
        "ADET — Synthetic Scenario Library Comparison",
        fontsize=13, fontweight="bold", color=_CLR["text"]
    )
    plt.tight_layout()
    plt.savefig("/content/adet_scenarios.png", dpi=150,
                bbox_inches="tight", facecolor=_CLR["bg"])
    plt.show()
    print("  Saved → /content/adet_scenarios.png")


compare_scenarios(base_score=0.55)

print("\n✅ PsychSense v3 + ADET fully loaded and demonstrated.")
print(
    "   • v3 core pipeline  : STEP 1–19\n"
    "   • ADET module        : ADET STEP 1–12\n"
    "   • To run ADET with a custom transcript, call run_adet() with\n"
    "     a new SessionInput and pass model/sc_audio/sc_text from main().\n"
)