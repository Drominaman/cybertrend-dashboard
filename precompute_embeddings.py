import os
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from tqdm import tqdm
import time

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Read your database
csv_url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcLWviAhPQSQ1iKYxFF1EjVpIWpzKv-Hfsw3KXPnvwMLA_F42y5aHAGhBJnHimMgeYoUqorn5WKqvH/pub?output=csv"
df = pd.read_csv(csv_url)

# Safety check
if 'Stat' not in df.columns:
    raise ValueError("The 'Stat' column is missing!")

# Only keep needed columns
df = df[['Stat']].dropna().reset_index(drop=True)

# Check if already partially done
if os.path.exists('precomputed_embeddings_partial.pkl'):
    print("🔄 Loading previous partial progress...")
    partial_df = pd.read_pickle('precomputed_embeddings_partial.pkl')
    already_done = set(partial_df.index)
else:
    partial_df = pd.DataFrame(columns=['embedding'])
    already_done = set()

batch_size = 100
total_rows = len(df)
all_embeddings = partial_df.copy()

print(f"Starting embedding {total_rows} rows...")

# Function to batch embed
def batch_embed(text_list):
    response = client.embeddings.create(
        input=text_list,
        model="text-embedding-ada-002"
    )
    return [item.embedding for item in response.data]

# Start embedding
for start_idx in tqdm(range(0, total_rows, batch_size)):
    end_idx = min(start_idx + batch_size, total_rows)
    batch_indices = range(start_idx, end_idx)

    # Skip if already embedded
    if all(idx in already_done for idx in batch_indices):
        continue

    batch_texts = df.loc[batch_indices, 'Stat'].tolist()

    try:
        batch_embeddings = batch_embed(batch_texts)
        for i, embedding in zip(batch_indices, batch_embeddings):
            all_embeddings.loc[i, 'embedding'] = embedding
        # Save partial progress after every batch
        all_embeddings.to_pickle('precomputed_embeddings_partial.pkl')
    except Exception as e:
        print(f"⚠️ Error during batch {start_idx}–{end_idx}: {e}")
        print("Waiting 5 seconds before retrying...")
        time.sleep(5)
        continue

# Save final file
all_embeddings['Stat'] = df['Stat']
all_embeddings = all_embeddings[['Stat', 'embedding']]  # Order columns

all_embeddings.to_pickle('precomputed_embeddings.pkl')
if os.path.exists('precomputed_embeddings_partial.pkl'):
    os.remove('precomputed_embeddings_partial.pkl')

print("✅ All embeddings complete! Saved as 'precomputed_embeddings.pkl'.")