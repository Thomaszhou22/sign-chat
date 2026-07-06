#!/usr/bin/env python3
"""
Train a neural network gesture classifier on ASL MediaPipe landmarks data.
Combines multiple Kaggle datasets and exports a browser-compatible model.
"""

import os
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, callbacks

# Configuration
DATA_DIR = Path("data")
MODEL_DIR = Path("models")
DATA_DIR.mkdir(exist_ok=True)
MODEL_DIR.mkdir(exist_ok=True)

# Target labels (ASL letters + numbers + common phrases)
TARGET_LABELS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") + [
    "space", "del", "nothing"
]


def load_kaggle_datasets():
    """Load and combine multiple ASL landmark datasets from Kaggle."""
    datasets = []
    
    # Dataset 1: ASL Gesture Dataset Using Media Pipe
    # https://www.kaggle.com/datasets/jaisuryaprabu/sign-language-landmarks
    csv1 = DATA_DIR / "asl_landmarks_final.csv"
    if csv1.exists():
        print(f"Loading {csv1}...")
        df1 = pd.read_csv(csv1)
        datasets.append(df1)
        print(f"  Loaded {len(df1)} samples")
    
    # Dataset 2: MediaPipe Processed ASL Dataset
    csv2 = DATA_DIR / "mediapipe_processed_asl.csv"
    if csv2.exists():
        print(f"Loading {csv2}...")
        df2 = pd.read_csv(csv2)
        datasets.append(df2)
        print(f"  Loaded {len(df2)} samples")
    
    # Dataset 3: ASL Landmarks Mediapipe Dataset
    csv3 = DATA_DIR / "asl_landmarks_mediapipe.csv"
    if csv3.exists():
        print(f"Loading {csv3}...")
        df3 = pd.read_csv(csv3)
        datasets.append(df3)
        print(f"  Loaded {len(df3)} samples")
    
    if not datasets:
        raise ValueError(
            "No datasets found. Please download from Kaggle:\n"
            "1. https://www.kaggle.com/datasets/jaisuryaprabu/sign-language-landmarks\n"
            "2. https://www.kaggle.com/datasets/vignonantoine/mediapipe-processed-asl-dataset\n"
            "3. https://www.kaggle.com/datasets/mohdarfashaikh/asl-landmarks-mediapipe-dataset-for-sign-language"
        )
    
    # Combine all datasets
    combined = pd.concat(datasets, ignore_index=True)
    print(f"\nCombined dataset: {len(combined)} samples")
    
    return combined


def preprocess_data(df):
    """Clean and preprocess the landmark data."""
    print("\nPreprocessing data...")
    
    # Identify landmark columns (should be 63: 21 landmarks × 3 coords)
    landmark_cols = [col for col in df.columns if any(
        col.startswith(prefix) for prefix in ['x_', 'y_', 'z_', 'lm_', 'landmark']
    )]
    
    # If columns are named like 0_x, 0_y, 0_z, etc.
    if not landmark_cols:
        landmark_cols = [col for col in df.columns if col not in ['label', 'class', 'sign']]
    
    # Identify label column
    label_col = None
    for col in ['label', 'class', 'sign']:
        if col in df.columns:
            label_col = col
            break
    
    if not label_col:
        raise ValueError("Could not find label column")
    
    print(f"  Label column: {label_col}")
    print(f"  Landmark columns: {len(landmark_cols)}")
    
    # Extract features and labels
    X = df[landmark_cols].values
    y = df[label_col].values
    
    # Normalize labels (lowercase, strip whitespace)
    y = np.array([str(label).lower().strip() for label in y])
    
    # Filter out samples with missing landmarks
    valid_mask = ~np.isnan(X).any(axis=1)
    X = X[valid_mask]
    y = y[valid_mask]
    print(f"  Samples after removing NaN: {len(X)}")
    
    # Normalize landmarks (make translation invariant)
    # Subtract the mean of each sample (center the hand)
    X = X.reshape(len(X), -1, 3)  # Reshape to (samples, landmarks, xyz)
    X = X - X.mean(axis=1, keepdims=True)  # Center on palm
    X = X.reshape(len(X), -1)  # Flatten back
    
    # Scale features
    scaler = StandardScaler()
    X = scaler.fit_transform(X)
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)
    
    # Get class names
    class_names = label_encoder.classes_
    print(f"  Classes: {len(class_names)}")
    print(f"  Class distribution:")
    for cls in sorted(set(y)):
        count = (y == cls).sum()
        print(f"    {cls}: {count}")
    
    return X, y_encoded, class_names, scaler, label_encoder


def build_model(input_dim, num_classes):
    """Build a neural network for gesture classification."""
    model = models.Sequential([
        # Input layer
        layers.Dense(256, activation='relu', input_shape=(input_dim,)),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        # Hidden layers
        layers.Dense(128, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        
        layers.Dense(64, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        
        # Output layer
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def train_model(X_train, y_train, X_val, y_val, num_classes):
    """Train the model with early stopping."""
    print("\nTraining model...")
    
    model = build_model(X_train.shape[1], num_classes)
    model.summary()
    
    # Callbacks
    early_stop = callbacks.EarlyStopping(
        monitor='val_accuracy',
        patience=15,
        restore_best_weights=True,
        verbose=1
    )
    
    reduce_lr = callbacks.ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
    
    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=[early_stop, reduce_lr],
        verbose=1
    )
    
    return model, history


def evaluate_model(model, X_test, y_test, class_names):
    """Evaluate the model and print detailed metrics."""
    print("\nEvaluating model...")
    
    y_pred = model.predict(X_test, verbose=0)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    accuracy = accuracy_score(y_test, y_pred_classes)
    print(f"\nTest Accuracy: {accuracy:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(
        y_test, y_pred_classes,
        target_names=class_names,
        zero_division=0
    ))
    
    return accuracy


def export_model(model, class_names, scaler, label_encoder):
    """Export the model for browser use."""
    print("\nExporting model for browser...")
    
    # Save TensorFlow model
    model_path = MODEL_DIR / "gesture_classifier.h5"
    model.save(model_path)
    print(f"  Saved TF model: {model_path}")
    
    # Convert to TensorFlow.js format
    import tensorflowjs as tfjs
    tfjs_path = MODEL_DIR / "tfjs_model"
    tfjs_path.mkdir(exist_ok=True)
    tfjs.converters.save_keras_model(model, str(tfjs_path))
    print(f"  Saved TF.js model: {tfjs_path}")
    
    # Export as JSON (for lightweight browser inference)
    model_json = {
        'architecture': model.to_json(),
        'weights': [],
        'class_names': list(class_names),
        'scaler_mean': scaler.mean_.tolist(),
        'scaler_scale': scaler.scale_.tolist(),
        'label_mapping': {
            int(k): v for k, v in zip(
                label_encoder.transform(class_names),
                class_names
            )
        }
    }
    
    # Extract weights
    for layer in model.layers:
        weights = layer.get_weights()
        if weights:
            model_json['weights'].append({
                'name': layer.name,
                'weights': [w.tolist() for w in weights]
            })
    
    json_path = MODEL_DIR / "gesture_classifier.json"
    with open(json_path, 'w') as f:
        json.dump(model_json, f)
    
    print(f"  Saved JSON model: {json_path}")
    print(f"  Model size: {json_path.stat().st_size / 1024:.1f} KB")


def main():
    print("=" * 60)
    print("ASL Gesture Classifier Training Pipeline")
    print("=" * 60)
    
    # Load data
    df = load_kaggle_datasets()
    
    # Preprocess
    X, y, class_names, scaler, label_encoder = preprocess_data(df)
    
    # Split data
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
    )
    
    print(f"\nDataset splits:")
    print(f"  Training: {len(X_train)}")
    print(f"  Validation: {len(X_val)}")
    print(f"  Test: {len(X_test)}")
    
    # Train
    model, history = train_model(X_train, y_train, X_val, y_val, len(class_names))
    
    # Evaluate
    accuracy = evaluate_model(model, X_test, y_test, class_names)
    
    # Export
    export_model(model, class_names, scaler, label_encoder)
    
    print("\n" + "=" * 60)
    print(f"Training complete! Final accuracy: {accuracy:.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
