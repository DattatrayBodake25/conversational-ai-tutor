# importing all libraries
import os
import re
import string
from dotenv import load_dotenv
from typing_extensions import List, TypedDict
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START

load_dotenv()

KB_PATH = "./knowledge_base"
DB_PATH = os.getenv("VECTOR_DB_PATH", "./vector_store/")
EMBED_MODEL = "BAAI/bge-small-en-v1.5"


def preprocess_text(text: str):
    """
    Clean and normalize text extracted from PDFs.
    Removes punctuation, extra spaces, metadata, and converts to lowercase.
    Returns cleaned text and metadata dictionary.
    """
    text = text.strip()
    text = " ".join(text.split())
    text = re.sub(r'\(.*?\)', '', text)  # Remove text in parentheses

    # Extract metadata if present
    source_match = re.search(r'source:\s*(.*)', text)
    focus_area_match = re.search(r'focus_area:\s*(.*)', text)
    metadata = {
        "source": source_match.group(1) if source_match else "",
        "focus_area": focus_area_match.group(1) if focus_area_match else ""
    }

    # Remove metadata from text
    text = re.sub(r'source:.*', '', text)
    text = re.sub(r'focus_area:.*', '', text)

    # Remove punctuation and lowercase
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = text.lower()

    return text, metadata


def load_and_split_pdfs():
    """
    Load all PDFs from the knowledge base directory,
    preprocess text, and split into smaller chunks.
    """
    documents = []
    for file in os.listdir(KB_PATH):
        if file.endswith(".pdf"):
            loader = PyPDFLoader(os.path.join(KB_PATH, file))
            docs = loader.load()

            for doc in docs:
                cleaned_text, meta = preprocess_text(doc.page_content)
                doc.page_content = cleaned_text
                doc.metadata.update(meta)

            documents.extend(docs)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    return splitter.split_documents(documents)


def create_vector_store():
    """
    Create FAISS vector store from PDF documents using HuggingFace embeddings.
    Saves the vector store locally.
    """
    docs = load_and_split_pdfs()
    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    vectorstore = FAISS.from_documents(docs, embeddings)
    vectorstore.save_local(DB_PATH)
    return vectorstore


def load_vector_store():
    """
    Load existing FAISS vector store from disk.
    """
    embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    return FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)


class State(TypedDict):
    question: str
    context: List[Document]
    answer: str


# ✅ Added max_tokens to limit output length
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    max_tokens=200
)


def retrieve(state: State):
    """
    Retrieve relevant document chunks from FAISS vector store based on query.
    """
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
    retrieved_docs = retriever.invoke(state["question"])
    return {"context": retrieved_docs}


def generate(state: State):
    """
    Generate answer using OpenAI LLM based on retrieved context.
    Returns answer string.
    """
    if not state["context"]:
        return {"answer": "Sorry, no relevant information found."}

    docs_content = "\n\n".join(doc.page_content for doc in state["context"])

    # ✅ Updated prompt for concise answers
    template = """
    You are an AI tutor. Use the following context to answer the user’s question.
    Keep your answer **concise and clear (max 4-5 sentences)**.
    If you cannot find the answer in the context, say:
    "Sorry, I couldn't find relevant information."

    Question: {question}
    Context: {context}
    Answer:
    """
    prompt = PromptTemplate.from_template(template).format(
        question=state["question"], context=docs_content
    )

    response = llm.invoke(prompt)
    return {"answer": response.content.strip()}


def build_rag_pipeline():
    """
    Build LangGraph pipeline: retrieval → generation sequence.
    """
    graph_builder = StateGraph(State).add_sequence([retrieve, generate])
    graph_builder.add_edge(START, "retrieve")
    return graph_builder.compile()


# Initialize FAISS vector store
index_file = os.path.join(DB_PATH, "index.faiss")
if not os.path.exists(index_file):
    print("No FAISS index found. Creating new vector store...")
    vectorstore = create_vector_store()
else:
    print("Loading existing FAISS vector store...")
    vectorstore = load_vector_store()

rag_graph = build_rag_pipeline()
