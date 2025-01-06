import streamlit as st
import uuid
from typing import Dict, Any
from langchain_core.messages import BaseMessage, AIMessage, HumanMessage

from main import create_app

def process_request(
    app,
    user_input: str,
    thread_id: str = "user_session",
    config: Dict[str, Any] = None) -> BaseMessage:
    """
    Process a user request and return the last response message
    
    Args:
        app: Compiled LangGraph application
        user_input: User's message
        thread_id: Session identifier for state persistence
        config: Additional configuration options
    
    Returns:
        The last message from the conversation as a BaseMessage
    """
    full_config = {
        "configurable": {
            "thread_id": thread_id,
            **(config or {})
        }
    }
    
    input_messages = [HumanMessage(content=user_input)]
    
    try:
        result = app.invoke({"messages": input_messages}, full_config)
        return result["messages"][-1]
    except Exception as e:
        print(f"Error processing request: {str(e)}")  # For debugging
        return AIMessage(content=f"Error processing request: {str(e)}")

def create_streamlit_interface():
    """Create and run the Streamlit interface"""
    st.set_page_config(
        page_title="InkIt Contract Generator",
        page_icon="📄",
        layout="wide"
    )
    
    st.title("InkIt Contract Generator")
    st.markdown("""
    Welcome to InkIt! I can help you generate real estate sales contracts.
    Just tell me about the property and terms you'd like to include.
    """)
    
    # Initialize session state
    if "app" not in st.session_state:
        st.session_state.app = create_app()
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "session_id" not in st.session_state:
        st.session_state.session_id = str(uuid.uuid4())
    
    # Chat interface
    chat_container = st.container()
    with chat_container:
        # Display chat messages
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.write(message["content"])
    
        # Handle user input
        if prompt := st.chat_input("Type your message here..."):
            # Add user message to chat
            st.session_state.messages.append({
                "role": "user",
                "content": prompt
            })
            
            # Get AI response
            with st.chat_message("user"):
                st.write(prompt)
            
            with st.chat_message("assistant"):
                with st.spinner("Thinking..."):
                    response = process_request(
                        st.session_state.app,
                        prompt,
                        thread_id=st.session_state.session_id
                    )
                    response_content = response.content
                    st.write(response_content)

if __name__ == "__main__":
    create_streamlit_interface()