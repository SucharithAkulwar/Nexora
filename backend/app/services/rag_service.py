import re
import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.core.database import get_db

logger = logging.getLogger("nexora.rag")


class PatientIsolatedRAGService:
    """
    RAG ingestion and retrieval service with strict patient boundary isolation.
    Chunks medical records, builds vector indexes, and searches only within
    authorized patient documents.
    """

    def __init__(self):
        pass

    def chunk_text(self, text: str, chunk_size: int = 250, overlap: int = 50) -> List[str]:
        """Split text into coherent semantic clinical chunks."""
        if not text:
            return []
        
        # Split on sentence boundaries and headers
        sentences = re.split(r'(?<=[.!?\n])\s+', text)
        chunks = []
        current_chunk = []
        current_len = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            words = sentence.split()
            sentence_len = len(words)

            if current_len + sentence_len > chunk_size and current_chunk:
                chunks.append(" ".join(current_chunk))
                # Retain overlap words
                overlap_words = " ".join(current_chunk).split()[-overlap:]
                current_chunk = overlap_words + words
                current_len = len(current_chunk)
            else:
                current_chunk.extend(words)
                current_len += sentence_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks if chunks else [text]

    async def ingest_record(self, patient_id: str, record_id: str, title: str, text: str, record_type: str = "Lab") -> int:
        """
        Store processed text chunks for a medical record in the database,
        isolated strictly by patient_id.
        """
        db = get_db()
        chunks = self.chunk_text(text)
        
        # Clean existing chunks for this record
        await db["rag_chunks"].delete_one({"record_id": record_id})
        
        for idx, chunk in enumerate(chunks):
            chunk_doc = {
                "patient_id": patient_id,
                "record_id": record_id,
                "title": title,
                "record_type": record_type,
                "chunk_index": idx,
                "text": chunk,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db["rag_chunks"].insert_one(chunk_doc)
            
        return len(chunks)

    async def query_patient_records(
        self,
        patient_id: str,
        query: str,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant clinical chunks for a patient.
        CRITICAL: Query MUST filter by patient_id to prevent any cross-patient record leakage.
        """
        db = get_db()
        cursor = db["rag_chunks"].find({"patient_id": patient_id})
        chunks_docs = await cursor.to_list(length=100)
        
        # If no chunks in db yet, inspect medical_records collection directly
        if not chunks_docs:
            rec_cursor = db["medical_records"].find({"patient_id": patient_id})
            records = await rec_cursor.to_list(length=20)
            for r in records:
                txt = r.get("extracted_text") or r.get("summary") or ""
                if txt:
                    await self.ingest_record(
                        patient_id=patient_id,
                        record_id=r["_id"],
                        title=r.get("title", "Medical Record"),
                        text=txt,
                        record_type=r.get("record_type", "Lab")
                    )
            cursor = db["rag_chunks"].find({"patient_id": patient_id})
            chunks_docs = await cursor.to_list(length=100)

        if not chunks_docs:
            return []

        corpus = [doc["text"] for doc in chunks_docs]
        query_text = query.strip()
        
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus + [query_text])
            query_vec = tfidf_matrix[-1]
            doc_vecs = tfidf_matrix[:-1]
            
            sim_scores = cosine_similarity(query_vec, doc_vecs)[0]
            
            ranked_results = []
            for idx, score in enumerate(sim_scores):
                doc = chunks_docs[idx]
                ranked_results.append({
                    "record_id": doc.get("record_id"),
                    "title": doc.get("title"),
                    "record_type": doc.get("record_type"),
                    "text": doc.get("text"),
                    "similarity_score": round(float(score), 4)
                })

            ranked_results.sort(key=lambda x: x["similarity_score"], reverse=True)
            # Filter matches with positive relevance
            meaningful = [r for r in ranked_results if r["similarity_score"] > 0.05]
            return meaningful[:top_k] if meaningful else ranked_results[:2]
        except Exception as e:
            logger.warning(f"TF-IDF vector matching failed: {e}. Falling back to keyword search.")
            q_words = set(query.lower().split())
            scored = []
            for doc in chunks_docs:
                txt_words = set(doc["text"].lower().split())
                overlap = len(q_words.intersection(txt_words))
                scored.append({
                    "record_id": doc.get("record_id"),
                    "title": doc.get("title"),
                    "record_type": doc.get("record_type"),
                    "text": doc.get("text"),
                    "similarity_score": round(overlap / max(len(q_words), 1), 4)
                })
            scored.sort(key=lambda x: x["similarity_score"], reverse=True)
            return scored[:top_k]


rag_service = PatientIsolatedRAGService()
