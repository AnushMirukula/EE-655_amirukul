

import streamlit as st
import pandas as pd
from sklearn import datasets
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score

def load_data(dataset_name):
    if dataset_name == 'IRIS':
        data = datasets.load_iris()
    elif dataset_name == 'Digits':
        data = datasets.load_digits()
    else:
        data = None
    return data

def get_classifier(classifier_name):
    if classifier_name == 'Logistic Regression':
        return LogisticRegression()
    elif classifier_name == 'Neural Network':
        return MLPClassifier(hidden_layer_sizes=(100, ), max_iter=1000)
    elif classifier_name == 'Naïve Bayes':
        return GaussianNB()
    else:
        return None

def main():
    st.title("Streamlit ML App")

    # Data selection
    dataset_name = st.sidebar.radio("Select Dataset", ('IRIS', 'Digits'))
    data = load_data(dataset_name)
    X = data.data
    y = data.target

    # Model selection
    classifier_name = st.sidebar.selectbox("Select Classifier", ('Logistic Regression', 'Neural Network', 'Naïve Bayes'))
    classifier = get_classifier(classifier_name)

    # User Input
    st.sidebar.subheader("Input Values")
    user_inputs = []
    for i in range(len(X[0])):
        user_input = st.sidebar.number_input(f"Feature {i+1}", value=0.0)
        user_inputs.append(user_input)

    # Prediction
    if st.sidebar.button("Predict"):
        X_scaled = StandardScaler().fit_transform(X)
        X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

        classifier.fit(X_train, y_train)
        prediction = classifier.predict([user_inputs])

        st.write(f"Prediction: {prediction[0]}")

if __name__ == "__main__":
    main()
