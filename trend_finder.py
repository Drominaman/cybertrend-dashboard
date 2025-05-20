import streamlit as st
import os
import pandas as pd

# Load precomputed data
if os.path.exists('precomputed_embeddings.pkl'):
    df = pd.read_pickle('precomputed_embeddings.pkl')
else:
    st.error("❗ Precomputed embeddings not found. Please run precompute_embeddings.py first.")
    st.stop()
from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from openai import OpenAI
from sklearn.cluster import DBSCAN

# Initialize OpenAI client
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_claim(texts):
    sample_texts = texts[:10]  # Limit to first 10 findings to avoid hitting token limits
    prompt = (
        "Summarize these cybersecurity findings into a short, clear trend headline (10-20 words):\n\n"
        + "\n".join(f"- {t}" for t in sample_texts)
    )
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

# Embed your texts
def get_embedding(stat_text):
    response = client.embeddings.create(
        input=[stat_text],
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def cluster_trends(embeddings, eps=0.15, min_samples=2):
    vectors = np.vstack(embeddings.values)
    similarity_matrix = cosine_similarity(vectors)

    # Clip similarity values to be within [0, 1]
    similarity_matrix = np.clip(similarity_matrix, 0, 1)

    distance_matrix = 1 - similarity_matrix

    clustering = DBSCAN(eps=eps, min_samples=min_samples, metric="precomputed")
    labels = clustering.fit_predict(distance_matrix)

    clusters = {}
    for idx, label in enumerate(labels):
        if label == -1:
            continue  # noise, skip
        clusters.setdefault(label, []).append(idx)
    return clusters

clusters = cluster_trends(df['embedding'])

st.title("🧠 Similar Cybersecurity Trends")

if clusters:
    for label, indices in clusters.items():
        with st.expander(f"Detected Cluster {label} ({len(indices)} reports)"):
            texts = [df.iloc[i]['Stat'] for i in indices]
            suggested_claim = generate_claim(texts)
            edited_claim = st.text_input("Suggested Trend Headline:", value=suggested_claim, key=f"claim_{label}")
            st.subheader(f"🚨 {edited_claim}")

            st.markdown("**Sources:**")
            for i in indices:
                stat = df.iloc[i].get('Stat', 'Unknown Stat')
                resource_name = df.iloc[i].get('Resource Name', 'Unknown Resource')
                date = df.iloc[i].get('Date', 'Unknown Date')
                link = df.iloc[i].get('Link', None)

                if link:
                    st.markdown(f'- "{stat}" — *[{resource_name}]({link})* ({date})')
                else:
                    st.markdown(f'- "{stat}" — *{resource_name}* ({date})')
else:
    st.info("No strong trend groups found.")