# Mocked Vector Store for RAG Pipeline

import faiss
import numpy as np

# Simple mock embedding generation
def mock_embedding(text: str) -> np.ndarray:
    # Just generating a random 128-d vector for the mock
    # In reality, this would be a local sentence-transformer call
    return np.random.rand(128).astype('float32')

class VectorStore:
    def __init__(self, dimension: int = 128):
        self.dimension = dimension
        # L2 distance index
        self.index = faiss.IndexFlatL2(dimension)
        self.documents = [] # Maps index id to document content
        
    def add_texts(self, texts: list[str]):
        if not texts: return
        
        # Generate embeddings
        embeddings = np.array([mock_embedding(t) for t in texts])
        
        # Add to FAISS index
        self.index.add(embeddings)
        self.documents.extend(texts)
        
    def similarity_search(self, query: str, k: int = 3) -> list[str]:
        if self.index.ntotal == 0:
            return []
            
        query_embedding = np.array([mock_embedding(query)])
        
        # Search the index
        distances, indices = self.index.search(query_embedding, min(k, self.index.ntotal))
        
        results = []
        for i in indices[0]:
            if i != -1 and i < len(self.documents):
                results.append(self.documents[i])
                
        return results

# Singleton instance
vector_store = VectorStore()
