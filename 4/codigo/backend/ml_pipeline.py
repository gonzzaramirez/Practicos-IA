"""
Pipeline de Machine Learning para clasificacion con RNA
Dataset: Titanic
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    confusion_matrix, accuracy_score, precision_score, 
    recall_score, f1_score, classification_report
)
from imblearn.over_sampling import SMOTE
import time
import warnings
warnings.filterwarnings('ignore')


class MLPipeline:
    def __init__(self):
        self.scaler = StandardScaler()
        self.models = {}
        self.results = {}
        self.X_train = None
        self.X_val = None
        self.X_test = None
        self.y_train = None
        self.y_val = None
        self.y_test = None
        
    def load_data(self):
        """Carga el dataset Titanic desde URL"""
        url = "https://raw.githubusercontent.com/datasciencedojo/datasets/master/titanic.csv"
        self.df = pd.read_csv(url)
        return self.df
    
    def preprocess_data(self):
        """Preprocesamiento completo de datos"""
        df = self.df.copy()
        
        # Eliminar columnas no relevantes
        df = df.drop(['PassengerId', 'Name', 'Ticket', 'Cabin'], axis=1)
        
        # Tratamiento de valores nulos
        df['Age'].fillna(df['Age'].median(), inplace=True)
        df['Embarked'].fillna(df['Embarked'].mode()[0], inplace=True)
        
        # Codificacion de variables categoricas
        df['Sex'] = LabelEncoder().fit_transform(df['Sex'])
        df = pd.get_dummies(df, columns=['Embarked'], drop_first=True)
        
        # Separar features y target
        X = df.drop('Survived', axis=1)
        y = df['Survived']
        
        # Division train/val/test (60/20/20)
        X_temp, self.X_test, y_temp, self.y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        self.X_train, self.X_val, self.y_train, self.y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
        )
        
        # Balanceo con SMOTE
        smote = SMOTE(random_state=42)
        self.X_train, self.y_train = smote.fit_resample(self.X_train, self.y_train)
        
        # Escalado
        self.X_train = self.scaler.fit_transform(self.X_train)
        self.X_val = self.scaler.transform(self.X_val)
        self.X_test = self.scaler.transform(self.X_test)
        
        return {
            "train_size": len(self.X_train),
            "val_size": len(self.X_val),
            "test_size": len(self.X_test)
        }
    
    def create_models(self):
        """Define 3 modelos con diferentes configuraciones"""
        self.models = {
            "Modelo 1 - Adam/ReLU": MLPClassifier(
                hidden_layer_sizes=(64, 32),
                activation='relu',
                solver='adam',
                learning_rate_init=0.001,
                max_iter=500,
                random_state=42,
                early_stopping=True,
                validation_fraction=0.1
            ),
            "Modelo 2 - SGD/Tanh": MLPClassifier(
                hidden_layer_sizes=(128, 64, 32),
                activation='tanh',
                solver='sgd',
                learning_rate='adaptive',
                learning_rate_init=0.01,
                max_iter=500,
                random_state=42,
                early_stopping=True,
                validation_fraction=0.1
            ),
            "Modelo 3 - LBFGS/Logistic": MLPClassifier(
                hidden_layer_sizes=(50,),
                activation='logistic',
                solver='lbfgs',
                max_iter=500,
                random_state=42
            )
        }
        return list(self.models.keys())
    
    def train_and_evaluate(self):
        """Entrena y evalua todos los modelos"""
        for name, model in self.models.items():
            start_time = time.time()
            
            # Entrenamiento
            model.fit(self.X_train, self.y_train)
            training_time = time.time() - start_time
            
            # Predicciones
            y_train_pred = model.predict(self.X_train)
            y_val_pred = model.predict(self.X_val)
            y_test_pred = model.predict(self.X_test)
            
            # Metricas de entrenamiento
            train_metrics = self._calculate_metrics(self.y_train, y_train_pred)
            
            # Metricas de validacion
            val_metrics = self._calculate_metrics(self.y_val, y_val_pred)
            
            # Metricas de test
            test_metrics = self._calculate_metrics(self.y_test, y_test_pred)
            
            # Matriz de confusion (test)
            cm = confusion_matrix(self.y_test, y_test_pred)
            
            # Cross-validation
            cv_scores = cross_val_score(model, self.X_train, self.y_train, cv=5)
            
            self.results[name] = {
                "training_time": round(training_time, 4),
                "train": train_metrics,
                "validation": val_metrics,
                "test": test_metrics,
                "confusion_matrix": cm.tolist(),
                "cv_mean": round(cv_scores.mean(), 4),
                "cv_std": round(cv_scores.std(), 4),
                "overfitting_gap": round(train_metrics["accuracy"] - val_metrics["accuracy"], 4)
            }
        
        return self.results
    
    def _calculate_metrics(self, y_true, y_pred):
        """Calcula metricas de clasificacion"""
        return {
            "accuracy": round(accuracy_score(y_true, y_pred), 4),
            "precision": round(precision_score(y_true, y_pred), 4),
            "recall": round(recall_score(y_true, y_pred), 4),
            "f1_score": round(f1_score(y_true, y_pred), 4)
        }
    
    def get_best_model(self):
        """Retorna el mejor modelo basado en F1-Score de validacion"""
        best_name = max(
            self.results, 
            key=lambda x: self.results[x]["validation"]["f1_score"]
        )
        return {
            "name": best_name,
            "metrics": self.results[best_name]
        }
    
    def run_pipeline(self):
        """Ejecuta el pipeline completo"""
        print("Cargando datos...")
        self.load_data()
        
        print("Preprocesando datos...")
        data_info = self.preprocess_data()
        
        print("Creando modelos...")
        model_names = self.create_models()
        
        print("Entrenando y evaluando modelos...")
        results = self.train_and_evaluate()
        
        print("Pipeline completado!")
        
        best = self.get_best_model()
        
        return {
            "data_info": data_info,
            "models": model_names,
            "results": results,
            "best_model": best
        }


if __name__ == "__main__":
    pipeline = MLPipeline()
    output = pipeline.run_pipeline()
    
    print("\n" + "="*60)
    print("RESULTADOS")
    print("="*60)
    
    for name, metrics in output["results"].items():
        print(f"\n{name}")
        print("-"*40)
        print(f"Tiempo de entrenamiento: {metrics['training_time']}s")
        print(f"Train Accuracy: {metrics['train']['accuracy']}")
        print(f"Val Accuracy: {metrics['validation']['accuracy']}")
        print(f"Test Accuracy: {metrics['test']['accuracy']}")
        print(f"F1-Score (Test): {metrics['test']['f1_score']}")
        print(f"Gap Overfitting: {metrics['overfitting_gap']}")
    
    print("\n" + "="*60)
    print(f"MEJOR MODELO: {output['best_model']['name']}")
    print("="*60)

